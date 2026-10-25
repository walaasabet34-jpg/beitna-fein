// Run against `npm run dev -- --port 4173` (uses Vite's engine modules for a carried save).
import assert from 'node:assert/strict';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH ?? await chromium.executablePath(), args: chromium.args, headless: true });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport(viewport);
    await page.goto(process.env.E2E_URL ?? 'http://localhost:4173/', { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      const core = await import('/src/engine/core.ts');
      const { CHAPTERS } = await import('/src/content/index.ts');
      const { simulate } = await import('/src/engine/sim.ts');
      const [a, b, c] = ['ch1', 'ch2', 'ch3'].map(id => core.indexChapter(CHAPTERS[id]));
      let s = core.enter(a, core.newGame(a), 'c1_b_force_c');
      s = core.choose(a, s, core.visibleOptions(core.getNode(a, s.node), s)[1]);
      s = simulate(a, 19, 3000, 'random', s).state;
      s = simulate(b, 19, 3000, 'random', core.continueToChapter(b, s)).state;
      s = core.continueToChapter(c, s);
      if (!s.flags.bag_on_closet) throw new Error('Missing carried wardrobe choice');
      localStorage.setItem('beitna-fein:save', JSON.stringify(s));
      localStorage.setItem('beitna-fein:settings', JSON.stringify({ sound: false, textSpeed: 'instant', reducedMotion: true }));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.click('[data-continue]');
    await page.waitForSelector('[data-screen="game"]');
    const seen = new Set();
    for (let step = 0; step < 100; step++) {
      if (await page.$('[data-screen="end"]')) break;
      const info = await page.$eval('[data-screen="game"]', el => ({ id: el.dataset.nodeId, type: el.dataset.nodeType }));
      seen.add(info.id);
      const clock = await page.$eval('[data-testid="clock"]', el => el.textContent);
      if (info.id === 'c3_bag1') {
        assert.match(clock, /المغرب/);
        assert(await page.$('[data-stage] path[d="M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6"]'));
      }
      if (info.id === 'c3_night') {
        assert.match(clock, /الورقة.*بالليل/);
        assert(await page.$('[data-stage] circle[fill="url(#lampGlow)"]'));
        assert.equal(await page.$('[data-stage] .rays'), null);
      }
      if (info.id === 'c3_day2') assert.match(clock, /الشنطة.*الصبح/);
      if (info.type === 'choice') await page.click('[data-choice="0"]');
      else await page.click('[data-advance]');
      await page.waitForFunction(id => !document.querySelector('[data-screen="game"]') || document.querySelector('[data-screen="game"]').dataset.nodeId !== id, {}, info.id);
    }
    assert(await page.$('[data-screen="end"]'));
    for (const id of ['c3_bag1', 'c3_night', 'c3_day2']) assert(seen.has(id));
    assert.deepEqual(errors, []);
    console.log(`${viewport.width}px: Chapter 1 wardrobe choice → Chapter 2 → Chapter 3 ending; suitcase, clock and night lighting passed`);
    await page.close();
  }
} finally { await browser.close(); }
