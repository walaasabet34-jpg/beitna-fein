// Radio player test in headless Chromium, phone + desktop: tune-in, subtitles, CC, mute, volume, replay,
// authenticity labelling, pending-rights note, and that the signal actually reaches the output.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const URL = process.env.E2E_URL ?? 'http://localhost:4173/';
const VPS = { mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, desktop: { width: 1440, height: 900 } };
const OUT = process.argv[2];
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), '--autoplay-policy=user-gesture-required'], headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
for (const [vp, view] of Object.entries(VPS)) {
  const p = await b.newPage(); await p.setViewport(view);
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/youtube|ERR_|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  const fetched = []; p.on('request', (r) => fetched.push(r.url()));
  const check = (name, ok, d = '') => { if (!ok) fails++; console.log(`${vp.padEnd(7)} ${ok ? 'PASS' : 'FAIL'} ${name} ${d}`); };
  await p.goto(URL, { waitUntil: 'networkidle0' });
  // a v2 save sitting on the Chapter 1 radio choice, day 1 (27 Oct 1973)
  await p.evaluate(() => localStorage.setItem('beitna-fein:save', JSON.stringify({ version: 2, chapter: 'ch1', node: 'c1_radio', scene: 'living', day: 1, slot: 2, money: 30,
    vars: { trust: 22, safety: 30, openness: 16, autonomy: 50, distress: 48 }, flags: {}, likes: [], dislikes: [], visited: [], completed: [], music: 'music_home' })));
  await p.reload({ waitUntil: 'load' }); await wait(800);
  await p.click('[data-continue]'); await wait(400);
  const opts = await p.$$eval('[data-choice]', (els) => els.map((e) => e.textContent.trim()));
  check('27 Oct: news, kids and songs offered', opts.length === 3, JSON.stringify(opts));
  // news on 27 Oct: no genuine recording exists → the player says so and nothing plays
  await p.click('[data-choice="0"]'); await wait(1500);
  check('27 Oct news: no genuine recording → silent, no player, no developer message', !(await p.$('[data-radio]')) && !(await p.evaluate(() => window.__beitnaAudio.audioStatus().radio.playing)));
  // children's programme: Abla Fadila from Egyptian Radio's official channel, in YouTube's own visible player
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('beitna-fein:save')); s.node = 'c1_radio'; localStorage.setItem('beitna-fein:save', JSON.stringify(s)); });
  await p.reload({ waitUntil: 'load' }); await wait(800); await p.click('[data-continue]'); await wait(400);
  await p.click('[data-choice="1"]'); await wait(1500);
  const emb = await p.$eval('[data-radio-embed] iframe', (f) => ({ src: f.src, h: f.getBoundingClientRect().height, w: f.getBoundingClientRect().width, vis: getComputedStyle(f).visibility })).catch(() => null);
  check('kids: official embed, visible, ≥200 px tall', !!emb && emb.src.startsWith('https://www.youtube-nocookie.com/embed/x0fnDixn_-w?') && emb.h >= 199 && emb.w >= 200 && emb.vis === 'visible', JSON.stringify(emb && { h: Math.round(emb.h), w: Math.round(emb.w) }));
  check('kids: no audio file fetched for the embed', !fetched.some((u) => /\/(radio|local-archive)\/[^/]+\.(mp3|m4a|ogg)$/.test(u)));
  // back to the radio menu and pick the song (a genuine 1914 record)
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('beitna-fein:save')); s.node = 'c1_radio'; localStorage.setItem('beitna-fein:save', JSON.stringify(s)); });
  await p.reload({ waitUntil: 'load' }); await wait(800); await p.click('[data-continue]'); await wait(400);
  await p.click('[data-choice="2"]'); await wait(2500);
  check('player appears', !!(await p.$('[data-radio]')));
  const txt = await p.$eval('[data-radio]', (e) => e.textContent).catch(() => '');
  check('no developer labels in the player', !/مؤقت|TEMP|نسخة محلية|الحقوق|تسجيل أصلي/.test(txt), txt.slice(0, 80));
  const sub1 = await p.$eval('[data-radio-subtitle]', (e) => e.textContent).catch(() => null);
  check('subtitle shows the singer', !!sub1 && sub1.includes('منيرة'), sub1 ?? '');
  check('ambience/music duck while the radio plays', (await p.evaluate(() => window.__beitnaAudio.audioStatus().ducked)) === true);
  const lvl = async () => { let m = 0; for (let i = 0; i < 12; i++) { m = Math.max(m, await p.evaluate(() => window.__beitnaAudio.outputLevel())); await wait(80); } return m; };
  check('broadcast signal reaches output', (await lvl()) > 0.003);
  await p.click('[data-radio-cc]'); await wait(300);
  check('CC off hides subtitles', !(await p.$('[data-radio-subtitle]')));
  await p.click('[data-radio-cc]'); await wait(300);
  await p.click('[data-radio-mute]'); await wait(500);
  const muted = await p.evaluate(() => window.__beitnaAudio.audioStatus().prefs.radioMuted);
  check('radio mute', muted === true);
  await p.click('[data-radio-mute]'); await wait(200);
  await p.$eval('[data-radio-volume]', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '35'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await wait(200);
  check('radio volume separate from music/sfx', Math.abs((await p.evaluate(() => window.__beitnaAudio.audioStatus().prefs.radio)) - 0.35) < 0.01);
  await wait(1500);
  const before = (await p.evaluate(() => window.__beitnaAudio.audioStatus().radio)).position;
  await p.click('[data-radio-replay]'); await wait(300);
  const after = (await p.evaluate(() => window.__beitnaAudio.audioStatus().radio)).position;
  check('replay restarts from the beginning', after < before && after < 1, `${before.toFixed(1)}s → ${after.toFixed(1)}s`);
  await p.click('[data-radio-toggle]'); await wait(300);
  check('pause', (await p.evaluate(() => window.__beitnaAudio.audioStatus().radio.playing)) === false);
  if (OUT) await p.screenshot({ path: `${OUT}/radio-${vp}.png` });
  check('no archival file was ever requested', !fetched.some((u) => /radio\/(?!arch_munira|registry)/.test(u)), fetched.filter((u) => u.includes('/radio/')).map((u) => u.split('/').pop()).join(','));
  // date gate in the UI: a Chapter 2 save (3 Nov) must not offer the 27 Oct bulletin
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('beitna-fein:save')); Object.assign(s, { chapter: 'ch2', node: 'c2_radio_c', day: 1, slot: 1, scene: 'living', cast: [] }); localStorage.setItem('beitna-fein:save', JSON.stringify(s)); });
  await p.reload({ waitUntil: 'load' }); await wait(800); await p.click('[data-continue]'); await wait(400);
  await p.click('[data-choice="0"]'); await wait(1500);
  check('3 Nov bulletin: silent, no player', !(await p.$('[data-radio]')));
  // persistence
  await p.reload({ waitUntil: 'load' }); await wait(800);
  const st = JSON.parse(await p.evaluate(() => localStorage.getItem('beitna-fein:settings')));
  check('radio prefs saved', st.radioVolume === 0.35 && st.subtitles === true, JSON.stringify({ v: st.radioVolume, cc: st.subtitles }));
  check('no errors', errors.length === 0, errors.join(' | '));
  await p.close();
}
await b.close();
console.log(fails ? `${fails} radio checks FAILED` : 'all radio checks passed');
process.exit(fails ? 1 : 0);
