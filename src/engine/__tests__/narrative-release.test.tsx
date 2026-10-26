import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTERS } from '../../content';
import { advance, choose, getNode, indexChapter, newGame, enter, resolveLine } from '../core';
import { HospitalScene, LivingRoom, LandingScene } from '../../art/scenes';
import { migrateSave } from '../migrate';
const c1 = indexChapter(CHAPTERS.ch1), c3 = indexChapter(CHAPTERS.ch3), c4 = indexChapter(CHAPTERS.ch4), c5 = indexChapter(CHAPTERS.ch5);
it('opens with an action (catching her ball) within 40 words, before any explanation', () => {
 let s = newGame(c1), words = 0;
 for (let i=0;i<10;i++) {
  const n=getNode(c1,s.node);
  if(n.type==='choice' || n.type==='activity') break;
  if(n.type==='line') words+=n.text.split(/\s+/).length;
  s=advance(c1,s);
 }
 const first=getNode(c1,s.node);
 expect(first.type).toBe('activity'); expect(first.id).toBe('ball_stairs'); expect(words).toBeLessThan(40);
 expect(renderToStaticMarkup(<svg><LandingScene s={s} expr="neutral" /></svg>)).toContain('data-landing');
});
it('shows the patient while alive, and the mother at the meeting', () => {
 const sick=enter(c4,newGame(c4),'s_bedside');
 expect(renderToStaticMarkup(<svg><HospitalScene s={sick} /></svg>)).toContain('data-patient');
 const dead=enter(c4,sick,'s_decline');
 expect(renderToStaticMarkup(<svg><HospitalScene s={dead} /></svg>)).not.toContain('data-patient');
 const mother=enter(c5,newGame(c5),'g_arrival');
 expect(renderToStaticMarkup(<svg><LivingRoom s={mother} expr="neutral" /></svg>)).toContain('data-adult');
});
it('makes the actual mother reply and urgent contact part of the visible story', () => {
 expect(enter(c3,newGame(c3),'c3_a4').flags.mother_contacted).toBe(true);
 const s=newGame(c4);
 expect(enter(c4,s,'s_urgent').flags.mother_urgent_message).toBe(true);
 expect(enter(c4,s,'s_breath').day).toBe(5);
 expect(enter(c4,s,'s_urgent').flags.mother_telegram).toBe(true);
});
it('only offers the doll if it was made; the thimble is a separate choice', () => {
 const n=getNode(c4,'s_bag');if(n.type!=='choice')throw new Error();
 expect(n.options.find(o=>o.goto==='s_doll')?.if).toEqual({flag:'made_doll'});
 expect(n.options.find(o=>o.goto==='s_thimble')).toBeTruthy();
});
it('uses neutral day labels and migrates main-only final chapter saves', () => {
 for(const c of Object.values(CHAPTERS))for(const label of c.dayNames.slice(1))expect(label).not.toMatch(/الحصبة|المستشفى|الأم|الرجوع/);
 const old={...newGame(c4),node:'c4_start'};
 expect(migrateSave(old)?.node).toBe('s_start');
});

it('removes Naima from the stage after the handover', () => {
 const s=enter(c1,newGame(c1),'c1_d13');
 expect(s.cast).toEqual(['hoda']);
 expect(renderToStaticMarkup(<svg><LivingRoom s={s} expr="neutral" /></svg>)).not.toContain('data-adult');
});
