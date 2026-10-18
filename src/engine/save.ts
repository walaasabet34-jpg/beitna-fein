import type { GameState } from './types';
import { migrateSave } from './migrate';

const SAVE_KEY = 'beitna-fein:save';
const SETTINGS_KEY = 'beitna-fein:settings';

export interface Settings {
  sound: boolean;
  musicVolume: number;   // 0..1
  sfxVolume: number;     // 0..1 (effects + ambience)
  radioVolume: number;   // 0..1 (in-game radio broadcasts)
  radioMuted: boolean;
  subtitles: boolean;    // radio subtitles
  reducedMotion: boolean | null; // null = follow the OS setting
  textSpeed: 'slow' | 'normal' | 'instant';
}
export const DEFAULT_SETTINGS: Settings = { sound: true, musicVolume: 0.6, sfxVolume: 0.8, radioVolume: 0.9, radioMuted: false, subtitles: true, reducedMotion: null, textSpeed: 'normal' };

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
    return migrateSave(JSON.parse(raw));
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
