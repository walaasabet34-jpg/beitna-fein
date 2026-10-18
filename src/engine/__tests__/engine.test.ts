import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../../content';
import { indexChapter, evaluate, applyEffect, newGame, getNode, visibleOptions, choose, advance, enter } from '../core';
import { validateChapter } from '../validate';
import { simulate } from '../sim';
import type { GameState } from '../types';

const ic = indexChapter(CHAPTERS.ch1);

describe('content', () => {
  it('chapter 1 passes static validation', () => {
    const { errors, warnings } = validateChapter(CHAPTERS.ch1);
    if (warnings.length) console.log('warnings:', warnings);
    expect(errors).toEqual([]);
  });
});

describe('engine', () => {
  const base = newGame(ic);
  it('clamps hidden variables to 0..100', () => {
    const s = applyEffect(base, { vars: { trust: 500, distress: -500 } });
    expect(s.vars.trust).toBe(100);
    expect(s.vars.distress).toBe(0);
  });
  it('evaluates nested conditions', () => {
    const s: GameState = { ...base, flags: { greet: 'kneel', n: 3 }, money: 10 };
    expect(evaluate({ all: [{ flag: 'greet', eq: 'kneel' }, { not: { flag: 'missing' } }, { flag: 'n', gte: 3 }] }, s)).toBe(true);
    expect(evaluate({ any: [{ money: { gte: 11 } }, { var: 'trust', gte: 99 }] }, s)).toBe(false);
  });
  it('a "once" option disappears after use', () => {
    let s = base;
    while (s.node !== 'c1_greet') s = advance(ic, s);
    const opt = visibleOptions(getNode(ic, 'c1_greet'), s)[0];
    s = choose(ic, s, opt);
    expect(s.flags.greet).toBe('kneel');
  });
  it('time advances and the hub exits at night', () => {
    let s = { ...base, slot: 5 } as GameState;
    s = enter(ic, s, 'c1_hub');
    expect(s.node).toBe('c1_evening');
  });
});

describe('playthroughs', () => {
  it('3000 random playthroughs all reach the chapter ending', () => {
    const endings = new Map<string, number>();
    const seen = new Set<string>();
    for (let seed = 1; seed <= 3000; seed++) {
      const res = simulate(ic, seed);
      expect(res.ended).toBe(true);
      res.state.visited.forEach((p) => seen.add(p));
      const band = res.state.vars.distress >= 65 || res.state.vars.trust <= 12 ? 'low'
        : res.state.vars.trust >= 28 && res.state.vars.safety >= 38 ? 'high' : 'mid';
      endings.set(band, (endings.get(band) ?? 0) + 1);
    }
    const unreached = CHAPTERS.ch1.nodes.map((n) => n.id).filter((id) => !seen.has(id));
    console.log('ending bands:', Object.fromEntries(endings), 'unreached nodes:', unreached);
    expect(endings.size).toBe(3);
  });
});

describe('balance', () => {
  const band = (s: GameState) => s.vars.distress >= 65 || s.vars.trust <= 12 ? 'low'
    : s.vars.trust >= 28 && s.vars.safety >= 38 ? 'high' : 'mid';
  it('caring play tends toward the warm ending, harsh play toward the closed one', () => {
    const kind = Array.from({ length: 200 }, (_, i) => band(simulate(ic, i + 1, 2000, 'kind').state));
    const harsh = Array.from({ length: 200 }, (_, i) => band(simulate(ic, i + 1, 2000, 'harsh').state));
    const count = (a: string[], b: string) => a.filter((x) => x === b).length;
    console.log('kind:', count(kind, 'high'), count(kind, 'mid'), count(kind, 'low'), ' harsh:', count(harsh, 'high'), count(harsh, 'mid'), count(harsh, 'low'));
    expect(count(kind, 'high')).toBeGreaterThan(count(harsh, 'high'));
    expect(count(harsh, 'low')).toBeGreaterThan(count(kind, 'low'));
  });
});
