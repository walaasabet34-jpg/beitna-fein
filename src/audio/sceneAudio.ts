import type { GameState } from '../engine/types';
import { NIGHT_SLOT } from '../engine/core';

/** Default room tone per scene and time of day; a node can override it with `ambience`. */
export function ambienceFor(s: GameState): string | null {
  if (s.ambience !== undefined && s.ambience !== null) return s.ambience;
  switch (s.scene) {
    case 'hospital': return null;
    case 'door': return 'amb_stair';
    case 'night': case 'drawing': return 'amb_night';
    case 'morning': return 'amb_morning';
    default: return s.slot >= NIGHT_SLOT ? 'amb_night' : 'amb_day';
  }
}
