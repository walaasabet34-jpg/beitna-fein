// ───────────────────────────────────────────────────────────
// Narrative schema + game state. The engine never contains story text;
// everything below is filled from /src/content/*.json
// ───────────────────────────────────────────────────────────

export type VarKey = 'trust' | 'safety' | 'openness' | 'autonomy' | 'distress';
export type Vars = Record<VarKey, number>;
export type FlagVal = boolean | number | string;

export type Expr =
  | 'neutral' | 'guarded' | 'sad' | 'worried' | 'smile'
  | 'laugh' | 'surprised' | 'upset' | 'sleepy' | 'focused';

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { var: VarKey; gte?: number; lte?: number }
  | { flag: string; eq?: FlagVal; gte?: number; lte?: number }
  | { money: { gte?: number; lte?: number } }
  | { slot: { gte?: number; lte?: number } }
  | { visited: string };

export interface Effect {
  vars?: Partial<Vars>;
  flags?: Record<string, FlagVal>;
  inc?: Record<string, number>;
  money?: number;
  slots?: number;
  setTime?: { day?: number; slot?: number };
  likes?: string[];
  dislikes?: string[];
}

export interface Variant {
  if: Condition;
  text: string;
  speaker?: string;
  expr?: Expr;
}

interface NodeBase {
  id: string;
  scene?: string;
  sfx?: 'knock' | 'radio' | 'sewing' | 'latch' | 'page' | 'basket';
  effects?: Effect;
}

export interface LineNode extends NodeBase {
  type: 'line';
  speaker: string;
  text: string;
  expr?: Expr;
  variants?: Variant[];
  next?: string;
}

export interface Option {
  text: string;
  if?: Condition;
  effects?: Effect;
  goto: string;
  once?: string;
}

export interface ChoiceNode extends NodeBase {
  type: 'choice';
  prompt?: string;
  options: Option[];
}

export interface Hotspot {
  id: string;
  label: string;
  target?: string;          // object id in the scene art (optional = button only)
  if?: Condition;
  once?: boolean;
  takesTime?: boolean;      // purely a UI hint; time cost lives in effects.slots
  effects?: Effect;
  goto: string;
}

export interface AmbientLine { if?: Condition; text: string }

export interface HubNode extends NodeBase {
  type: 'hub';
  hint: string;
  ambient?: AmbientLine[];
  hotspots: Hotspot[];
  exitWhen?: Condition;
  exit: string;
}

export interface ActivityNode extends NodeBase {
  type: 'activity';
  activity: 'kitchen' | 'bed';
  params: KitchenParams | BedParams;
  next?: string;
}

export interface BranchNode extends NodeBase {
  type: 'branch';
  cases: { if: Condition; goto: string }[];
  else?: string;
}

export interface CardNode extends NodeBase {
  type: 'card';
  title: string;
  subtitle?: string;
  next?: string;
}

export interface EndNode extends NodeBase {
  type: 'end';
  title: string;
  text: string;
  variants?: Variant[];
  memories?: AmbientLine[];
  nextChapterTitle?: string;
}

export type StoryNode = LineNode | ChoiceNode | HubNode | ActivityNode | BranchNode | CardNode | EndNode;

// ── Activities ──────────────────────────────────────────────
export interface KitchenItem {
  id: string;
  label: string;
  price: number;               // قروش
  source: 'pantry' | 'grocer';
}
export interface KitchenParams {
  maxPicks: number;
  items: KitchenItem[];
  likes: string[];
  dislikes: string[];
  perLike?: Effect;
  perDislike?: Effect;
}

export interface BedOption {
  id: string;
  label: string;
  effects?: Effect;
  resolve?: { if: Condition; value: string }[];   // "ask Hoda" options
  resolveDefault?: string;
}
export interface BedGroup { id: string; label: string; options: BedOption[] }
export interface BedParams { groups: BedGroup[] }

// ── Content containers ──────────────────────────────────────
export interface Chapter {
  id: string;
  number: number;
  title: string;
  start: string;
  init: { day: number; slot: number; money: number; scene: string; vars?: Partial<Vars> };
  slotNames: string[];
  dayNames: string[];
  nodes: StoryNode[];
}

export interface Character { name: string; color?: string }

// ── Runtime state ───────────────────────────────────────────
export interface GameState {
  version: number;
  chapter: string;
  node: string;
  scene: string;
  day: number;
  slot: number;
  money: number;
  vars: Vars;
  flags: Record<string, FlagVal>;
  likes: string[];
  dislikes: string[];
  visited: string[];
  lastExpr?: Expr;
  /** The line just before a choice, so the choice keeps its context on screen. */
  lastLine?: { speaker: string; text: string };
  savedAt?: number;
}
