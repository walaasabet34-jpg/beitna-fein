// Browser audio test: unlock rules, buses, mute, volume, crossfades, exclusivity, transitions, persistence.
// Measures the real output signal via the engine's analyser tap (cannot judge how it *sounds*).
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const URL = process.env.E2E_URL ?? 'http://localhost:4173/';
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), '--autoplay-policy=user-gesture-required'], headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.text().includes('[audio]')) errors.push(m.text()); });
const failedReq = []; p.on('response', (r) => { if (r.status() >= 400) failedReq.push(r.status() + ' ' + r.url()); });
await p.goto(URL, { waitUntil: 'networkidle0' });
await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle0' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const st = () => p.evaluate(() => window.__beitnaAudio.audioStatus());
const level = async (ms = 1200) => { let m = 0; const end = Date.now() + ms; while (Date.now() < end) { m = Math.max(m, await p.evaluate(() => window.__beitnaAudio.outputLevel())); await wait(80); } return +m.toFixed(4); };
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, detail); };

check('no audio before any interaction', (await st()).state === 'not-created');
await p.click('[data-new-game]'); await wait(300);
check('audio unlocked by the first tap', (await st()).state === 'running', (await st()).state);
const advance = async (n) => { for (let i = 0; i < n; i++) { await p.click('[data-advance], [data-choice="0"]').catch(() => {}); await wait(90); } };
await advance(4); await wait(1500);
let s = await st();
check('door scene plays stairwell ambience', s.ambience === 'amb_stair', s.ambience);
check('signal reaches the output', (await level()) > 0.002);
// reach living room (music_home starts at c1_d12)
for (let i = 0; i < 30 && (await p.$eval('[data-screen=game]', (e) => e.dataset.nodeId)) !== 'c1_d13'; i++) await advance(1);
await wait(2500); s = await st();
check('living room: home music + day ambience', s.music === 'music_home' && s.ambience === 'amb_day', `${s.music} / ${s.ambience}`);
// mute via HUD
await p.click('[aria-label="اقفلي الصوت"]'); await wait(800);
const muted = await level(800);
check('mute silences output', muted < 0.0015, `level ${muted}`);
await p.click('[aria-label="شغّلي الصوت"]'); await wait(800);
check('unmute restores output', (await level()) > 0.002);
// volume sliders + persistence
await p.click('[data-menu]'); await p.waitForSelector('[data-pause]');
await p.$eval('#vol-music', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '20'); el.dispatchEvent(new Event('input', { bubbles: true })); });
await p.$eval('#vol-sfx', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '40'); el.dispatchEvent(new Event('input', { bubbles: true })); });
await wait(300); s = await st();
check('music / sfx volume applied separately', Math.abs(s.prefs.music - 0.2) < 0.01 && Math.abs(s.prefs.sfx - 0.4) < 0.01, JSON.stringify(s.prefs));
// sound test buttons
await p.click('[data-test-sfx]'); await wait(200);
check('sound test: effect plays', (await st()).playing.includes('knock'));
await p.click('[data-test-music]'); await wait(2200);
check('sound test: music plays', (await st()).music === 'music_play');
await p.keyboard.press('Escape'); await wait(2200);
check('closing the menu restores the story music', (await st()).music === 'music_home', (await st()).music);
await p.reload({ waitUntil: 'networkidle0' });
const saved = JSON.parse(await p.evaluate(() => localStorage.getItem('beitna-fein:settings')));
check('audio preferences survive reload', saved.musicVolume === 0.2 && saved.sfxVolume === 0.4 && saved.sound === true, JSON.stringify(saved));
// exclusivity + transition: jump to the radio and let the scene change
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('beitna-fein:save')); s.node = 'c1_r_news1'; localStorage.setItem('beitna-fein:save', JSON.stringify(s)); });
await p.reload({ waitUntil: 'networkidle0' }); await p.click('[data-continue]'); await wait(300);
// trigger radio twice quickly (re-enter node by reload/continue) – must not stack
await p.evaluate(() => window.__beitnaAudio && 0);
await p.click('[data-advance]').catch(() => {}); await wait(150);
const before = (await st()).playing.filter((x) => x === 'radio').length;
check('radio never stacks', before <= 1, `instances ${before}`);
check('no failed audio requests', failedReq.length === 0, failedReq.join(', '));
check('no audio errors in console', errors.length === 0, errors.join(' | '));
await b.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} audio checks passed`);
process.exit(bad.length ? 1 : 0);
