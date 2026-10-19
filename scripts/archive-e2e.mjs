// Compares the public build (4173) with the local personal build (4174) at the Chapter 2 radio moments.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter((a) => a !== '--single-process' && a !== '--no-zygote'), headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const save = (node) => ({ version: 2, chapter: 'ch2', node, scene: 'living', cast: ['hoda'], day: 1, slot: 3, money: 30, vars: { trust: 22, safety: 30, openness: 16, autonomy: 50, distress: 48 }, flags: {}, likes: [], dislikes: [], visited: [], completed: [], music: null });
for (const [label, url] of [['public', 'http://localhost:4173/'], ['local', 'http://localhost:4174/']]) {
  for (const [moment, node, choice] of [['kids', 'c2_kids', null], ['song', 'c2_radio_c', 1]]) {
    const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const files = []; p.on('request', (r) => { if (/\.(mp3|m4a)$/.test(r.url())) files.push(r.url().split('/').slice(-2).join('/')); });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(url, { waitUntil: 'load' });
    await p.evaluate((s) => localStorage.setItem('beitna-fein:save', JSON.stringify(s)), save(node));
    await p.reload({ waitUntil: 'load' }); await wait(800);
    await p.click('[data-continue]'); await wait(choice === null ? 4000 : 500);
    if (choice !== null) { await p.click(`[data-choice="${choice}"]`); await wait(4000); }
    const embed = await p.$eval('[data-radio-embed]', (e) => e.getAttribute('data-radio-embed')).catch(() => null);
    const line = await p.$eval('[data-screen="game"]', (e) => e.innerText).catch(() => '');
    const radioFiles = files.filter((f) => f.startsWith('radio/') || f.startsWith('local-archive/'));
    const anyLocal = radioFiles.some((f) => f.startsWith('local-archive'));
    let playing = false;
    for (let i = 0; i < 40 && !playing; i++) { playing = await p.evaluate(() => window.__beitnaAudio.audioStatus().radio.playing); if (!playing) await wait(500); }
    let ok;
    if (moment === 'kids') ok = label === 'public' ? embed === 'a_uNSnFAFCQ' && !anyLocal : radioFiles.includes('local-archive/abla_fadila_episode.m4a') && playing && !embed;
    else ok = label === 'public' ? radioFiles.includes('radio/arch_munira_c1914.mp3') && !anyLocal && playing : radioFiles.includes('local-archive/aash_elli_al_song.mp3') && playing && line.includes('عاش اللي قال');
    const devText = /مؤقت|TEMP|نسخة محلية|الحقوق مش|مافيش تسجيل/.test(await p.evaluate(() => document.body.innerText));
    if (!ok || devText || errs.length) fails++;
    console.log(label.padEnd(7), moment.padEnd(5), ok && !devText ? 'PASS' : 'FAIL', '| embed', embed, '| files', radioFiles.join(','), '| playing', playing, devText ? '| DEV TEXT' : '', errs.length ? '| errors ' + errs : '');
    if (process.argv[2]) await p.screenshot({ path: process.argv[2] + `/archive-${label}-${moment}.png` });
    await p.close();
  }
}
// The Chapter 2 story line follows the recording that plays
for (const [label, url, re] of [['public', 'http://localhost:4173/', /تاجر/], ['local', 'http://localhost:4174/', /بالدهب/]]) {
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate((s) => localStorage.setItem('beitna-fein:save', JSON.stringify(s)), save('c2_kids3'));
  await p.reload({ waitUntil: 'load' }); await wait(800); await p.click('[data-continue]'); await wait(2500);
  await p.click('[data-advance]').catch(() => {}); await wait(300);
  const t = await p.$eval('[data-screen="game"]', (e) => e.innerText);
  const ok = re.test(t); if (!ok) fails++;
  console.log(label.padEnd(7), 'story', ok ? 'PASS' : 'FAIL', t.replace(/\s+/g, ' ').slice(0, 90));
  await p.close();
}
await b.close(); process.exit(fails ? 1 : 0);
