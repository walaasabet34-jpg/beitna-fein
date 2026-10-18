import type {
  Chapter, Condition, Effect, GameState, StoryNode, Vars, VarKey, Variant, Option,
  Hotspot, HubNode, KitchenParams, BedParams, Expr,
} from './types';

export const VAR_KEYS: VarKey[] = ['trust', 'safety', 'openness', 'autonomy', 'distress'];
export const DEFAULT_VARS: Vars = { trust: 15, safety: 20, openness: 10, autonomy: 50, distress: 60 };
export const SAVE_VERSION = 1;
const MAX_SLOT = 5;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ── Conditions ──────────────────────────────────────────────
export function evaluate(c: Condition | undefined, s: GameState): boolean {
  if (!c) return true;
  if ('all' in c) return c.all.every((x) => evaluate(x, s));
  if ('any' in c) return c.any.some((x) => evaluate(x, s));
  if ('not' in c) return !evaluate(c.not, s);
  if ('var' in c) return range(s.vars[c.var], c.gte, c.lte);
  if ('flag' in c) {
    const v = s.flags[c.flag];
    if (c.eq !== undefined) return v === c.eq;
    if (c.gte !== undefined || c.lte !== undefined) return range(typeof v === 'number' ? v : 0, c.gte, c.lte);
    return !!v;
  }
  if ('money' in c) return range(s.money, c.money.gte, c.money.lte);
  if ('slot' in c) return range(s.slot, c.slot.gte, c.slot.lte);
  if ('visited' in c) return s.visited.includes(c.visited);
  return false;
}
function range(v: number, gte?: number, lte?: number) {
  return (gte === undefined || v >= gte) && (lte === undefined || v <= lte);
}

// ── Effects ─────────────────────────────────────────────────
export function applyEffect(s: GameState, e?: Effect): GameState {
  if (!e) return s;
  const n: GameState = { ...s, vars: { ...s.vars }, flags: { ...s.flags } };
  if (e.vars) for (const k of Object.keys(e.vars) as VarKey[]) n.vars[k] = clamp(n.vars[k] + (e.vars[k] ?? 0));
  if (e.flags) Object.assign(n.flags, e.flags);
  if (e.inc) for (const [k, d] of Object.entries(e.inc)) n.flags[k] = (typeof n.flags[k] === 'number' ? (n.flags[k] as number) : 0) + d;
  if (e.money) n.money = Math.max(0, n.money + e.money);
  if (e.slots) n.slot = Math.min(MAX_SLOT, n.slot + e.slots);
  if (e.setTime) {
    if (e.setTime.day !== undefined) n.day = e.setTime.day;
    if (e.setTime.slot !== undefined) n.slot = e.setTime.slot;
  }
  if (e.likes) n.likes = [...new Set([...s.likes, ...e.likes])];
  if (e.dislikes) n.dislikes = [...new Set([...s.dislikes, ...e.dislikes])];
  return n;
}

// ── Chapter indexing (supports implicit "next = following node") ──
export interface IndexedChapter {
  chapter: Chapter;
  byId: Map<string, StoryNode>;
  nextOf: Map<string, string | undefined>;
}
export function indexChapter(chapter: Chapter): IndexedChapter {
  const byId = new Map<string, StoryNode>();
  const nextOf = new Map<string, string | undefined>();
  chapter.nodes.forEach((n, i) => {
    if (byId.has(n.id)) throw new Error(`Duplicate node id: ${n.id}`);
    byId.set(n.id, n);
    const explicit = (n as { next?: string }).next ?? (n.type === 'branch' ? n.else : undefined);
    nextOf.set(n.id, explicit ?? chapter.nodes[i + 1]?.id);
  });
  return { chapter, byId, nextOf };
}

export function getNode(ic: IndexedChapter, id: string): StoryNode {
  const n = ic.byId.get(id);
  if (!n) throw new Error(`Unknown node: ${id}`);
  return n;
}

// ── State creation ──────────────────────────────────────────
export function newGame(ic: IndexedChapter, carry?: Partial<GameState>): GameState {
  const { init } = ic.chapter;
  const base: GameState = {
    version: SAVE_VERSION,
    chapter: ic.chapter.id,
    node: ic.chapter.start,
    scene: init.scene,
    day: init.day,
    slot: init.slot,
    money: init.money,
    vars: { ...DEFAULT_VARS, ...(init.vars ?? {}) },
    flags: {},
    likes: [],
    dislikes: [],
    visited: [],
    ...carry,
  };
  return enter(ic, base, ic.chapter.start);
}

// ── Navigation ──────────────────────────────────────────────
/** Enter a node: apply its effects, switch scene, auto-resolve branches/hub exits. */
export function enter(ic: IndexedChapter, s: GameState, id: string, depth = 0): GameState {
  if (depth > 60) throw new Error(`Branch loop near ${id}`);
  const node = getNode(ic, id);
  let n: GameState = { ...s, node: id, visited: s.visited.includes(id) ? s.visited : [...s.visited, id] };
  if (node.scene) n.scene = node.scene;
  n = applyEffect(n, node.effects);

  if (node.type === 'branch') {
    const hit = node.cases.find((c) => evaluate(c.if, n));
    const target = hit?.goto ?? ic.nextOf.get(id);
    if (!target) throw new Error(`Branch ${id} has no target`);
    return enter(ic, n, target, depth + 1);
  }
  if (node.type === 'hub' && node.exitWhen && evaluate(node.exitWhen, n)) {
    return enter(ic, n, node.exit, depth + 1);
  }
  if (node.type === 'line') n.lastExpr = resolveLine(node, n).expr ?? n.lastExpr;
  return n;
}

