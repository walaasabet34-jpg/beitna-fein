import type { GameState } from './types';
import { SAVE_VERSION } from './core';

const SAVE_KEY = 'beitna-fein:save';
const SETTINGS_KEY = 'beitna-fein:settings';

export interface Settings {
  sound: boolean;
  reducedMotion: boolean | null; // null = follow the OS setting
  textSpeed: 'slow' | 'normal' | 'instant';
}
export const DEFAULT_SETTINGS: Settings = { sound: true, reducedMotion: null, textSpeed: 'normal' };

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function saveGame(s: GameState): boolean {
  try { storage()?.setItem(SAVE_KEY, JSON.stringify({ ...s, savedAt: Date.now() })); return true; } catch { return false; }
}

export function loadGame(): GameState | null {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s.version !== SAVE_VERSION || !s.node || !s.vars) return null; // future: migrations
    return s;
  } catch { return null; }
}

export function clearSave() { try { storage()?.removeItem(SAVE_KEY); } catch { /* ignore */ } }

export function loadSettings(): Settings {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(s: Settings) { try { storage()?.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ } }
