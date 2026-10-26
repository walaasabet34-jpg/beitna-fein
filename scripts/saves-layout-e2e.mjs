// Browser checks for old saves, reloads inside a ritual, RTL and screen overflow on small and large screens.
// Usage: PW=/path/to/playwright/index.mjs node scripts/saves-layout-e2e.mjs   (preview server on 4173)
const { chromium } = await import(process.env.PW ?? 'playwright');
const URL = process.env.E2E_URL ?? 'http://127.0.0.1:4173/';
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, detail); };
const base = { scene: 'living', day: 1, slot: 2, money: 20, vars: { trust: 25, safety: 25, openness: 15, autonomy: 50, distress: 50 }, likes: [], dislikes: [], visited: [], cast: ['hoda'] };

async function withSave(vp, save, fn) {
  const ctx = await browser.newContext(vp);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('beitna-fein:save', JSON.stringify(s)); localStorage.setItem('beitna-fein:settings', JSON.stringify({ textSpeed: 'instant', sound: false, reducedMotion: true })); }, save);
  await page.reload();
  await page.click('[data-continue]');
  await page.waitForSelector('[data-screen="game"]');
  await page.waitForTimeout(500);
  await fn(page);
  check(`no JS errors (${save.node})`, errors.length === 0, errors.join('; '));
  await ctx.close();
}
const node = (p) => p.getAttribute('[data-screen="game"]', 'data-node-id');
const phone = { viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true };
const tall = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const desk = { viewport: { width: 1440, height: 900 } };

// 1. v2 save on a node removed in v3 → nearest equivalent, flags kept
await withSave(phone, { ...base, version: 2, chapter: 'ch1', node: 'bond_buttons_pick', flags: { greet: 'kneel', bag_promise: true } }, async (p) => {
  check('v2 save on removed node resumes at c1_hub', (await node(p)) === 'c1_hub', await node(p));
  const s = await p.evaluate(() => JSON.parse(localStorage.getItem('beitna-fein:save')));
  check('flags kept, version 3, thread spools added', s.flags.greet === 'kneel' && s.version === 3 && s.flags.thread === 2, JSON.stringify(s.flags));
});
// 2. v2 save in the middle of chapter 4 (old content node that still exists)
await withSave(tall, { ...base, version: 2, chapter: 'ch4', node: 's_stitch', flags: { mother_contacted: true, war_shared_joy: true } }, async (p) => {
  check('v2 mid-ch4 save continues in place', (await node(p)) === 's_stitch');
});
// 3. a save pointing at a node that never existed → the chapter restarts, nothing forgotten
await withSave(tall, { ...base, version: 3, chapter: 'ch2', node: 'no_such_node', flags: { greet: 'wide', thread: 1 } }, async (p) => {
  const s = await p.evaluate(() => JSON.parse(localStorage.getItem('beitna-fein:save')));
  check('unknown node falls back to the chapter, not a new game', s.chapter === 'ch2' && s.flags.greet === 'wide', s.node);
});
// 4. reload inside each ritual: the same ritual comes back, money unchanged
for (const [chapter, n, scene] of [['ch1', 'ball_c1', 'living'], ['ch1', 'c1_buttons_with', 'living'], ['ch2', 'c2_dress_act', 'morning'], ['ch5', 'g_pack', 'living']]) {
  await withSave(tall, { ...base, version: 3, chapter, node: n, scene, flags: { thread: 2, ball_games: 1, hoda_died: chapter === 'ch5' } }, async (p) => {
    await p.reload(); await p.click('[data-continue]'); await p.waitForSelector('[data-ritual]');
    const s = await p.evaluate(() => JSON.parse(localStorage.getItem('beitna-fein:save')));
    check(`reload inside ${n} returns to it`, (await node(p)) === n && s.money === 20);
  });
}
// 5. RTL and overflow on 360×640, 390×844 and desktop, on a hub, a ritual and a choice
for (const [label, vp] of [['360', phone], ['390', tall], ['desktop', desk]]) {
  for (const [chapter, n] of [['ch1', 'c1_hub'], ['ch1', 'c1_buttons_with'], ['ch2', 'c2_q_c'], ['ch4', 's_hub']]) {
    await withSave(vp, { ...base, version: 3, chapter, node: n, flags: { thread: 2 } }, async (p) => {
      const m = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - window.innerWidth, dir: document.documentElement.dir, stage: document.querySelector('[data-stage]')?.getBoundingClientRect().width ?? 0 }));
      check(`${label} ${n}: RTL, no horizontal overflow, stage fits`, m.over <= 1 && m.dir === 'rtl' && m.stage <= (vp.viewport.width + 1), JSON.stringify(m));
    });
  }
}
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
