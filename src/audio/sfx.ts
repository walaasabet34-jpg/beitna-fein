// Procedural placeholder sounds (Web Audio). No recorded audio assets exist yet.
type Cue = 'knock' | 'radio' | 'sewing' | 'latch' | 'page' | 'basket' | 'tick';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) { enabled = v; }

function ac(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function thump(c: AudioContext, t: number, freq: number, gain: number) {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.12);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.2);
}

function click(c: AudioContext, t: number, freq: number, gain: number, dur = 0.03) {
  const s = c.createBufferSource(); s.buffer = noiseBuffer(c, dur);
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 4;
  const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(c.destination); s.start(t);
}

export function play(cue: Cue) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + 0.01;
  switch (cue) {
    case 'tick': click(c, t, 2400, 0.05, 0.02); break;
    case 'knock': [0, 0.22, 0.62].forEach((d, i) => thump(c, t + d, i === 2 ? 110 : 140, i === 2 ? 0.55 : 0.35)); break;
    case 'latch': click(c, t, 3200, 0.25, 0.025); click(c, t + 0.07, 1800, 0.18, 0.03); break;
    case 'page': {
      const s = c.createBufferSource(); s.buffer = noiseBuffer(c, 0.6);
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.2); g.gain.linearRampToValueAtTime(0.0001, t + 0.6);
      s.connect(f).connect(g).connect(c.destination); s.start(t); break;
    }
    case 'radio': {
      const s = c.createBufferSource(); s.buffer = noiseBuffer(c, 1.8);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.8;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.3); g.gain.linearRampToValueAtTime(0.0001, t + 1.8);
      s.connect(f).connect(g).connect(c.destination); s.start(t); break;
    }
    case 'sewing': for (let i = 0; i < 18; i++) click(c, t + i * 0.075, 900 + (i % 2) * 400, 0.12, 0.025); break;
    case 'basket': for (let i = 0; i < 6; i++) click(c, t + i * 0.12, 600, 0.06, 0.05); break;
  }
}
