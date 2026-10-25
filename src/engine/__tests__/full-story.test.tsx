import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTERS, CHAPTER_ORDER } from '../../content';
import { LivingRoom } from '../../art/scenes';
import { indexChapter, newGame, continueToChapter, enter, getNode, advance, choose, resolveLine } from '../core';
import { simulate } from '../sim';
import { validateChapter } from '../validate';
import { gameDate } from '../calendar';
import { migrateSave } from '../migrate';
import type { GameState } from '../types';
const indexed = Object.fromEntries(CHAPTER_ORDER.map(id => [id, indexChapter(CHAPTERS[id])]));
const c4 = indexed.ch4, c5 = indexed.ch5;
const option = (s: GameState, index: number) => {
  const n = getNode(c5, s.node);
  if (n.type !== 'choice') throw new Error('Expected choice');
  return choose(c5, s, n.options[index]);
};

describe('complete story', () => {
  it('validates every chapter and every explicit continuation in play order', () => {
    let inherited = new Set<string>();
    for (const [i, id] of CHAPTER_ORDER.entries()) {
      const c = CHAPTERS[id];
      const result = validateChapter(c, inherited);
      expect(result.errors, id).toEqual([]);
      inherited = result.setFlags;
      for (const n of c.nodes) if (n.type === 'end') expect(n.nextChapter).toBe(CHAPTER_ORDER[i + 1]);
    }
  });

  it('starts before October 6, orders all chapter dates, and dates every war beat', () => {
    expect(gameDate(CHAPTERS.ch1, 1)).toBe('1973-10-04');
    let last = '';
    for (const id of CHAPTER_ORDER) for (const date of Object.values(CHAPTERS[id].calendar!)) {
      expect(date >= last, `${id}: ${date} after ${last}`).toBe(true);
      last = date;
    }
    const war = indexed.chwar;
    for (const [id, date, slot] of [['w_afternoon', '1973-10-06', 2], ['w_oct7', '1973-10-07', 0], ['w_oct16', '1973-10-16', 3], ['w_oct22', '1973-10-22', 3], ['w_oct25', '1973-10-25', 3]] as const) {
      const s = enter(war, newGame(war), id);
      expect(gameDate(war.chapter, s.day)).toBe(date);
      expect(s.slot).toBe(slot);
    }
    // History narration is authored text, never an invented archival recording.
    expect(war.chapter.nodes.some(n => n.broadcast)).toBe(false);
  });

  it('finishes 2,000 six-chapter playthroughs with monotonic time, reaches every new node and final outcome', () => {
    const seen = new Set<string>();
    const finals = new Set<string>();
    for (let seed = 1; seed <= 2000; seed++) {
      let state: GameState | undefined;
      let lastTime = '';
      for (const id of CHAPTER_ORDER) {
        const ic = indexed[id];
        const start: GameState = state ? continueToChapter(ic, state) : newGame(ic);
        const observe = (s: GameState) => {
          const t = `${gameDate(ic.chapter, s.day)}-${s.slot}`;
          expect(t >= lastTime, `${seed}/${s.node}: ${t} after ${lastTime}`).toBe(true);
          lastTime = t;
          if (id === 'ch5') {
            expect(s.flags.hoda_died).toBe(true);
            expect(s.cast ?? []).not.toContain('hoda');
          }
        };
        observe(start);
        const run = simulate(ic, seed * (CHAPTER_ORDER.indexOf(id) + 1), 3000, 'random', start, observe);
        expect(run.ended).toBe(true);
        run.state.visited.forEach(n => seen.add(n));
        state = run.state;
      }
      finals.add(state!.node);
    }
    for (const id of ['chwar', 'ch4', 'ch5']) expect(CHAPTERS[id].nodes.map(n => n.id).filter(id => !seen.has(id)), id).toEqual([]);
    expect([...finals].sort()).toEqual(['g_end_hold', 'g_end_met', 'g_end_sent']);
  });

  it('never gates medical care or death on money, kindness or bedside choices', () => {
    for (const policy of ['kind', 'harsh'] as const) for (const money of [0, 100]) {
      const run = simulate(c4, 42, 3000, policy, newGame(c4, { money }));
      expect(run.state.flags.hoda_died).toBe(true);
      for (const id of ['s_doctor', 's_rash', 's_breath', 's_decline']) expect(run.path).toContain(id);
      expect(run.state.cast).toEqual([]);
      expect(gameDate(c4.chapter, run.state.day)).toBe('1973-11-30');
    }
  });

  it('keeps the pre-illness relationship and the crossing memory, regardless of later politeness', () => {
    const start = newGame(c4, { vars: { trust: 0, safety: 5, openness: 0, autonomy: 50, distress: 90 }, flags: { war_shared_joy: true } });
    const sick = simulate(c4, 3, 3000, 'kind', start).state;
    expect(sick.flags.relationship_before_illness).toBe('closed');
    let grief = continueToChapter(c5, sick);
    const memory = getNode(c5, 'g_war_memory');
    if (memory.type !== 'line') throw new Error();
    expect(resolveLine(memory, grief).text).toContain('كفها');
    grief = enter(c5, grief, 'g_relation');
    const relation = getNode(c5, grief.node);
    if (relation.type !== 'line') throw new Error();
    expect(resolveLine(relation, grief).text).toContain('أمها فضلت مستنية');
  });

  it('supports immediate/deferred meeting, messenger, refusal and reconsideration without withholding the death news', () => {
    const seed = newGame(c5, { flags: { hoda_died: true } });
    for (const pick of [0, 1, 2]) {
      const s = option(enter(c5, seed, 'g_meet'), pick);
      const r = simulate(c5, 2, 3000, 'kind', s);
      expect(r.state.node).toBe(pick === 2 ? 'g_end_sent' : 'g_end_met');
      expect(r.state.flags.belongings_delivery).toBe(pick === 2 ? 'messenger' : 'mother');
      const svg = renderToStaticMarkup(<svg><LivingRoom s={r.state} expr="neutral" /></svg>);
      expect(svg).not.toContain('M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6');
    }
    const refusal = advance(c5, option(enter(c5, seed, 'g_meet'), 3));
    expect(refusal.node).toBe('g_hold');
    for (const pick of [0, 1, 2]) {
      const r = simulate(c5, 5, 3000, 'kind', option(refusal, pick));
      expect(r.state.node).toBe(['g_end_sent', 'g_end_met', 'g_end_hold'][pick]);
    }
    expect(indexed.ch5.nextOf.get('g_news')).toBe('g_meet');
    const newsIndex = CHAPTERS.ch5.nodes.findIndex(n => n.id === 'g_news');
    expect(CHAPTERS.ch5.nodes[newsIndex + 1].id).toBe('g_meet');
  });

  it('loads previous save node IDs and lets an existing Chapter 3 ending continue to the new chapters', () => {
    const save = newGame(indexed.ch3);
    expect(migrateSave(save)?.node).toBe(save.node);
    expect(CHAPTERS.ch3.nodes.find(n => n.id === 'c3_end')).toMatchObject({ nextChapter: 'ch4' });
    expect(getNode(indexed.ch1, 'c1_end')).toMatchObject({ nextChapter: 'chwar' });
  });
});
