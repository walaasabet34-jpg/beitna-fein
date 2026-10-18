// Jump to a specific story node via a crafted save and screenshot it (visual QA helper).
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const [node, out, vp = 'mobile', extra = '{}'] = process.argv.slice(2);
const VP = { mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, desktop: { width: 1440, height: 900 } };
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), headless: true });
const p = await b.newPage(); await p.setViewport(VP[vp]);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
const save = { version: 1, chapter: 'ch1', node, scene: 'living', day: 1, slot: 2, money: 35,
  vars: { trust: 22, safety: 30, openness: 16, autonomy: 50, distress: 48 }, flags: {}, likes: [], dislikes: [], visited: [], ...JSON.parse(extra) };
await p.evaluate((s) => localStorage.setItem('beitna-fein:save', JSON.stringify(s)), save);
await p.reload({ waitUntil: 'networkidle0' });
await p.click('[data-continue]'); await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: out }); console.log(node, vp, 'errors:', errs.length);
await b.close();