export function advance(ic: IndexedChapter, s: GameState): GameState {
  const node = getNode(ic, s.node);
  if (node.type !== 'line' && node.type !== 'card') return s;
  const next = ic.nextOf.get(node.id);
  if (!next) throw new Error(`Node ${node.id} has no next`);
  const said = node.type === 'line' ? resolveLine(node, s) : undefined;
  return enter(ic, { ...s, lastLine: said ? { speaker: said.speaker, text: said.text } : undefined }, next);
}

export function visibleOptions(node: StoryNode, s: GameState): Option[] {
  if (node.type !== 'choice') return [];
  return node.options.filter((o) => evaluate(o.if, s) && !(o.once && s.flags[`once:${o.once}`]));
}

export function choose(ic: IndexedChapter, s: GameState, option: Option): GameState {
  let n = applyEffect({ ...s, lastLine: undefined }, option.effects);
  if (option.once) n = applyEffect(n, { flags: { [`once:${option.once}`]: true } });
  return enter(ic, n, option.goto);
}

export function visibleHotspots(node: HubNode, s: GameState): Hotspot[] {
  return node.hotspots.filter((h) => evaluate(h.if, s) && !(h.once && s.flags[`used:${node.id}:${h.id}`]));
}

export function useHotspot(ic: IndexedChapter, s: GameState, hub: HubNode, h: Hotspot): GameState {
  let n = applyEffect({ ...s, lastLine: undefined }, h.effects);
  if (h.once) n = applyEffect(n, { flags: { [`used:${hub.id}:${h.id}`]: true } });
  return enter(ic, n, h.goto);
}

export function ambientLine(node: HubNode, s: GameState): string | undefined {
  return node.ambient?.find((a) => evaluate(a.if, s))?.text;
}

export function resolveLine(
  node: { speaker: string; text: string; expr?: Expr; variants?: Variant[] },
  s: GameState,
): { speaker: string; text: string; expr?: Expr } {
  const v = node.variants?.find((x) => evaluate(x.if, s));
  return {
    speaker: v?.speaker ?? node.speaker,
    text: v?.text ?? node.text,
    expr: v ? v.expr ?? (v.speaker ? undefined : node.expr) : node.expr,
  };
}

// ── Activities (pure; the UI only gathers the picks) ─────────
export function kitchenCost(p: KitchenParams, picks: string[]) {
  return picks.reduce((sum, id) => sum + (p.items.find((i) => i.id === id)?.price ?? 0), 0);
}
export function kitchenValid(p: KitchenParams, s: GameState, picks: string[]) {
  return picks.length >= 1 && picks.length <= p.maxPicks && kitchenCost(p, picks) <= s.money;
}
export function resolveKitchen(ic: IndexedChapter, s: GameState, picks: string[]): GameState {
  const node = getNode(ic, s.node);
  if (node.type !== 'activity' || node.activity !== 'kitchen') throw new Error('Not in kitchen');
  const p = node.params as KitchenParams;
  if (!kitchenValid(p, s, picks)) throw new Error('Invalid kitchen picks');
  let n = applyEffect(s, { money: -kitchenCost(p, picks) });
  const flags: Record<string, boolean | number> = { cooked: true };
  let score = 0;
  for (const id of picks) {
    flags[`meal_${id}`] = true;
    if (p.likes.includes(id)) { score++; n = applyEffect(n, p.perLike); }
    if (p.dislikes.includes(id)) n = applyEffect(n, p.perDislike);
  }
  if (picks.some((id) => p.items.find((i) => i.id === id)?.source === 'grocer')) flags.used_basket = true;
  flags.meal_score = score;
  n = applyEffect(n, { flags });
  return enter(ic, n, ic.nextOf.get(node.id)!);
}

export function resolveBed(ic: IndexedChapter, s: GameState, picks: Record<string, string>): GameState {
  const node = getNode(ic, s.node);
  if (node.type !== 'activity' || node.activity !== 'bed') throw new Error('Not in bed activity');
  const p = node.params as BedParams;
  let n = s;
  const flags: Record<string, string | boolean> = { bed_done: true };
  for (const g of p.groups) {
    const opt = g.options.find((o) => o.id === picks[g.id]);
    if (!opt) throw new Error(`Missing bed pick for ${g.id}`);
    n = applyEffect(n, opt.effects);
    let value = opt.id;
    if (opt.resolve) {
      value = opt.resolve.find((r) => evaluate(r.if, n))?.value ?? opt.resolveDefault ?? opt.id;
      flags[`bed_${g.id}_asked`] = true;
    }
    flags[`bed_${g.id}`] = value;
  }
  n = applyEffect(n, { flags });
  return enter(ic, n, ic.nextOf.get(node.id)!);
}

// ── Mood → expression (hidden variables surface only as behaviour) ──
export function moodExpr(v: Vars): Expr {
  if (v.distress >= 75) return 'worried';
  if (v.trust < 12) return 'guarded';
  if (v.openness >= 30 && v.distress < 45) return 'smile';
  if (v.distress >= 55) return 'guarded';
  return 'neutral';
}

/** Where Hoda sits in the living room – her position is the feedback. */
export type HodaSpot = 'corner' | 'sofa' | 'sewing' | 'underCloset';
export function hodaSpot(s: GameState): HodaSpot {
  if (s.flags.bag_on_closet) return 'underCloset';
  if (s.vars.safety >= 38 || s.flags.sewing_together) return 'sewing';
  if (s.vars.safety >= 26) return 'sofa';
  return 'corner';
}
