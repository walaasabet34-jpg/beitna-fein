import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTERS, CHAPTER_ORDER } from '../../content';
import { LivingRoom, NightScene } from '../../art/scenes';
import { advance, choose, continueToChapter, enter, evaluate, getNode, hodaSpot, indexChapter, newGame, resolveLine, visibleOptions } from '../core';
import { simulate } from '../sim';
import { migrateSave } from '../migrate';
import type { GameState } from '../types';
const [c1, war, c2, c3, c4, c5] = CHAPTER_ORDER.map(id => indexChapter(CHAPTERS[id]));
const line = (ic: typeof c1, s: GameState) => {
 const n = getNode(ic, s.node); if(n.type !== 'line') throw new Error(s.node);
 return resolveLine(n,s).text;
};
const pick = (ic: typeof c1, s: GameState, goto: string) => {
 const option = visibleOptions(getNode(ic,s.node),s).find(o=>o.goto===goto);
 if(!option) throw new Error(`Unavailable ${goto} at ${s.node}`);
 return choose(ic,s,option);
};
const memories = (ic: typeof c1, s: GameState) => {
 const n=getNode(ic,s.node);if(n.type!=='end')throw new Error();
 return n.memories?.filter(m=>evaluate(m.if,s)).map(m=>m.text).join('\n')??'';
};
const art = (s: GameState) => renderToStaticMarkup(<svg><LivingRoom s={s} expr="neutral" morning={s.scene==='morning'}/></svg>);
const handle = 'M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6';
describe('editorial continuity',()=>{
 it('uses Hoda’s approved address in nested content and stored text, preserving reported خالتك',()=>{
  const utterances: string[]=[];
  for(const c of Object.values(CHAPTERS))for(const n of c.nodes){
   if(n.type==='line'){
    if(n.speaker==='hoda')utterances.push(n.text);
    for(const v of n.variants??[])if((v.speaker??n.speaker)==='hoda')utterances.push(v.text);
   }
   // These flag values are Hoda's own written homework, later rendered in the notebook.
   const homework=n.effects?.flags?.c2_fam_line;if(typeof homework==='string')utterances.push(homework);
  }
  for(const t of utterances)expect(t).not.toMatch(/خالتو|خالتى/);
  expect(line(c1,enter(c1,newGame(c1),'c1_m_cost_stale'))).toContain('يا خالتي');
  expect(line(c1,enter(c1,newGame(c1),'c1_d8'))).toContain('خالتك فاطمة');
  expect(line(c2,enter(c2,newGame(c2),'c2_o_fam_both'))).toContain('خالتك فاطمة');
  expect(JSON.stringify(getNode(c1,'c1_greet'))).toContain('أنا فاطمة وبس');
 });
 it('takes the rejected lead into both honest choices without claiming the mother was located',()=>{
  let s=enter(c3,newGame(c3),'c3_naima');expect(line(c3,s)).toContain('ناس تانية');
  s=advance(c3,s);s=pick(c3,s,'c3_check_careful');s=advance(c3,s);s=advance(c3,s);
  expect(s.node).toBe('c3_final_choice');
  const opts=visibleOptions(getNode(c3,s.node),s);
  expect(opts.slice(0,2).map(o=>o.text).join(' ')).not.toContain('لسه ما عرفناش');
  expect(opts[0].text).toContain('طلعت ست تانية');expect(opts[0].text).toContain('لسه بندوّر');
  for(const goto of ['c3_final_clear','c3_final_hope'])expect(line(c3,pick(c3,s,goto))).not.toContain('ممكن تكون');
 });
 it('offers apology only after an actual needle refusal, never merely stopping the buttons',()=>{
  for(const flags of [{},{buttons_stopped:true},{buttons_together:true},{memory_stitch:true},{memory_refused:true}]){
   const s=enter(c4,newGame(c4,{flags}),'s_reply');
   const apology=visibleOptions(getNode(c4,s.node),s).find(o=>o.goto==='s_reply_sorry');
   expect(!!apology).toBe(!!('memory_refused' in flags));
   if(apology)expect(apology.text).toContain('سيبي الإبرة');
  }
  for(const goto of ['bond_retry','bond_count','bond_stop']) {
   const buttons=pick(c1,enter(c1,newGame(c1),'bond_buttons_pick'),goto);
   const sick=enter(c4,continueToChapter(c4,buttons),'s_reply');
   expect(visibleOptions(getNode(c4,sick.node),sick).some(o=>o.goto==='s_reply_sorry')).toBe(false);
  }
  let s=pick(c4,enter(c4,newGame(c4),'s_stitch'),'s_refuse');
  s=enter(c4,s,'s_reply');expect(pick(c4,s,'s_reply_sorry').flags.last_apology).toBe(true);
 });
 it('only admits a specific pattern of rejection when a rejecting choice occurred',()=>{
  for(const flags of [{},{relationship_before_illness:'closed'},{war_snap:true},{memory_refused:true}]){
   const s=enter(c5,newGame(c5,{flags}),'g_account');
   expect(visibleOptions(getNode(c5,s.node),s).some(o=>o.goto==='g_account_fault')).toBe('war_snap' in flags||'memory_refused' in flags);
  }
  for(const helped of [false,true]){
   const s=enter(c5,newGame(c5,{flags:{war_comb:helped}}),'g_account_true');
   expect(line(c5,s).includes('معاها')).toBe(helped);
  }
 });
 it('remembers repairing the dismissive answer separately from refusing to listen',()=>{
  let s=enter(c2,newGame(c2,{flags:{c2_answer:'hush'}}),'c2_hush_c');
  const repaired=pick(c2,s,'c2_hush_repair'), closed=pick(c2,s,'c2_hush_close');
  expect(memories(c2,enter(c2,repaired,'c2_end'))).not.toContain('تنسى');
  expect(memories(c2,enter(c2,closed,'c2_end'))).toContain('تنسى');
 });
 it('does not promise untouched belongings after closing the latch',()=>{
  const s=newGame(c1,{flags:{bag_promise:true,bag_latched:true}});
  const text=memories(c1,enter(c1,s,'c1_end'));
  expect(text).toContain('ماوفيتيش');expect(text).not.toContain('ووفيتي');
 });
 it('keeps Hoda home all day, including after Naima, without a school return or marked homework',()=>{
  let s=enter(c2,newGame(c2,{flags:{c2_hw_done:true,c2_fam:'both'}}),'c2_plan');
  s=pick(c2,s,'c2_home_day');s=advance(c2,s);
  expect(s.node).toBe('c2_day2_stay');expect(s.cast).toEqual(['hoda']);
  s=advance(c2,s);expect(s.node).toBe('c2_day2_hub');expect(s.cast).toEqual(['hoda']);
  const back=advance(c2,enter(c2,s,'c2_naima_day2b'));expect(back.cast).toEqual(['hoda']);
  const run=simulate(c2,17,3000,'random',s);expect(run.ended).toBe(true);
  expect(run.path).not.toContain('c2_o_fam_both');expect(run.path).not.toContain('c2_o_fam');expect(run.path).not.toContain('c2_o_nohw');
  const afternoon=enter(c2,run.state,'c2_out');expect(line(c2,afternoon)).not.toContain('رجعت');
  const away=advance(c2,enter(c2,newGame(c2,{flags:{c2_plan:'teacher'}}),'c2_teacher_end'));
  expect(away.node).toBe('c2_day2_empty');expect(away.cast).toEqual([]);
 });
 it('shows night lighting on day two closing, and a visible suitcase after the old closet choice',()=>{
  const close=enter(c2,newGame(c2,{day:2,slot:2}),'c2_close');expect(close.slot).toBe(4);expect(art(close)).not.toContain('class="rays"');
  let s=enter(c1,newGame(c1,{flags:{bag_on_closet:true}}),'c1_night1');expect(line(c1,s)).toContain('نزّلتي');
  s=advance(c1,s);expect(s.flags.bag_returned).toBe(true);expect(hodaSpot(s)).not.toBe('underCloset');
  s=enter(c1,s,'c1_m1');expect(art(s)).toContain(handle);
  s=continueToChapter(c3,continueToChapter(c2,continueToChapter(war,s)));
  expect(s.flags.bag_on_closet).toBe(true);expect(art(enter(c3,s,'c3_bag1'))).toContain(handle);
 });
 it('never leaves an old peek flag opening the suitcase on a later sleeping scene',()=>{
  const s=enter(c2,newGame(c2,{flags:{bag_peeked:true,bed_place:'sewing_room',bed_bag:'pillow'}}),'c2_sleep');
  const svg=renderToStaticMarkup(<svg><NightScene s={s} expr="sleepy"/></svg>);
  expect(svg).toContain('fill="#b08d4a"');expect(svg).not.toContain('fill="#8f7339"');
 });
 it('frames the letter reader and removes the cat from the current-house assumption',()=>{
  const s=enter(c4,newGame(c4),'mother_reply');expect(line(c4,s)).toContain('قريتي لهدى');expect(line(c4,s)).not.toContain('فوق الدولاب');
  for(const id of ['mother_write','mother_dictate','mother_postpone'])expect(line(c4,enter(c4,s,id))).toContain('نعيمة');
 });
 it('makes the mother’s question refer to a shown name on the fabric',()=>{
  for(const flags of [{},{memory_stitch:true},{memory_refused:true}]){
   const s=enter(c5,newGame(c5,{flags}),'g_mother_seam');const t=line(c5,s);
   expect(t.indexOf('الاسم على القماش')).toBeLessThan(t.indexOf('هي اللي عملته'));
  }
 });
 it('records delivery only after handing over the bag in both final actions',()=>{
  for(const goto of ['final_bag','final_letter']){
   let s=enter(c5,newGame(c5,{flags:{hoda_died:true,letter_to_mother:true}}),'g_handover');
   expect(s.flags.belongings_delivery).toBeUndefined();expect(art(s)).toContain(handle);
   s=advance(c5,s);expect(s.node).toBe('final_handover');expect(art(s)).toContain(handle);
   s=pick(c5,s,goto);expect(s.flags.belongings_delivery).toBe('mother');
   expect(art(advance(c5,s))).not.toContain(handle);
  }
  for(const goto of ['final_invite','final_send_letter']){
   let s=enter(c5,newGame(c5),'g_messenger');expect(s.cast).toContain('naima');expect(s.flags.belongings_delivery).toBeUndefined();
   s=pick(c5,advance(c5,s),goto);expect(s.flags.belongings_delivery).toBe('messenger');expect(s.cast).toEqual([]);
  }
 });
 it('migrates pending old handovers without losing memories or relationship',()=>{
  for(const node of ['g_handover','final_handover','g_messenger','final_send_note']){
   const old={...newGame(c5,{flags:{belongings_delivery:'mother',war_comb:true,relationship_before_illness:'closed'}}),node};
   const next=migrateSave(JSON.parse(JSON.stringify(old)))!;
   expect(next.node).toBe(node);expect(next.flags.belongings_delivery).toBeUndefined();expect(next.flags.war_comb).toBe(true);expect(next.flags.relationship_before_illness).toBe('closed');
   expect(old.flags.belongings_delivery).toBe('mother');expect(migrateSave(next)).toEqual(next);
  }
 });
 it('migrates the former line now used as an automatic staging branch',()=>{
  for(const home of [true,false]){
   const old={...newGame(c2,{flags:{c2_plan:home?'home':'teacher'},cast:[]}),node:'c2_day2_home'};
   const m=migrateSave(old)!;expect(m.node).toBe(home?'c2_day2_stay':'c2_day2_empty');expect(m.cast).toEqual(home?['hoda']:[]);
   expect(simulate(c2,9,3000,'random',m).ended).toBe(true);
  }
 });
});

