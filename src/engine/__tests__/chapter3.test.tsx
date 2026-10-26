import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTERS } from '../../content';
import { LivingRoom, livingTargets } from '../../art/scenes';
import { ambienceFor } from '../../audio/sceneAudio';
import { advance, choose, continueToChapter, enter, getNode, hodaSpot, indexChapter, newGame, visibleOptions } from '../core';
import { simulate } from '../sim';
import { validateChapter } from '../validate';
import type { GameState } from '../types';

const [c1, c2, c3] = ['ch1', 'ch2', 'ch3'].map(id => indexChapter(CHAPTERS[id]));
const art = (s: GameState) => renderToStaticMarkup(<svg><LivingRoom s={s} expr="neutral" /></svg>);
const suitcaseHandle = 'M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6';

describe('chapter 3 continuity', () => {
  it('preserves the actual wardrobe choice and its consequences through all three chapters', () => {
    const before = enter(c1, newGame(c1), 'c1_b_force_c');
    const option = visibleOptions(getNode(c1, before.node), before).find(o => o.effects?.flags?.bag_on_closet)!;
    const chosen = choose(c1, before, option);
    expect(chosen.flags.bag_on_closet).toBe(true);
    expect(chosen.vars.distress).toBe(before.vars.distress + 4);
    expect(chosen.vars.autonomy).toBe(before.vars.autonomy - 3);
    expect(hodaSpot(chosen)).toBe('underCloset');
    expect(art(chosen)).toContain('translate(556 92)');
    const end1 = simulate(c1, 19, 3000, 'random', chosen).state;
    const start2 = continueToChapter(c2, end1);
    expect(start2.flags.bag_on_closet).toBe(true);
    expect(hodaSpot(start2)).not.toBe('underCloset');
    const end2 = simulate(c2, 19, 3000, 'random', start2).state;
    const start3 = continueToChapter(c3, end2);
    expect(start3.flags).toMatchObject(end2.flags);
    expect(start3.vars).toEqual(end2.vars);
    expect(start3.completed).toEqual(['ch1', 'ch2']);
    for (const safety of [10, 30, 45]) {
      for (const id of ['c3_bag1', 'c3_bag_open', 'c3_bag_home', 'c3_bag_fear']) {
        const state = enter(c3, { ...start3, vars: { ...start3.vars, safety } }, id);
        expect(hodaSpot(state)).not.toBe('underCloset');
        expect(art(state)).toContain(suitcaseHandle);
        expect(livingTargets(state).suitcase[1]).toBeGreaterThan(500);
      }
    }
  });

  it('shows evening, then night on day 1, and advances to day 2 only with the morning text', () => {
    let s = enter(c3, newGame(c3), 'c3_bag1');
    expect([s.day, s.slot]).toEqual([1, 3]);
    for (const id of ['c3_answer_honest', 'c3_answer_soft', 'c3_answer_avoid']) {
      s = advance(c3, enter(c3, s, id));
      expect(s.node).toBe('c3_night');
      expect([s.day, s.slot]).toEqual([1, 4]);
      expect(ambienceFor(s)).toBe('amb_night');
      expect(art(s)).toContain('url(#lampGlow)');
      expect(art(s)).not.toContain('class="rays"');
      const morning = advance(c3, s);
      expect(morning.node).toBe('c3_day2');
      expect([morning.day, morning.slot]).toEqual([2, 0]);
      expect(morning.scene).toBe('door');
      expect(morning.music).toBeNull();
      expect(ambienceFor(morning)).toBe('amb_stair');
      const home = enter(c3, morning, 'c3_return');
      expect(art(home)).toContain('class="rays"');
      expect(art(home)).not.toContain('url(#lampGlow)');
      expect(ambienceFor(home)).toBe('amb_day');
    }
  });

  it('validates chapter 3 against flags from every earlier chapter in play order', () => {
    const v1 = validateChapter(CHAPTERS.ch1);
    const vw = validateChapter(CHAPTERS.chwar, v1.setFlags);
    const v2 = validateChapter(CHAPTERS.ch2, vw.setFlags);
    expect(validateChapter(CHAPTERS.ch3, new Set([...v1.setFlags, ...vw.setFlags, ...v2.setFlags])).errors).toEqual([]);
  });

  it('finishes 2,000 three-chapter runs, reaches every chapter 3 node and all outcome branches', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 2000; seed++) {
      const a = simulate(c1, seed);
      const b = simulate(c2, seed * 7, 3000, 'random', continueToChapter(c2, a.state));
      const c = simulate(c3, seed * 13, 3000, 'random', continueToChapter(c3, b.state));
      expect(c.ended).toBe(true);
      c.path.forEach(id => seen.add(id));
      c.state.visited.forEach(id => seen.add(id));
    }
    expect(CHAPTERS.ch3.nodes.map(n => n.id).filter(id => !seen.has(id))).toEqual([]);
  });
});
