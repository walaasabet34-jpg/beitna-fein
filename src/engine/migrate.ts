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
  if (s.chapter === 'ch4' && s.node.startsWith('c4_')) {
    s = { ...s, node: 's_start', scene: 'living', day: 1, slot: 0, cast: ['hoda'], visited: [], music: null, ambience: null };
  }
  if (s.visited?.includes('c2_hush_repair') && !s.flags?.c2_hush_repaired) {
    s = { ...s, flags: { ...s.flags, c2_hush_repaired: true } };
  }
  if (s.flags?.light_tonight && s.flags.bed_light !== 'on' && (s.chapter !== 'ch1' || s.day >= 2)) {
    s = { ...s, flags: { ...s.flags, bed_light: 'on' } };
  }
  if (s.chapter === 'ch2' && s.node === 'c2_day2_home') {
    const home = s.flags?.c2_plan === 'home';
    s = { ...s, node: home ? 'c2_day2_stay' : 'c2_day2_empty', scene: 'living', cast: home ? ['hoda'] : [] };
  }
  if (s.chapter === 'ch2' && s.flags?.c2_plan === 'home' && s.node === 'c2_day2_hub') {
    s = { ...s, scene: 'living', cast: ['hoda'] };
  }
  if (s.chapter === 'ch2' && ['c2_close', 'c2_end'].includes(s.node) && s.slot < 4) {
    s = { ...s, slot: 4 };
  }
  // Earlier builds recorded delivery while the player was still choosing the handover.
  if (s.chapter === 'ch5' && ['g_handover', 'final_handover', 'g_messenger', 'final_send_note'].includes(s.node)
      && ['mother', 'messenger'].includes(String(s.flags?.belongings_delivery))) {
    const flags = { ...s.flags };
    delete flags.belongings_delivery;
    s = { ...s, flags };
  }
  return s;
}
