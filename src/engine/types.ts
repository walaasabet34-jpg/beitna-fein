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
  /** One-shot sound cue (see src/audio/manifest.json). */
  sfx?: string;
  /** Music loop to switch to (null = silence). Omitted = keep current. */
  music?: string | null;
  /** Ambience override (null = back to the scene's default). */
  ambience?: string | null;
  /** Radio broadcast (registry id) that starts playing on this node; null stops the radio. */
  broadcast?: string | null;
  /** Who is physically present on stage from here on (e.g. Hoda absent while at school). */
  cast?: string[] | null;
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
  /** Radio broadcast this option tunes to; hidden if it hasn't aired by the in-game date. */
  broadcast?: string;
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

/** Something Hoda starts on her own when the player returns to the room (fires once). */
export interface HubEvent { id: string; if?: Condition; goto: string }

export interface HubNode extends NodeBase {
  type: 'hub';
  hint: string;
  events?: HubEvent[];
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
  /** Chapter id to continue into (must exist in content). */
  nextChapter?: string;
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
  /** In-game calendar: chapter day → ISO date. Gates historical radio broadcasts. */
  calendar?: Record<string, string>;
  /** 'provisional' until the dates are historically verified. */
  calendarStatus?: 'provisional' | 'verified';
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
  lastLine?: { speaker: string; text: string; expr?: Expr };
  music?: string | null;
  ambience?: string | null;
  /** Chapters finished, in order (carried across chapters). */
  completed?: string[];
  cast?: string[] | null;
  /** Snapshot taken when this chapter began (lets the player replay just this chapter). */
  chapterStart?: GameState;
  savedAt?: number;
}
