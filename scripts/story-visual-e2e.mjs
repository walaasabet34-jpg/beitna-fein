// Targeted story UI checks. Run against a dev/preview server at E2E_URL (default port 4173).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const out = process.env.STORY_SHOTS ?? '/tmp/beitna-story-shots';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH ?? await chromium.executablePath(), args: chromium.args, headless: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [chapter, node, day, slot, cast, flags] of [
      ['chwar', 'w_joy', 1, 2, ['hoda'], { war_shared_joy: true }],
      ['ch4', 's_breath', 4, 2, ['hoda'], {}],
      ['ch5', 'g_arrival', 2, 0, ['mother', 'naima'], { hoda_died: true }],
      ['ch5', 'g_after', 2, 0, [], { hoda_died: true, belongings_delivery: 'mother' }],
    ]) {
      await page.goto(process.env.E2E_URL ?? 'http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });
      await page.evaluate(s => {
        localStorage.setItem('beitna-fein:save', JSON.stringify(s));
        localStorage.setItem('beitna-fein:settings', JSON.stringify({ sound: false, textSpeed: 'instant', reducedMotion: true }));
      }, { version: 2, chapter, node, day, slot, scene: node === 's_breath' ? 'hospital' : 'living', cast, flags, money: 30,
        vars: { trust: 40, safety: 45, openness: 30, autonomy: 50, distress: 30 }, likes: [], dislikes: [], visited: [], music: null });
      await page.reload({ waitUntil: 'networkidle0' });
      await page.click('[data-continue]');
      await page.waitForSelector(`[data-node-id="${node}"]`);
      if (node === 's_breath') assert(await page.$('[data-patient]'));
      if (node === 'g_after') assert.equal(await page.$('[data-stage] path[d="M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6"]'), null);
      if (node === 'w_joy') assert.match(await page.$eval('[data-testid="clock"]', e => e.textContent), /06\/10.*العصر/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${width}/${node} overflows`);
      await page.screenshot({ path: `${out}/${width}-${node}.png` });
      console.log(`${width}/${node}: stage, clock and layout passed`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); }
