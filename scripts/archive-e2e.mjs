// Compares the public build (4173) with the local-archive build (4174) on the same radio moment.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
for (const [label, url] of [['public', 'http://localhost:4173/'], ['local-archive', 'http://localhost:4174/']]) {
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const files = []; p.on('request', (r) => { if (/\.(mp3|m4a)$/.test(r.url())) files.push(r.url().split('/').slice(-2).join('/')); });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(() => localStorage.setItem('beitna-fein:save', JSON.stringify({ version: 2, chapter: 'ch2', node: 'c2_kids', scene: 'living', cast: ['hoda'], day: 1, slot: 3, money: 30, vars: { trust: 22, safety: 30, openness: 16, autonomy: 50, distress: 48 }, flags: {}, likes: [], dislikes: [], visited: [], completed: [], music: null })));
  await p.reload({ waitUntil: 'load' }); await wait(800);
  await p.click('[data-continue]'); await wait(4000);   // Chapter 2: the quiet Abla Fadila moment with Hoda
  const banner = !!(await p.$('[data-local-archive]'));
  const localBadge = !!(await p.$('[data-radio-local]'));
  const radioFiles = files.filter((f) => f.startsWith('radio/') || f.startsWith('local-archive/'));
  const level = await p.evaluate(() => window.__beitnaAudio.outputLevel());
  const ok = label === 'public' ? !banner && !localBadge && !radioFiles.some((f) => f.startsWith('local-archive')) && (await p.$eval('[data-radio]', (e) => e.textContent).catch(() => '')).includes('مافيش تسجيل أصلي') : banner && localBadge && radioFiles.includes('local-archive/abla_fadila_episode.m4a');
  if (!ok || errs.length) fails++;
  console.log(label.padEnd(14), ok ? 'PASS' : 'FAIL', '| banner', banner, '| local badge', localBadge, '| radio file', radioFiles.join(','), '| level', level.toFixed(3), errs.length ? '| errors ' + errs : '');
  await p.screenshot({ path: process.argv[2] + `/archive-${label}.png` });
  await p.close();
}
await b.close(); process.exit(fails ? 1 : 0);
