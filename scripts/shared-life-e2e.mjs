// Full-story browser playthrough that plays the shared rituals (ball, button tin, clothes, packing) with
// real pointer input — mouse or touch — and records what a player reads between actions.
// Usage: npm run build && npx vite preview --port 4173 &
//        PW=/path/to/playwright/index.mjs node scripts/shared-life-e2e.mjs [outDir]
// Env: E2E_URL, E2E_VP=mobile|desktop, E2E_POLICY=first|random|last, E2E_SEED, E2E_SHOTS=1, E2E_RELOAD_RITUAL=1
const { chromium } = await import(process.env.PW ?? 'playwright');
import fs from 'node:fs';

const URL = process.env.E2E_URL ?? 'http://127.0.0.1:4173/';
const OUT = process.argv[2] ?? 'e2e-shots/shared-life';
const VP = process.env.E2E_VP ?? 'mobile';
const POLICY = process.env.E2E_POLICY ?? 'random';
const SHOTS = process.env.E2E_SHOTS === '1';
fs.mkdirSync(OUT, { recursive: true });
let seed = Number(process.env.E2E_SEED ?? 7);
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pickIdx = (n) => (POLICY === 'first' ? 0 : POLICY === 'last' ? n - 1 : Math.floor(rnd() * n));

const browser = await chromium.launch();
const touch = VP === 'mobile';
const ctx = await browser.newContext(touch ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(URL);
await page.evaluate((save) => {
  localStorage.clear(); localStorage.setItem('beitna-fein:settings', JSON.stringify({ textSpeed: 'instant', sound: false, reducedMotion: true }));
  if (save) localStorage.setItem('beitna-fein:save', save);
}, process.env.E2E_SAVE ? fs.readFileSync(process.env.E2E_SAVE, 'utf8') : null);
await page.reload();
await page.click(process.env.E2E_SAVE ? '[data-continue]' : '[data-new-game]');
await page.waitForSelector('[data-screen="game"]');

const tap = async (el) => {
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const b = await el.boundingBox(); if (!b) return false;
  if (touch) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  return true;
};

const log = { steps: 0, rituals: {}, wordsByChapter: {}, ritualMsByChapter: {}, overflow: [], reloadInRitual: null, chapters: [] };
let ritualStart = 0, lastChapter = '';
const seen = new Set();
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;

async function ritual() {
  const ball = await page.$('[data-activity="ball"]');
  if (ball) {
    const phase = await ball.getAttribute('data-phase');
    if (phase === 'end') { await tap(await page.$('[data-ball-done]')); return 'ball-done'; }
    if (phase === 'aim' || (phase === 'ready' && await page.$('[data-aim]'))) { const aims = await page.$$('[data-aim]'); await tap(aims[pickIdx(aims.length)]); return 'ball-throw'; }
    if (phase === 'incoming') {
      await page.waitForTimeout(1400 + Math.floor(rnd() * 300));
      const st = await page.$('[data-ritual]');
      if (touch) await tap(st); else await page.keyboard.press('Space');
      return 'ball-catch';
    }
    await page.waitForTimeout(250); return 'ball-wait';
  }
  if (await page.$('[data-activity="buttons"]')) {
    const red = await page.$(POLICY === 'last' ? '[data-red-work]' : '[data-red-keep]'); if (red) { await tap(red); return 'red'; }
    const fix = await page.$(rnd() < 0.5 ? '[data-buttons-show]' : '[data-buttons-quiet]'); if (fix) { await tap(fix); return 'fix'; }
    const done = await page.$('[data-buttons-done]:not([disabled])'); if (done) { await tap(done); return 'buttons-done'; }
    const wrongByHoda = await page.$('[data-where="0"][data-button="smallBrown"][data-by="hoda"], [data-where="1"][data-button="bigWhite"][data-by="hoda"]');
    if (wrongByHoda && rnd() < 0.8) { await tap(wrongByHoda); return 'inspect'; }
    for (const [kind, bowl] of [['bigBrown', 0], ['smallWhite', 1]]) {
      const b = await page.$(`[data-button="${kind}"][data-where="pile"]`);
      if (b) {
        const bb = await b.boundingBox(); const bw = await (await page.$(`[data-bowl="${bowl}"]`)).boundingBox();
        if (!touch && rnd() < 0.5) { await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(bw.x + bw.width / 2, bw.y + bw.height / 3, { steps: 5 }); await page.mouse.up(); }
        else { await tap(b); await page.waitForTimeout(60); const bowlEl = await page.$(`[data-bowl="${bowl}"]`); const box = await bowlEl.boundingBox(); if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 3); else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 3); }
        return 'place';
      }
    }
    await page.waitForTimeout(400); return 'buttons-wait';
  }
  if (await page.$('[data-activity="dress"]')) {
    const wears = await page.$$('[data-wear]');
    if (rnd() < 0.5 && wears.length) { await tap(wears[pickIdx(wears.length)]); }
    const mend = await page.$('[data-mend]');
    if (mend && rnd() < 0.7) { await tap(mend); const opt = await page.$(rnd() < 0.5 ? '[data-mend-flower]' : '[data-mend-plain]') ?? await page.$('[data-mend-sleeve]') ?? await page.$('[data-mend-plain]'); if (opt) await tap(opt); }
    await tap(await page.$('[data-dress-done]')); return 'dress-done';
  }
  if (await page.$('[data-activity="pack"]')) {
    const it = await page.$('[data-pack]'); if (it) { await tap(it); return 'pack'; }
    await tap(await page.$('[data-pack-done]')); return 'pack-done';
  }
  return null;
}

