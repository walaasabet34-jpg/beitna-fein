// Audio engine: Web Audio with three buses (music · ambience · sfx) under one master.
// - Nothing is created until the first user gesture (autoplay policies on Chrome / Safari / iOS).
// - Music and ambience crossfade; the same cue never restarts or stacks.
// - "Exclusive" one-shots (radio, sewing…) cut the previous instance; long sounds fade on scene change.
// - Loops are scheduled as overlapping copies with a crossfade, so MP3 encoder padding never causes a gap.
import manifest from './manifest.json';

export type CueName = keyof typeof manifest;
interface Cue { file: string; bus: 'music' | 'ambience' | 'sfx'; loop: boolean; gain: number; duration: number; exclusive: boolean }
const CUES = manifest as Record<string, Cue>;

export interface AudioPrefs { enabled: boolean; music: number; sfx: number; radio: number; radioMuted: boolean }

let ctx: AudioContext | null = null;
let master: GainNode, musicBus: GainNode, ambBus: GainNode, sfxBus: GainNode, radioBus: GainNode, analyser: AnalyserNode;
let prefs: AudioPrefs = { enabled: true, music: 0.6, sfx: 0.8, radio: 0.9, radioMuted: false };
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const failed = new Set<string>();
const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

// ── setup ──
function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); musicBus = ctx.createGain(); ambBus = ctx.createGain(); sfxBus = ctx.createGain(); radioBus = ctx.createGain();
  analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
  musicBus.connect(master); ambBus.connect(master); sfxBus.connect(master); radioBus.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
  applyPrefs(0);
  return ctx;
}

/** Call from inside a user gesture. Safe to call repeatedly. */
export function unlock() {
  const c = ensureCtx(); if (!c) return;
  if (c.state === 'suspended') void c.resume();
  // iOS: playing a silent buffer inside the gesture fully unlocks output.
  const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  // Warm the cache for short effects so the first one isn't late.
  Object.entries(CUES).forEach(([k, q]) => { if (q.bus === 'sfx') void load(k); });
  resumeWanted();
}

export function setPrefs(p: AudioPrefs) { prefs = p; applyPrefs(0.15); if (p.enabled) resumeWanted(); }
function applyPrefs(time: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(prefs.enabled ? 1 : 0, now, time || 0.001);
  musicBus.gain.setTargetAtTime(prefs.music, now, time || 0.001);
  ambBus.gain.setTargetAtTime(prefs.sfx * 0.9, now, time || 0.001);
  sfxBus.gain.setTargetAtTime(prefs.sfx, now, time || 0.001);
  radioBus.gain.setTargetAtTime(prefs.radioMuted ? 0 : prefs.radio, now, time || 0.001);
}

function load(name: string): Promise<AudioBuffer | null> {
  const cue = CUES[name];
  if (!cue || !ctx) return Promise.resolve(null);
  if (!buffers.has(name)) {
    const c = ctx;
    buffers.set(name, fetch(base + cue.file)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.arrayBuffer(); })
      .then((ab) => new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(ab, res, rej)))
      .catch((e) => { failed.add(name); console.warn(`[audio] could not load ${name}: ${e}`); return null; }));
  }
  return buffers.get(name)!;
}

// ── one-shots ──
const live = new Map<string, { src: AudioBufferSourceNode; gain: GainNode }>();
export function playSfx(name: string) {
  const cue = CUES[name];
  if (!cue || !prefs.enabled) return;
  const c = ensureCtx(); if (!c) return;
  if (c.state === 'suspended') void c.resume();
  void load(name).then((buf) => {
    if (!buf || !ctx) return;
    if (cue.exclusive || live.has(name)) stopOne(name, 0.08);   // never stack the same sound
    const src = ctx.createBufferSource(); const g = ctx.createGain();
    src.buffer = buf; g.gain.value = cue.gain;
    src.connect(g).connect(sfxBus); src.start();
    live.set(name, { src, gain: g });
    src.onended = () => { if (live.get(name)?.src === src) live.delete(name); };
  });
}
function stopOne(name: string, fade: number) {
  const n = live.get(name); if (!n || !ctx) return;
  const now = ctx.currentTime;
  n.gain.gain.cancelScheduledValues(now); n.gain.gain.setValueAtTime(n.gain.gain.value, now);
  n.gain.gain.linearRampToValueAtTime(0, now + fade);
  try { n.src.stop(now + fade + 0.02); } catch { /* already stopped */ }
  live.delete(name);
}
/** Fade out long one-shots (radio, sewing…) — called on scene changes. */
export function stopLongSfx(fade = 0.4) {
  for (const [k] of live) if (CUES[k]?.exclusive) stopOne(k, fade);
}

