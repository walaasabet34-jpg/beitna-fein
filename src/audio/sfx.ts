// Thin compatibility layer over the audio engine.
import { playSfx, setPrefs } from './engine';
export function play(cue: string) { playSfx(cue); }
export { setPrefs };
