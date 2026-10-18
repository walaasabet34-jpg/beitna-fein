import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../../content';
import { indexChapter, continueToChapter } from '../core';
import { validateChapter } from '../validate';
import { simulate } from '../sim';
import { migrateSave } from '../migrate';
import type { GameState } from '../types';

const ic1 = indexChapter(CHAPTERS.ch1);
const ic2 = indexChapter(CHAPTERS.ch2);
const band = (s: GameState) => (s.vars.distress >= 65 || s.vars.trust <= 14 ? 'closed' : s.vars.trust >= 34 && s.vars.safety >= 42 ? 'warm' : 'middle');

describe('chapter 2', () => {
  it('validates, given everything chapter 1 can set', () => {
    const v1 = validateChapter(CHAPTERS.ch1);
    const v2 = validateChapter(CHAPTERS.ch2, v1.setFlags);
    if (v2.warnings.length) console.log('ch2 warnings', v2.warnings);
    expect(v2.errors).toEqual([]);
  });

  it('2,000 random Ch1 → Ch2 playthroughs all finish; every Ch2 node is reachable', () => {
    const seen = new Set<string>(); const ends: Record<string, number> = {};
    for (let seed = 1; seed <= 2000; seed++) {
      const r1 = simulate(ic1, seed);
      const s2 = continueToChapter(ic2, r1.state);
      const DAILY = ['cooked', 'used_basket', 'meal_score', 'bed_done'];   // per-day housekeeping, reset on purpose
      for (const [k, v] of Object.entries(r1.state.flags)) if (!DAILY.includes(k) && !k.startsWith('ev:') && !k.startsWith('used:') && !k.startsWith('once:')) expect(s2.flags[k]).toEqual(v);
      expect(s2.completed).toEqual(['ch1']);
      const r2 = simulate(ic2, seed * 7, 3000, 'random', s2);
      expect(r2.ended).toBe(true);
      r2.state.visited.forEach((n) => seen.add(n));
      ends[band(r2.state)] = (ends[band(r2.state)] ?? 0) + 1;
    }
    const unreached = CHAPTERS.ch2.nodes.map((n) => n.id).filter((id) => !seen.has(id));
    console.log('ch2 endings:', ends, 'unreached:', unreached);
    expect(unreached).toEqual([]);
    expect(Object.keys(ends).length).toBe(3);
  });

  it('caring vs harsh play diverges across both chapters', () => {
    const run = (p: 'kind' | 'harsh') => Array.from({ length: 150 }, (_, i) => {
      const a = simulate(ic1, i + 1, 2000, p);
      return band(simulate(ic2, i + 1, 3000, p, continueToChapter(ic2, a.state)).state);
    });
    const k = run('kind'), h = run('harsh');
    const c = (a: string[], x: string) => a.filter((y) => y === x).length;
    console.log('kind', c(k, 'warm'), c(k, 'middle'), c(k, 'closed'), '| harsh', c(h, 'warm'), c(h, 'middle'), c(h, 'closed'));
    expect(c(k, 'warm')).toBeGreaterThan(c(h, 'warm'));
    expect(c(h, 'closed')).toBeGreaterThan(c(k, 'closed'));
  });
});

describe('save migration', () => {
  it('upgrades a v1 save from the deployed build', () => {
    const v1 = { version: 1, chapter: 'ch1', node: 'c1_hub', scene: 'living', day: 1, slot: 2, money: 30, vars: { trust: 20, safety: 20, openness: 10, autonomy: 50, distress: 50 }, flags: { greet: 'kneel' }, likes: [], dislikes: [], visited: [] };
    const m = migrateSave(v1)!;
    expect(m.version).toBe(2); expect(m.completed).toEqual([]); expect(m.flags.greet).toBe('kneel'); expect(m.slot).toBe(2);
  });
  it('maps the old 6-period night (5) onto the new night (4)', () => {
    expect(migrateSave({ version: 1, chapter: 'ch1', node: 'c1_evening', vars: {}, slot: 5 })!.slot).toBe(4);
  });
  it('rejects garbage and saves from a newer build', () => {
    expect(migrateSave(null)).toBeNull(); expect(migrateSave({ version: 99, node: 'x', vars: {}, chapter: 'ch1' })).toBeNull();
  });
});
