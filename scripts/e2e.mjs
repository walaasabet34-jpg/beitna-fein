// End-to-end playthrough in a real headless Chromium (mobile + desktop viewports).
// Usage: npm run build && npx vite preview --port 4173 & node scripts/e2e.mjs [outDir]
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const URL = process.env.E2E_URL ?? 'http://localhost:4173/';
const OUT = process.argv[2] ?? 'e2e-shots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: Number(process.env.E2E_DPR ?? 2), isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};
const RUNS = [
  { vp: 'mobile', policy: 'first', seed: 1, reloadAt: 25 },
  { vp: 'mobile', policy: 'random', seed: 7, reloadAt: 60 },
  { vp: 'desktop', policy: 'random', seed: 3, reloadAt: 40, viaStage: true },
  { vp: 'desktop', policy: 'last', seed: 11, reloadAt: 0 },
  { vp: 'mobile', policy: 'random', seed: 42, reloadAt: 0, reducedMotion: true },
];

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const browser = await puppeteer.launch({
  executablePath: process.env.CHROMIUM_PATH ?? await chromium.executablePath(),
  args: [...chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), '--lang=ar'],
  headless: true,
  protocolTimeout: 600000,
});

const results = [];
let skippedShots = 0;
// Headless Chromium here sometimes never returns a frame for a screenshot of the animated stage.
// A stuck screenshot must not stop the playthrough: give up on that picture after 8 s and keep playing.
const snap = (page, path) => process.env.E2E_NO_SHOTS ? Promise.resolve() : Promise.race([page.screenshot({ path }).catch(() => { skippedShots++; }), new Promise((r) => setTimeout(() => { skippedShots++; r(); }, 8000))]);
for (const run of RUNS.slice(Number(process.env.E2E_FROM ?? 0), Number(process.env.E2E_RUNS ?? RUNS.length))) {
  const r = rng(run.seed);
  const pick = (n) => (run.policy === 'first' ? 0 : run.policy === 'last' ? n - 1 : Math.floor(r() * n));
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEWPORTS[run.vp]);
  if (run.reducedMotion || process.env.E2E_REDUCED) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`console.${m.type()}: ${m.text()}`); });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('beitna-fein:settings', JSON.stringify({ textSpeed: 'instant', sound: false, reducedMotion: true })); });
  await page.reload({ waitUntil: 'networkidle0' });
  const tag = `${run.vp}-${run.policy}-${run.seed}`;
  if (process.env.E2E_TRACE) console.log('before title shot'); await snap(page, `${OUT}/${tag}-00-title.png`);
  if (process.env.E2E_TRACE) console.log('title shot done'); await page.click('[data-new-game]'); await page.waitForSelector('[data-screen="game"]', { timeout: 15000 }); if (process.env.E2E_TRACE) console.log('new game clicked');

  const shot = new Set();
  let hubVisits = 0;
  let rtlOk = true;
  let steps = 0, reloadOk = null, overflow = false, ended = false;
  const visited = [];
  let chapter1Done = false; let chapterTransitions = 0;
  while (steps < 1200) {
    steps++; if (process.env.E2E_TRACE) console.log("step", steps, new Date().toISOString().slice(11, 19));
    await new Promise((res) => setTimeout(res, 40));
    if (await page.$('[data-screen="end"]')) {
      if (await page.$('[data-next-chapter]')) {
        chapterTransitions++;
        chapter1Done = true;
        await snap(page, `${OUT}/${tag}-50-ch1-end.png`);
        await page.click('[data-next-chapter]'); continue;
      }
      ended = true; break;
    }
    const TR = (m) => process.env.E2E_TRACE && console.log('  ', m, new Date().toISOString().slice(14, 23));
    TR('eval');
    const info = await page.evaluate(() => {
      const g = document.querySelector('[data-screen="game"]');
      const panel = document.querySelector('[data-panel]');
      const btn = document.querySelector('[data-choice], [data-hub] [data-hotspot]');
      const rtl = document.documentElement.dir === 'rtl' && (!panel || getComputedStyle(panel).direction === 'rtl') && (!btn || ['right', 'start'].includes(getComputedStyle(btn).textAlign) || getComputedStyle(btn).justifyContent !== '');
      return g ? { id: g.getAttribute('data-node-id'), type: g.getAttribute('data-node-type'), sw: document.documentElement.scrollWidth, iw: window.innerWidth, rtl } : null;
    });
    if (!info) throw new Error(`${tag}: game screen missing at step ${steps}`);
    visited.push(info.id);
    if (info.sw > info.iw + 1) overflow = true;
    if (!info.rtl) rtlOk = false;

    const key = info.id.slice(0, 2) + '-' + info.type + (/draw|hw/.test(info.id) ? '-pad' : '') + (/_m|_d2|_out/.test(info.id) ? '-day2' : '') + (/_d\d|_leave|_return|_naima|_un\d/.test(info.id) && info.type === 'line' ? '-door' : '') + (/night|cert|sleep/.test(info.id) ? '-night' : '') + (/teacher/.test(info.id) ? '-school' : '') + (/radio|r_news|r_kids|kids/.test(info.id) ? '-radio' : '');
    TR('evaluated ' + info.id);
    if (!process.env.E2E_NO_SHOTS && !shot.has(key)) { TR('shot'); shot.add(key); await new Promise((res) => setTimeout(res, 900)); await snap(page, `${OUT}/${tag}-${String(shot.size).padStart(2, '0')}-${key}-${info.id}.png`); }

    if (run.reloadAt && steps === run.reloadAt) {
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-continue]', { timeout: 20000 }).catch(async (e) => {
        console.log('reload at', info.id, 'page:', (await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\s+/g, ' '),
          'save:', (await page.evaluate(() => localStorage.getItem('beitna-fein:save')))?.slice(0, 200));
        throw e;
      });
      await new Promise((res) => setTimeout(res, 1500));   // let the title's entrance animation finish, as a player would
      await page.click('[data-continue]');
      await page.waitForSelector('[data-screen="game"]', { timeout: 30000 }).catch(async (e) => {
        console.log('after continue at', info.id, 'screens:', await page.evaluate(() => [...document.querySelectorAll('[data-screen]')].map((x) => x.getAttribute('data-screen')).join(',')),
          'text:', (await page.evaluate(() => document.body.innerText)).slice(0, 200).replace(/\s+/g, ' '));
        throw e;
      });
      const after = await page.$eval('[data-screen="game"]', (el) => el.getAttribute('data-node-id'));
      reloadOk = after === info.id;
      continue;
    }

    if (info.type === 'line' || info.type === 'card') {
      for (let k = 0; k < 4; k++) {
        await page.click('[data-advance]').catch(() => {});
        await new Promise((res) => setTimeout(res, 30));
        const now = await page.$eval('[data-screen="game"]', (el) => el.getAttribute('data-node-id')).catch(() => null);
        if (now !== info.id) break;
      }
    } else if (info.type === 'choice') {
      const n = (await page.$$('[data-choice]')).length;
      if (!n) throw new Error(`${tag}: choice with no buttons at ${info.id}`);
      await page.click(`[data-choice="${pick(n)}"]`);
    } else if (info.type === 'hub') {
      const sel = run.viaStage && r() < 0.5 ? '.hot[data-hotspot]' : '[data-hub] [data-hotspot]';
      let btns = await page.$$(sel);
      if (!btns.length) btns = await page.$$('[data-hub] [data-hotspot]');
      if (!btns.length) throw new Error(`${tag}: hub without actions at ${info.id}`);
      // prefer essentials sometimes so runs vary but still finish
      const ids = await Promise.all(btns.map((b) => b.evaluate((e) => e.getAttribute('data-hotspot'))));
      hubVisits++;
      const timed = await Promise.all(btns.map((b) => b.evaluate((e) => e.textContent.includes('⏳'))));
      let i = pick(btns.length);
      if (hubVisits % 4 === 0 && timed.some(Boolean)) { const t = timed.map((x, k) => (x ? k : -1)).filter((k) => k >= 0); i = t[Math.floor(r() * t.length)]; }
      if (run.policy === 'first') { const e = ids.findIndex((x) => x === 'cook' || x === 'bed'); if (e >= 0) i = e; }
      await btns[i].click();
    } else if (info.type === 'activity') {
      if (await page.$('[data-activity="kitchen"]')) {
        const items = await page.$$('[data-kitchen-item]:not([disabled])');
        const k = 1 + Math.floor(r() * 3);
        for (let j = 0; j < k; j++) {
          const free = await page.$$('[data-kitchen-item]:not([disabled])[aria-pressed="false"]');
          if (!free.length) break;
          await free[Math.floor(r() * free.length)].evaluate((e) => e.click());
        }
        if (!(await page.$('[data-kitchen-confirm]:not([disabled])'))) await items[0].evaluate((e) => e.click());
        await page.click('[data-kitchen-confirm]');
      } else {
        const groups = await page.$$eval('[data-bed-option]', (els) => [...new Set(els.map((e) => e.getAttribute('data-bed-option').split(':')[0]))]);
        for (const g of groups) {
          const opts = await page.$$(`[data-bed-option^="${g}:"]`);
          await opts[pick(opts.length)].evaluate((e) => e.click());
        }
        await page.click('[data-bed-confirm]');
      }
    }
  }
  await new Promise((res) => setTimeout(res, 600));
  await snap(page, `${OUT}/${tag}-99-end.png`);
  // pause menu + save check
  let menuOk = false;
  if (ended) {
    const endText = await page.$eval('[data-screen="end"]', (e) => e.innerText.slice(0, 200));
    results.push({ tag, endText });
  }
  // open a fresh game to test pause menu on this viewport
  await page.click('[data-restart]').catch(() => {});
  await new Promise((res) => setTimeout(res, 400));
  await page.click('[data-advance]').catch(() => {});
  await page.waitForSelector('[data-menu]', { timeout: 5000 }).catch(() => {});
  if (await page.$('[data-menu]')) {
    await page.click('[data-menu]');
    await page.waitForSelector('[data-pause]');
    await page.click('[data-save]');
    menuOk = await page.$eval('[data-save]', (e) => e.textContent.includes('اتحفظت'));
    await snap(page, `${OUT}/${tag}-98-menu.png`);
  }
  const res = { tag, ended, reachedCh2: chapter1Done, chapterTransitions, steps, reloadOk, overflow, rtlOk, menuOk, errors: [...new Set(errors)], uniqueNodes: new Set(visited).size };
  results.push(res);
  console.log('RUN', JSON.stringify(res));
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2)); console.log('screenshots skipped (renderer stall):', skippedShots);
const bad = results.filter((x) => 'ended' in x && (!x.ended || x.chapterTransitions !== 5 || x.errors.length || x.overflow || !x.rtlOk || x.reloadOk === false || !x.menuOk));
process.exit(bad.length ? 1 : 0);
