// Instruments Web Audio in headless Chromium to see WHEN audio is created/started, and what plays.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const url = process.env.E2E_URL ?? 'http://localhost:4173/';
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => {
  const log = (window.__audio = { contexts: 0, starts: [], states: [], media: [] });
  const AC = window.AudioContext;
  window.AudioContext = class extends AC {
    constructor(...a) { super(...a); log.contexts++; log.states.push(['created', this.state, performance.now() | 0]); this.addEventListener('statechange', () => log.states.push([this.state, performance.now() | 0])); }
  };
  for (const C of [AudioBufferSourceNode, OscillatorNode]) {
    const orig = C.prototype.start;
    C.prototype.start = function (...a) { log.starts.push([C.name, performance.now() | 0, this.context.state]); return orig.apply(this, a); };
  }
  const op = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { log.media.push([this.currentSrc || this.src, performance.now() | 0]); return op.apply(this); };
  const of = window.fetch; window.__fetched = [];
  window.fetch = (...a) => { window.__fetched.push(String(a[0])); return of(...a); };
});
const failed = [];
p.on('requestfailed', (r) => failed.push(r.url()));
p.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
await p.goto(url, { waitUntil: 'networkidle0' });
await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle0' });
const snap = async (label) => { const a = await p.evaluate(() => JSON.parse(JSON.stringify(window.__audio))); console.log(label.padEnd(34), 'contexts', a.contexts, '| starts', a.starts.length, '| media', a.media.length, '| last state', JSON.stringify(a.states.at(-1) ?? null)); return a; };
await snap('1. page loaded, no interaction');
await p.click('[data-new-game]'); await new Promise((r) => setTimeout(r, 400));
await snap('2. after "New game" tap');
for (let i = 0; i < 10; i++) { await p.click('[data-advance]').catch(() => {}); await new Promise((r) => setTimeout(r, 120)); }
const a3 = await snap('3. after reaching the door knock');
// toggle sound off and keep advancing
await p.click('[aria-label="اقفلي الصوت"]').catch(() => console.log('   (sound toggle not found)'));
const before = a3.starts.length;
for (let i = 0; i < 15; i++) { await p.click('[data-advance], [data-choice="0"]').catch(() => {}); await new Promise((r) => setTimeout(r, 120)); }
const a4 = await snap('4. sound OFF, 15 more steps');
console.log('   new sound starts while muted:', a4.starts.length - before - 15 /* ticks would be counted */ >= 0 ? a4.starts.slice(before).length : 0);
const saved = await p.evaluate(() => localStorage.getItem('beitna-fein:settings'));
console.log('5. saved settings:', saved);
console.log('6. network: audio files fetched:', (await p.evaluate(() => window.__fetched)).filter((u) => /\.(mp3|m4a|ogg|wav)/.test(u)).length, '| failed requests:', failed.length ? failed : 'none');
await b.close();