// ── loops (music + ambience) ──
interface LoopState { name: string; gain: GainNode; timer: number; sources: AudioBufferSourceNode[] }
const loops: Record<'music' | 'ambience', LoopState | null> = { music: null, ambience: null };
const wanted: Record<'music' | 'ambience', string | null> = { music: null, ambience: null };
const XFADE = 2;

export function setLoop(kind: 'music' | 'ambience', name: string | null, fade = 1.6) {
  wanted[kind] = name && CUES[name] ? name : null;
  if (!ctx) return;                               // will start after unlock()
  const cur = loops[kind];
  if (cur?.name === wanted[kind]) return;         // same cue: keep playing, no restart
  if (cur) fadeOutLoop(cur, fade);
  loops[kind] = null;
  if (wanted[kind]) startLoop(kind, wanted[kind]!, fade);
}

function startLoop(kind: 'music' | 'ambience', name: string, fade: number) {
  const c = ctx!; const cue = CUES[name];
  const gain = c.createGain(); gain.gain.value = 0; gain.connect(kind === 'music' ? musicBus : ambBus);
  const st: LoopState = { name, gain, timer: 0, sources: [] };
  loops[kind] = st;
  void load(name).then((buf) => {
    if (!buf || loops[kind] !== st || !ctx) return;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(cue.gain, now + fade);
    const schedule = (at: number, first: boolean) => {
      if (loops[kind] !== st || !ctx) return;
      const src = ctx.createBufferSource(); const g = ctx.createGain(); src.buffer = buf;
      const len = buf.duration;
      // each copy fades in/out over XFADE so copies overlap smoothly
      g.gain.setValueAtTime(first ? 1 : 0, at);
      if (!first) g.gain.linearRampToValueAtTime(1, at + XFADE);
      g.gain.setValueAtTime(1, at + len - XFADE); g.gain.linearRampToValueAtTime(0, at + len);
      src.connect(g).connect(gain); src.start(at); src.stop(at + len + 0.05);
      st.sources.push(src); if (st.sources.length > 3) st.sources.shift();
      const nextAt = at + len - XFADE;
      st.timer = window.setTimeout(() => schedule(nextAt, false), Math.max(0, (nextAt - ctx.currentTime - 1) * 1000));
    };
    schedule(now + 0.02, true);
  });
}

function fadeOutLoop(st: LoopState, fade: number) {
  if (!ctx) return;
  clearTimeout(st.timer);
  const now = ctx.currentTime;
  st.gain.gain.cancelScheduledValues(now); st.gain.gain.setValueAtTime(st.gain.gain.value, now);
  st.gain.gain.linearRampToValueAtTime(0, now + fade);
  st.sources.forEach((s) => { try { s.stop(now + fade + 0.05); } catch { /* noop */ } });
}

function resumeWanted() {
  if (!ctx) return;
  (['music', 'ambience'] as const).forEach((k) => { if (wanted[k] && loops[k]?.name !== wanted[k]) setLoop(k, wanted[k]); });
}

/** Stop everything (title screen). */
export function stopAll(fade = 0.8) { setLoop('music', null, fade); setLoop('ambience', null, fade); stopLongSfx(fade); }

// Pause when the tab/app is hidden (mobile battery, and avoids sound from a background tab).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend(); else if (prefs.enabled) void ctx.resume();
  });
}

