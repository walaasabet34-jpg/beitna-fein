// End-to-end playthrough in a real headless Chromium (mobile + desktop viewports).
// Usage: npm run build && npx vite preview --port 4173 & node scripts/e2e.mjs [outDir]
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const URL = process.env.E2E_URL ?? 'http://localhost:4173/';
const OUT = process.argv[2] ?? 'e2e-shots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
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
  executablePath: await chromium.executablePath(),
  args: [...chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), '--lang=ar'],
  headless: true,
});

const results = [];
for (const run of RUNS.slice(0, Number(process.env.E2E_RUNS ?? RUNS.length))) {
  const r = rng(run.seed);
  const pick = (n) => (run.policy === 'first' ? 0 : run.policy === 'last' ? n - 1 : Math.floor(r() * n));
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEWPORTS[run.vp]);
  if (run.reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`console.${m.type()}: ${m.text()}`); });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  const tag = `${run.vp}-${run.policy}-${run.seed}`;
  await page.screenshot({ path: `${OUT}/${tag}-00-title.png` });
  await page.click('[data-new-game]');

  const shot = new Set();
  let hubVisits = 0;
  let steps = 0, reloadOk = null, overflow = false, ended = false;
  const visited = [];
  while (steps < 600) {
    steps++;
    await new Promise((res) => setTimeout(res, 40));
    if (await page.$('[data-screen="end"]')) { ended = true; break; }
    const info = await page.evaluate(() => {
      const g = document.querySelector('[data-screen="game"]');
      return g ? { id: g.getAttribute('data-node-id'), type: g.getAttribute('data-node-type'), sw: document.documentElement.scrollWidth, iw: window.innerWidth } : null;
    });
    if (!info) throw new Error(`${tag}: game screen missing at step ${steps}`);
    visited.push(info.id);
    if (info.sw > info.iw + 1) overflow = true;

    const key = info.type + (info.id.startsWith('c1_draw') ? '-draw' : '') + (info.id.startsWith('c1_m') ? '-morning' : '') + (info.id.startsWith('c1_d') && info.type === 'line' ? '-door' : '') + (info.id.startsWith('c1_night') ? '-night' : '');
    if (!shot.has(key)) { shot.add(key); await new Promise((res) => setTimeout(res, 900)); await page.screenshot({ path: `${OUT}/${tag}-${String(shot.size).padStart(2, '0')}-${key}-${info.id}.png` }); }

    if (run.reloadAt && steps === run.reloadAt) {
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-continue]', { timeout: 5000 });
      await page.click('[data-continue]');
      await page.waitForSelector('[data-screen="game"]');
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
  await page.screenshot({ path: `${OUT}/${tag}-99-end.png` });
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
    await page.screenshot({ path: `${OUT}/${tag}-98-menu.png` });
  }
  const res = { tag, ended, steps, reloadOk, overflow, menuOk, errors: [...new Set(errors)], uniqueNodes: new Set(visited).size };
  results.push(res);
  console.log('RUN', JSON.stringify(res));
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
const bad = results.filter((x) => 'ended' in x && (!x.ended || x.errors.length || x.overflow || x.reloadOk === false || !x.menuOk));
process.exit(bad.length ? 1 : 0);
