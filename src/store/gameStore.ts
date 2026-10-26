import { create } from 'zustand';
import type { GameState, Expr } from '../engine/types';
import { CHAPTERS, FIRST_CHAPTER } from '../content';
import { indexChapter, newGame as engineNew, getNode, resolveLine, moodExpr, continueToChapter, resume, IndexedChapter } from '../engine/core';
import { saveGame, loadGame, clearSave, loadSettings, saveSettings, Settings } from '../engine/save';
import { play, setPrefs } from '../audio/sfx';

const indexed: Record<string, IndexedChapter> = Object.fromEntries(
  Object.entries(CHAPTERS).map(([id, ch]) => [id, indexChapter(ch)]),
);

type Screen = 'title' | 'game';

interface Store {
  screen: Screen;
  state: GameState | null;
  settings: Settings;
  menuOpen: boolean;
  savedFlash: number;
  hasSave: boolean;
  ic: () => IndexedChapter;
  startNew: () => void;
  continueGame: () => void;
  /** Apply a pure engine transition, autosave, and fire the node's sound cue. */
  act: (fn: (ic: IndexedChapter, s: GameState) => GameState) => void;
  manualSave: () => void;
  toTitle: () => void;
  restartChapter: () => void;
  /** End screen → next chapter, carrying everything Hoda remembers. */
  nextChapter: (id: string) => void;
  setMenu: (v: boolean) => void;
  updateSettings: (p: Partial<Settings>) => void;
}

function cueFor(ic: IndexedChapter, s: GameState) {
  const n = getNode(ic, s.node);
  if (n.sfx) play(n.sfx);
}

export const useGame = create<Store>((set, get) => {
  const settings = loadSettings();
  setPrefs({ enabled: settings.sound, music: settings.musicVolume, sfx: settings.sfxVolume, ambience: settings.ambienceVolume, radio: settings.radioVolume, radioMuted: settings.radioMuted });
  return {
    screen: 'title',
    state: null,
    settings,
    menuOpen: false,
    savedFlash: 0,
    hasSave: !!loadGame(),
    ic: () => indexed[get().state?.chapter ?? FIRST_CHAPTER],
    startNew: () => {
      const ic = indexed[FIRST_CHAPTER];
      const s = engineNew(ic);
      saveGame(s);
      set({ state: s, screen: 'game', menuOpen: false, hasSave: true });
      cueFor(ic, s);
    },
    continueGame: () => {
      const s = loadGame();
      if (!s || !indexed[s.chapter]) return get().startNew();
      let st = s;
      try { getNode(indexed[st.chapter], st.node); } catch {
        // A node this build no longer has: resume the chapter from its start, keeping everything she remembers.
        const ic = indexed[st.chapter];
        st = st.chapterStart ? (st.chapterStart as GameState) : { ...st, node: ic.chapter.start, scene: ic.chapter.init.scene };
      }
      st = resume(indexed[st.chapter], st);
      saveGame(st);
      set({ state: st, screen: 'game', menuOpen: false });
    },
    act: (fn) => {
      const s = get().state; if (!s) return;
      const ic = indexed[s.chapter];
      const next = fn(ic, s);
      if (next === s) return;
      saveGame(next);
      set({ state: next });
      if (next.node !== s.node) cueFor(ic, next);
    },
    manualSave: () => { const s = get().state; if (s && saveGame(s)) set({ savedFlash: Date.now(), hasSave: true }); },
    toTitle: () => set({ screen: 'title', menuOpen: false, hasSave: !!loadGame() }),
    restartChapter: () => {
      const s = get().state;
      // Replay the current chapter from the state it was entered with (Ch1: fresh game).
      if (s && s.chapter !== FIRST_CHAPTER && s.chapterStart) { const st = s.chapterStart as GameState; saveGame(st); set({ state: st, menuOpen: false }); return; }
      clearSave(); get().startNew();
    },
    nextChapter: (id) => {
      const s = get().state; const ic = indexed[id]; if (!s || !ic) return;
      let next = continueToChapter(ic, s);
      next = { ...next, chapterStart: next };
      saveGame(next); set({ state: next, menuOpen: false });
      cueFor(ic, next);
    },
    setMenu: (v) => set({ menuOpen: v }),
    updateSettings: (p) => {
      const settings = { ...get().settings, ...p };
      saveSettings(settings);
      setPrefs({ enabled: settings.sound, music: settings.musicVolume, sfx: settings.sfxVolume, ambience: settings.ambienceVolume, radio: settings.radioVolume, radioMuted: settings.radioMuted });
      set({ settings });
    },
  };
});

/** Hoda's current face: the line's own expression, else derived from hidden mood. */
export function currentExpr(ic: IndexedChapter, s: GameState): Expr {
  const n = getNode(ic, s.node);
  if (n.type === 'line') {
    const r = resolveLine(n, s);
    if (r.expr) return r.expr;
  }
  // During a choice Hoda keeps the face of the line she just said.
  if (n.type === 'choice' && s.lastLine?.speaker === 'hoda' && s.lastLine.expr) return s.lastLine.expr;
  if (s.scene === 'night' || s.scene === 'drawing') return s.flags.hoda_asleep ? 'sleepy' : 'focused';
  return moodExpr(s.vars);
}
