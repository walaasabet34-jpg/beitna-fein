// ───────────────────────────────────────────────────────────
// Narrative schema + game state. The engine never contains story text;
// everything below is filled from /src/content/*.json
// ───────────────────────────────────────────────────────────

export type VarKey = 'trust' | 'safety' | 'openness' | 'autonomy' | 'distress';
export type Vars = Record<VarKey, number>;
export type FlagVal = boolean | number | string;

export type Expr =
  | 'neutral' | 'guarded' | 'sad' | 'worried' | 'smile'
  | 'laugh' | 'surprised' | 'upset' | 'sleepy' | 'focused'
  | 'bored' | 'tired' | 'proud' | 'sick';

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { var: VarKey; gte?: number; lte?: number }
  | { flag: string; eq?: FlagVal; gte?: number; lte?: number }
  | { money: { gte?: number; lte?: number } }
  | { slot: { gte?: number; lte?: number } }
  | { visited: string }
  /** which build is running: 'archive' = the local personal build with the local recordings */
  | { build: 'public' | 'archive' };

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
  /** A short piece of narration shown above the line on the same screen (what we see as she speaks). */
  lead?: string;
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
  activity: 'kitchen' | 'bed' | 'ball' | 'buttons' | 'dress';
  params: KitchenParams | BedParams | BallParams | ButtonsParams | DressParams;
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
// ── Shared rituals (played on the stage; the engine only scores the outcome) ──
/** Sock-ball catch. `variant` changes the rules Hoda plays by; `alone` is the game after she is gone. */
export type BallVariant = 'stairs' | 'count' | 'crossing' | 'wall' | 'bed' | 'alone';
export interface BallParams {
  variant: BallVariant;
  /** Throws Hoda makes before the game ends on its own (the player can also stop). */
  rounds: number;
  /** Applied once when the game is played with Hoda (not for 'alone'). */
  effects?: Effect;
}
export interface BallResult {
  catches: number;          // catches by the player
  hodaCatches: number;      // catches by Hoda
  best: number;             // longest unbroken count this game
  high: number;             // throws aimed high (her favourite once she discovers it)
  stoppedEarly?: boolean;   // the player put the ball down
}

/** Sorting buttons for the current sewing order, with or without Hoda. */
export interface ButtonsParams {
  order: string;            // short label of the order shown on the tray
  /** 'hoda' = she sorts beside you; 'bed' = she can only do a few from bed; 'none' = Fatma alone. */
  helper: 'hoda' | 'bed' | 'none';
  /** How many of her picks are correct (0..1) — she gets better across chapters. */
  skill: number;
  /** Money paid when this order is delivered (already applied by the node's own effects if 0). */
  pay?: number;
  effects?: Effect;
  /** Short labels for the two bowls and an optional line when the red button turns up without her. */
  bowls?: [string, string];
  redLine?: string;
}
export interface ButtonsResult {
  hodaPlaced: number;       // buttons Hoda sorted
  hodaWrong: number;        // wrong ones she put in
  fixedQuietly: number;     // wrong ones the player moved back without a word
  showedHer: number;        // wrong ones the player showed her
  caughtFatma: number;      // the player's own mistakes that Hoda spotted
  keptRed: boolean;         // Hoda kept the red button she set aside
  leftWrong?: number;       // wrong buttons that went onto the garment anyway
}

/** Dressing Hoda, mending, or (mode 'pack') folding her things into the suitcase. */
export interface DressParams {
  mode: 'dress' | 'pack';
  /** What today needs: school uniform, warmth. Shown on screen; Hoda reacts to it. */
  school?: boolean;
  cold?: boolean;
  /** A day that deserves the red ribbon (she refuses it otherwise). */
  special?: boolean;
  /** One line describing the day, shown on the screen ("مدرسة · الصبح برد"). */
  today?: string;
  effects?: Effect;
  /** Pack mode: what each folded item brings back, chosen by condition (first match). */
  captions?: { item: string; if?: Condition; text: string }[];
}
export interface DressResult {
  outfit: 'yellow' | 'navy';
  layer: 'none' | 'cardigan';
  ribbon: 'old' | 'red';
  mended: string[];         // item ids mended this time (each uses thread)
  insisted?: boolean;       // the player overrode Hoda's own pick
  packed?: string[];        // mode 'pack'
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