it('keeps earlier bedtime placement and the later corridor-light promise visible',()=>{
 const s=enter(c1,newGame(c1,{flags:{bag_on_closet:true,bed_bag:'pillow'}}),'c1_bed_place');
 expect(s.flags.bag_on_closet).toBe(true);expect(s.flags.bag_returned).toBe(true);expect(art(s)).not.toContain('translate(556 92)');
 const lit=enter(c1,newGame(c1),'c1_m_dark_ok');expect(lit.flags.bed_light).toBe('on');
 const night=enter(c2,continueToChapter(c2,lit),'c2_night');
 expect(renderToStaticMarkup(<svg><NightScene s={night} expr="neutral"/></svg>)).toContain('M1200 0 L1120 0 L700 800 L1200 800Z');
});
it('normalizes old night, kept-home cast and repaired-answer saves idempotently',()=>{
 const original={...newGame(c2,{flags:{c2_plan:'home',light_tonight:true,bed_light:'off',c2_answer:'hush'},visited:['c2_hush_repair']}),node:'c2_day2_hub',cast:[]};
 const m=migrateSave(original)!;expect(m.cast).toEqual(['hoda']);expect(m.flags.bed_light).toBe('on');expect(m.flags.c2_hush_repaired).toBe(true);expect(migrateSave(m)).toEqual(m);
 const close=migrateSave({...original,node:'c2_close',slot:2})!;expect(close.slot).toBe(4);
 expect(memories(c2,enter(c2,m,'c2_end'))).not.toContain('تنسى');
});
