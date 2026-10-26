import type {
  Chapter, Condition, Effect, GameState, StoryNode, Vars, VarKey, Variant, Option,
  Hotspot, HubNode, KitchenParams, BedParams, Expr, BallParams, BallResult, ButtonsParams, ButtonsResult,
  DressParams, DressResult, FlagVal,
} from './types';

export const VAR_KEYS: VarKey[] = ['trust', 'safety', 'openness', 'autonomy', 'distress'];
export const DEFAULT_VARS: Vars = { trust: 15, safety: 20, openness: 10, autonomy: 50, distress: 60 };
import { CURRENT_SAVE_VERSION as SAVE_VERSION } from './migrate';
export { SAVE_VERSION };
/** One day = 4 playable periods (0 الصبح · 1 الضهر · 2 العصر · 3 المغرب) + night (4), which is story-only. */
export const NIGHT_SLOT = 4;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ── Conditions ──────────────────────────────────────────────
let BUILD: 'public' | 'archive' = 'public';
/** Set once at startup (main.tsx). Lets a line match the recording that actually plays in this build. */
export function setBuild(b: 'public' | 'archive') { BUILD = b; }
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
  if ('build' in c) return BUILD === c.build;
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
  if (e.slots) n.slot = Math.min(NIGHT_SLOT, n.slot + e.slots);
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

/**
 * Start the next chapter, carrying Hoda's memory of how she was treated:
 * hidden variables, every flag, what Fatma learned about her tastes, and the money left.
 * Time, place, music and who is on stage reset to the new chapter's opening.
 */
export function continueToChapter(next: IndexedChapter, prev: GameState): GameState {
  return newGame(next, {
    vars: { ...prev.vars, ...(next.chapter.init.vars ?? {}) },
    flags: { ...prev.flags },
    likes: prev.likes,
    dislikes: prev.dislikes,
    money: prev.money + (next.chapter.init.money ?? 0),
    completed: [...(prev.completed ?? []), prev.chapter],
  });
}

// ── Navigation ──────────────────────────────────────────────
/** Enter a node: apply its effects, switch scene, auto-resolve branches/hub exits. */
export function enter(ic: IndexedChapter, s: GameState, id: string, depth = 0): GameState {
  if (depth > 60) throw new Error(`Branch loop near ${id}`);
  const node = getNode(ic, id);
  let n: GameState = { ...s, node: id, visited: s.visited.includes(id) ? s.visited : [...s.visited, id] };
  if (node.scene) n.scene = node.scene;
  if (node.music !== undefined) n.music = node.music;
  if (node.ambience !== undefined) n.ambience = node.ambience;
  if (node.cast !== undefined) n.cast = node.cast;
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
  // A day with nothing left that takes time ends on its own (never strand the player in a room).
  if (node.type === 'hub' && node.exitWhen && node.hotspots.some((h) => h.takesTime) && !visibleHotspots(node, n).some((h) => h.takesTime)) {
    return enter(ic, n, node.exit, depth + 1);
  }
  if (node.type === 'hub' && node.events) {
    const ev = node.events.find((e) => !n.flags[`ev:${e.id}`] && evaluate(e.if, n));
    if (ev) return enter(ic, { ...applyEffect(n, { flags: { [`ev:${ev.id}`]: true } }), lastLine: undefined }, ev.goto, depth + 1);
  }
  if (node.type === 'line') n.lastExpr = resolveLine(node, n).expr ?? n.lastExpr;
  return n;
}

/** A loaded save may point at a routing node (a branch, or a hub that should already have exited): settle it. */
export function resume(ic: IndexedChapter, s: GameState): GameState {
  const n = getNode(ic, s.node);
  if (n.type === 'branch' || (n.type === 'hub' && n.exitWhen && evaluate(n.exitWhen, s))) return enter(ic, s, s.node);
  return s;
}

export function advance(ic: IndexedChapter, s: GameState): GameState {
  const node = getNode(ic, s.node);
  if (node.type !== 'line' && node.type !== 'card') return s;
  const next = ic.nextOf.get(node.id);
  if (!next) throw new Error(`Node ${node.id} has no next`);
  const said = node.type === 'line' ? resolveLine(node, s) : undefined;
  return enter(ic, { ...s, lastLine: said ? { speaker: said.speaker, text: said.text, expr: said.expr } : undefined }, next);
}

export function visibleOptions(node: StoryNode, s: GameState, aired?: (broadcast: string) => boolean): Option[] {
  if (node.type !== 'choice') return [];
  return node.options.filter((o) => evaluate(o.if, s) && !(o.once && s.flags[`once:${o.once}`]) && (!o.broadcast || !aired || aired(o.broadcast)));
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

// ── Shared rituals: ball, buttons, clothes ───────────────────
const num = (v: FlagVal | undefined) => (typeof v === 'number' ? v : 0);
const clampInt = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : 0)));

function activityNode<T>(ic: IndexedChapter, s: GameState, kind: string): { node: StoryNode; p: T } {
  const node = getNode(ic, s.node);
  if (node.type !== 'activity' || node.activity !== kind) throw new Error(`Not in ${kind} activity`);
  return { node, p: node.params as T };
}