let ended = false;
while (log.steps < Number(process.env.E2E_MAX ?? 2500)) {
  log.steps++;
  await page.waitForTimeout(30);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (sw > 1) log.overflow.push(log.steps);
  if (await page.$('[data-screen="end"]')) {
    const next = await page.$('[data-next-chapter]');
    if (SHOTS) await page.screenshot({ path: `${OUT}/end-${lastChapter}.png` });
    if (next) { await tap(next); continue; }
    ended = true; break;
  }
  const info = await page.evaluate(() => {
    const g = document.querySelector('[data-screen="game"]');
    const panel = document.querySelector('[data-panel]');
    return g ? { id: g.getAttribute('data-node-id'), type: g.getAttribute('data-node-type'), text: panel?.innerText ?? '' } : null;
  });
  if (!info) { await page.waitForTimeout(200); continue; }
  if (process.env.E2E_TRACE && log.steps > Number(process.env.E2E_TRACE)) console.log(log.steps, info.id, info.type, info.text.slice(0, 80).replace(/\s+/g, ' '));
  const ch = await page.evaluate(() => JSON.parse(localStorage.getItem('beitna-fein:save') ?? '{}').chapter);
  if (ch !== lastChapter) { lastChapter = ch; log.chapters.push(ch); }
  if (info.type === 'activity' && await page.$('[data-ritual]')) {
    if (!ritualStart) ritualStart = Date.now();
    if (process.env.E2E_RELOAD_RITUAL === '1' && log.reloadInRitual === null) {
      await page.reload(); await page.click('[data-continue]').catch(() => {}); await page.waitForSelector('[data-screen="game"]');
      log.reloadInRitual = await page.evaluate(() => document.querySelector('[data-screen="game"]')?.getAttribute('data-node-id'));
      continue;
    }
    const r = await ritual();
    log.rituals[info.id] = (log.rituals[info.id] ?? 0) + 1;
    if (SHOTS && r && /throw|place|mend|dress-done|pack$|red|inspect/.test(r) && !seen.has(info.id + r)) { seen.add(info.id + r); await page.screenshot({ path: `${OUT}/${String(log.steps).padStart(4, '0')}-${info.id}-${r}.png` }); }
    continue;
  }
  if (ritualStart) { log.ritualMsByChapter[ch] = (log.ritualMsByChapter[ch] ?? 0) + (Date.now() - ritualStart); ritualStart = 0; }
  if (info.type === 'line') log.wordsByChapter[ch] = (log.wordsByChapter[ch] ?? 0) + words(info.text.replace('▼ كمّلي', '')) / 2;
  if (SHOTS && !seen.has(info.id) && seen.size < 400) { seen.add(info.id); await page.screenshot({ path: `${OUT}/${String(log.steps).padStart(4, '0')}-${info.id}.png` }); }
  const choice = await page.$$('[data-choice]');
  if (choice.length) { await tap(choice[pickIdx(choice.length)]); continue; }
  const hubs = await page.$$('[data-hub] [data-hotspot]');
  // In rooms, 'first' rotates through the actions (always taking the first would only ever talk).
  if (hubs.length) { log.hubTurns = (log.hubTurns ?? 0) + 1; await tap(hubs[POLICY === 'random' ? pickIdx(hubs.length) : (POLICY === 'last' ? hubs.length - 1 - (log.hubTurns % hubs.length) : log.hubTurns % hubs.length)]); continue; }
  // Kitchen and bed are the older menu activities (covered by scripts/e2e.mjs); press them directly.
  const press = (sel) => page.$eval(sel, (e) => e.click());
  if (await page.$('[data-kitchen-item]')) { await press('[data-kitchen-item]'); await press('[data-kitchen-confirm]'); continue; }
  if (await page.$('[data-bed-option]')) { for (const g of await page.$$('[role=radiogroup]')) { const o = await g.$$('[data-bed-option]'); await o[pickIdx(o.length)].evaluate((e) => e.click()); } await press('[data-bed-confirm]'); continue; }
  const adv = await page.$('[data-advance]');
  if (adv) { await tap(adv); continue; }
  const card = await page.$('[data-card] button, [data-screen="card"] button, button[data-card-next]');
  if (card) { await tap(card); continue; }
  await page.mouse.click(10, 10);
}
log.ended = ended; log.errors = errors;
for (const k of Object.keys(log.wordsByChapter)) log.wordsByChapter[k] = Math.round(log.wordsByChapter[k]);
fs.writeFileSync(`${OUT}/result.json`, JSON.stringify(log, null, 2));
console.log(JSON.stringify({ vp: VP, policy: POLICY, ended, steps: log.steps, chapters: log.chapters, words: log.wordsByChapter, ritualSeconds: Object.fromEntries(Object.entries(log.ritualMsByChapter).map(([k, v]) => [k, Math.round(v / 1000)])), rituals: Object.keys(log.rituals).length, reloadInRitual: log.reloadInRitual, overflow: log.overflow.length, errors }, null, 1));
await browser.close();
process.exit(ended && !errors.length && !log.overflow.length ? 0 : 1);
