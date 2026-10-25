// Real UI regression checks against the built app; fixtures represent different saved choices.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const url=process.env.E2E_URL??'http://127.0.0.1:4173/';
const out=process.env.EDITORIAL_SHOTS??'/tmp/beitna-editorial-shots';fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM_PATH??await chromium.executablePath(),args:chromium.args,headless:true});
const handle='[data-stage] path[d="M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6"]';
let checks=0;
try{
 for(const width of [390,1440]){
  const page=await browser.newPage();await page.setViewport({width,height:width===390?844:900});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle0'});
  const load=async(chapter,node,flags={},extras={})=>{
   const s={version:2,chapter,node,flags,day:['ch1','ch5'].includes(chapter)?2:1,slot:0,scene:'living',cast:['hoda'],money:30,vars:{trust:40,safety:45,openness:30,autonomy:50,distress:25},likes:[],dislikes:[],visited:[],music:null,...extras};
   await page.evaluate(s=>{
    localStorage.setItem('beitna-fein:save',JSON.stringify(s));localStorage.setItem('beitna-fein:settings',JSON.stringify({sound:false,textSpeed:'instant',reducedMotion:true}));
   },s);
   await page.reload({waitUntil:'load'});await page.waitForSelector('[data-continue]');await page.click('[data-continue]');
   await page.waitForSelector('[data-screen="game"], [data-screen="end"]');
  };
  const node=()=>page.$eval('[data-screen="game"]',e=>e.getAttribute('data-node-id'));
  const body=()=>page.$eval('[data-panel]',e=>e.innerText);
  const next=async()=>{const before=await node();await page.click('[data-advance]');await page.waitForFunction(id=>document.querySelector('[data-screen="game"]')?.getAttribute('data-node-id')!==id,{},before);};
  const check=async(name)=>{
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${name} overflow`);
   await page.screenshot({path:`${out}/${width}-${name}.png`});checks++;console.log(`${width}/${name}: passed`);
  };
  await load('ch1','c1_m_cost_stale');assert.match(await body(),/يا خالتي/);assert.doesNotMatch(await body(),/خالتو/);await check('address');
  await load('ch3','c3_final_choice',{c3_note_checked:true});assert.match(await body(),/طلعت ست تانية.*لسه بندوّر/s);await page.click('[data-choice="0"]');assert.equal(await node(),'c3_final_clear');assert.match(await body(),/قوليلي لما تعرفي/);await check('rejected-lead');
  for(const refused of [false,true]){
   await load('ch4','s_reply',{memory_refused:refused,buttons_stopped:true},{scene:'hospital'});
   const options=await page.$$eval('[data-choice]',els=>els.map(e=>e.innerText));assert.equal(options.some(t=>t.includes('سيبي الإبرة')),refused);await check(`apology-${refused}`);
  }
  await load('ch4','mother_reply',{mother_contacted:true},{scene:'paper',cast:[]});assert.match(await body(),/قريتي لهدى/);assert.doesNotMatch(await body(),/فوق الدولاب/);await check('read-letter');
  await load('ch5','g_note',{hoda_died:true},{cast:[]});assert.match(await body(),/تقولي لها/);await check('pronoun');
  for(const relation of ['warm','closed']){
   await load('ch5','g_relation',{hoda_died:true,relationship_before_illness:relation},{cast:['mother','naima']});await next();
   assert.equal((await page.$$eval('[data-choice]',els=>els.map(e=>e.innerText))).some(t=>t.includes('كنت بصدّها')),false);
   await page.click('[data-choice="0"]');assert.doesNotMatch(await body(),/معاها/);await next();assert.match(await body(),/الاسم على القماش.*هي اللي عملته/s);await check(`mother-${relation}`);
  }
  await load('ch5','g_account',{hoda_died:true,memory_refused:true,relationship_before_illness:'closed'},{cast:['mother','naima']});
  await page.$$eval('[data-choice]',els=>els.find(e=>e.innerText.includes('كنت بصدّها')).click());assert.equal(await node(),'g_account_fault');await check('mother-admission');
  await load('ch5','final_handover',{hoda_died:true,belongings_delivery:'mother'},{cast:['mother','naima']});
  assert(await page.$(handle));await page.click('[data-choice="0"]');assert.equal(await node(),'final_bag');await next();assert.equal(await node(),'g_after');assert.equal(await page.$(handle),null);assert.equal(await page.$('[data-adult]'),null);await check('handover');
  await load('ch5','final_send_note',{hoda_died:true,belongings_delivery:'messenger'},{cast:['naima']});
  assert(await page.$(handle));await page.click('[data-choice="1"]');assert.match(await body(),/كتبتي عنوانك/);assert.equal(await page.$('[data-adult]'),null);await check('messenger');
  await load('ch2','c2_day2_home',{c2_plan:'home'},{day:2,cast:[]});assert.equal(await node(),'c2_day2_stay');assert.match(await body(),/هدى بتلعب/);await next();assert.equal(await node(),'c2_day2_hub');await check('stay-home-save');
  await load('ch2','c2_close',{c2_plan:'home'},{day:2,slot:4});assert.match(await page.$eval('[data-testid="clock"]',e=>e.textContent),/بالليل/);assert.equal(await page.$('[data-stage] .rays'),null);await check('night-light');
  await load('ch1','c1_m1',{bag_on_closet:true,bag_peeked:true},{day:2,scene:'morning'});assert(await page.$(handle));await check('morning-bag');
  await load('ch3','c3_night',{bag_on_closet:true},{slot:4,cast:[]});assert.match(await page.$eval('[data-testid="clock"]',e=>e.textContent),/10\/11.*بالليل/);
  await next();assert.equal(await node(),'c3_day2');assert.match(await page.$eval('[data-testid="clock"]',e=>e.textContent),/11\/11.*الصبح/);await check('night-to-morning');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log(`${checks} editorial UI checks passed; mobile and desktop.`);
}finally{await browser.close();}