/** Score a sock-ball game. Flags remember the record, her favourite throw and every rule she has invented. */
export function resolveBall(ic: IndexedChapter, s: GameState, r: BallResult): GameState {
  const { node, p } = activityNode<BallParams>(ic, s, 'ball');
  const catches = clampInt(r.catches, 0, p.rounds * 2);
  const hodaCatches = p.variant === 'alone' ? 0 : clampInt(r.hodaCatches, 0, p.rounds);
  const best = clampInt(r.best, 0, catches + hodaCatches);
  const high = clampInt(r.high, 0, p.rounds);
  const throws = catches + hodaCatches;
  let n = s;
  const flags: Record<string, FlagVal> = { [`ball_${p.variant}`]: true, ball_last: best };
  if (p.variant === 'alone') {
    flags.ball_alone = num(s.flags.ball_alone) + 1;
    if (catches > 0) flags.ball_alone_caught = true;
  } else {
    flags.ball_games = num(s.flags.ball_games) + 1;
    if (best > num(s.flags.ball_best)) flags.ball_best = best;
    if (high > 0) flags.ball_high = num(s.flags.ball_high) + high;
    if (num(s.flags.ball_high) + high >= 2) flags.knows_high = true;
    if (r.stoppedEarly) flags.ball_stopped = true;
    if (throws > 0) n = applyEffect(n, p.effects);
  }
  n = applyEffect(n, { flags });
  return enter(ic, n, ic.nextOf.get(node.id)!);
}

/** Score a button-sorting session for the current order; pays the order if it has a fee. */
export function resolveButtons(ic: IndexedChapter, s: GameState, r: ButtonsResult): GameState {
  const { node, p } = activityNode<ButtonsParams>(ic, s, 'buttons');
  const helping = p.helper !== 'none';
  const hodaPlaced = helping ? clampInt(r.hodaPlaced, 0, 40) : 0;
  const hodaWrong = helping ? clampInt(r.hodaWrong, 0, hodaPlaced) : 0;
  const flags: Record<string, FlagVal> = { buttons_sessions: num(s.flags.buttons_sessions) + 1, buttons_last_order: p.order };
  if (helping && hodaPlaced > 0) flags.hoda_sorted = num(s.flags.hoda_sorted) + 1;
  if (helping && clampInt(r.showedHer, 0, hodaWrong) > 0) flags.buttons_showed = num(s.flags.buttons_showed) + 1;
  if (helping && clampInt(r.fixedQuietly, 0, hodaWrong) > 0) flags.buttons_fixed_quietly = num(s.flags.buttons_fixed_quietly) + 1;
  if (helping && clampInt(r.caughtFatma, 0, 20) > 0) flags.hoda_caught_fatma = num(s.flags.hoda_caught_fatma) + 1;
  if (helping && r.keptRed && !s.flags.red_button) flags.red_button = 'hoda';
  if (!helping) flags.buttons_alone = true;
  if (clampInt(r.leftWrong ?? 0, 0, 10) > 0) flags.buttons_left_wrong = true;
  let n = applyEffect(s, { flags, money: p.pay ?? 0 });
  if (helping && hodaPlaced > 0) n = applyEffect(n, p.effects);
  return enter(ic, n, ic.nextOf.get(node.id)!);
}

/** Clothes Hoda owns and their current state. States change only through play (washing, tearing, mending). */
export function wardrobe(s: GameState) {
  return {
    yellow: String(s.flags.cl_yellow ?? (s.flags.clothes_out || s.chapter !== 'ch1' ? 'clean' : 'dusty')),
    navy: String(s.flags.cl_navy ?? (s.flags.c2_outfit === 'navy' ? 'fitted' : 'loose')),
    cardigan: s.flags.cl_cardigan === 'made',
    redRibbon: true,
  };
}
const MENDABLE: Record<string, string[]> = { yellow: ['torn'], navy: ['loose'] };
export function canMend(s: GameState, item: string) { return (MENDABLE[item] ?? []).includes((wardrobe(s) as Record<string, unknown>)[item] as string); }

export function resolveDress(ic: IndexedChapter, s: GameState, r: DressResult): GameState {
  const { node, p } = activityNode<DressParams>(ic, s, 'dress');
  const flags: Record<string, FlagVal> = {};
  if (p.mode === 'pack') {
    const packed = (r.packed ?? []).filter((x) => typeof x === 'string');
    flags.packed = packed.join(',');
    flags.packed_all = packed.length > 0;
  } else {
    for (const m of r.mended ?? []) {
      if (!canMend(s, m)) continue;
      if (m === 'yellow') flags.cl_yellow = s.flags.patch_flower ? 'flower' : 'mended';
      if (m === 'navy') { flags.cl_navy = 'fitted'; flags.c2_outfit = 'navy'; }
      flags[`mended_${m}`] = true;
    }
    const navyOk = (flags.cl_navy ?? wardrobe(s).navy) === 'fitted' || r.outfit !== 'navy';
    flags.outfit = r.outfit;
    if (r.outfit === 'navy') flags.c2_outfit = 'navy';
    else if (s.chapter === 'ch2' && !s.flags.c2_outfit) flags.c2_outfit = 'yellow';
    flags.layer = r.layer === 'cardigan' && wardrobe(s).cardigan ? 'cardigan' : 'none';
    flags.ribbon = r.ribbon === 'red' ? 'red' : 'old';
    flags.dressed_times = num(s.flags.dressed_times) + 1;
    if (r.insisted) flags.dress_insisted = num(s.flags.dress_insisted) + 1;
    if (p.cold && flags.layer === 'cardigan') flags.warm_today = true;
    if (p.cold && flags.layer !== 'cardigan') flags.cold_today = true;
    if (!navyOk) flags.sleeve_loose_today = true;
  }
  let n = applyEffect(s, { flags });
  n = applyEffect(n, p.effects);
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
  // The wardrobe position belongs to Chapter 1; keep the flag as story memory.
  if (s.chapter === 'ch1' && s.day === 1 && s.flags.bag_on_closet && !s.flags.bag_returned) return 'underCloset';
  if (s.vars.safety >= 38 || s.flags.sewing_together) return 'sewing';
  if (s.vars.safety >= 26) return 'sofa';
  return 'corner';
}