// ── radio channel (one broadcast at a time; position is tracked for subtitles) ──
const radioBuffers = new Map<string, Promise<AudioBuffer | null>>();
let radio: { url: string; src: AudioBufferSourceNode | null; gain: GainNode | null; buf: AudioBuffer | null; startedAt: number; offset: number; playing: boolean } | null = null;

function loadUrl(url: string): Promise<AudioBuffer | null> {
  if (!ctx) return Promise.resolve(null);
  if (!radioBuffers.has(url)) {
    const c = ctx;
    radioBuffers.set(url, fetch(base + url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then((ab) => new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(ab, res, rej)))
      .catch((e) => { failed.add(url); console.warn(`[audio] radio file failed ${url}: ${e}`); return null; }));
  }
  return radioBuffers.get(url)!;
}
function startRadioAt(offset: number) {
  if (!ctx || !radio?.buf) return;
  const src = ctx.createBufferSource(); const g = ctx.createGain();
  src.buffer = radio.buf; src.connect(g).connect(radioBus);
  g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.25);
  src.start(0, Math.min(offset, radio.buf.duration - 0.05));
  const r = radio; r.src = src; r.gain = g; r.startedAt = ctx.currentTime - offset; r.offset = offset; r.playing = true;
  src.onended = () => { if (radio === r && r.src === src) { r.playing = false; r.offset = r.buf ? r.buf.duration : 0; } };
}
/** Start a radio file from the beginning (stops any previous broadcast). Resolves false if it can't load. */
export async function playRadio(url: string): Promise<boolean> {
  const c = ensureCtx(); if (!c) return false;
  stopRadio(0.2);
  const r = { url, src: null, gain: null, buf: null, startedAt: 0, offset: 0, playing: false } as NonNullable<typeof radio>;
  radio = r;
  const buf = await loadUrl(url);
  if (!buf || radio !== r) return false;
  r.buf = buf; startRadioAt(0); return true;
}
export function pauseRadio() {
  if (!ctx || !radio?.playing || !radio.src) return;
  radio.offset = ctx.currentTime - radio.startedAt; radio.playing = false;
  const s = radio.src; radio.src = null; try { s.stop(); } catch { /* noop */ }
}
export function resumeRadio() { if (radio && !radio.playing && radio.buf) startRadioAt(radio.offset >= radio.buf.duration - 0.1 ? 0 : radio.offset); }
export function replayRadio() { if (radio?.buf) { pauseRadio(); startRadioAt(0); } }
export function stopRadio(fade = 0.5) {
  if (!radio) return;
  const r = radio; radio = null;
  if (ctx && r.src && r.gain) { const now = ctx.currentTime; r.gain.gain.cancelScheduledValues(now); r.gain.gain.setValueAtTime(r.gain.gain.value, now); r.gain.gain.linearRampToValueAtTime(0, now + fade); try { r.src.stop(now + fade + 0.05); } catch { /* noop */ } }
}
export function radioState() {
  if (!radio) return { url: null as string | null, playing: false, position: 0, duration: 0 };
  const pos = radio.playing && ctx ? ctx.currentTime - radio.startedAt : radio.offset;
  return { url: radio.url, playing: radio.playing, position: Math.max(0, pos), duration: radio.buf?.duration ?? 0 };
}

// ── diagnostics (used by the sound-test panel and automated tests) ──
export function audioStatus() {
  return {
    state: ctx?.state ?? 'not-created',
    music: loops.music?.name ?? null, ambience: loops.ambience?.name ?? null,
    playing: [...live.keys()], failed: [...failed], prefs: { ...prefs }, radio: radioState(),
  };
}
export function outputLevel(): number {
  if (!ctx || !analyser) return 0;
  const a = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(a);
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
}
export const ALL_CUES = Object.keys(CUES);
export function cueInfo(name: string): Cue | undefined { return CUES[name]; }
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__beitnaAudio = { audioStatus, outputLevel };
