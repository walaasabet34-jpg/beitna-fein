import type { GameState } from './types';

export const CURRENT_SAVE_VERSION = 2;

/**
 * Upgrade any older save to the current shape. Pure function (unit-tested).
 * v1 → v2: adds `completed`, `music`, `ambience`; folds the old 6-period day (… العشا=4, بالليل=5)
 *          into the 4-period day + night (night = 4).
 */
export function migrateSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  let s = raw as GameState & { version?: number };
  if (typeof s.version !== 'number' || !s.node || !s.vars || !s.chapter) return null;
  if (s.version > CURRENT_SAVE_VERSION) return null;            // written by a newer build
  if (s.version === 1) {
    s = { ...s, version: 2, completed: [], slot: s.slot >= 5 ? 4 : s.slot, music: undefined, ambience: undefined };
  }
  return s;
}
