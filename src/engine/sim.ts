// Headless random playthrough – used by tests to prove the chapter can always be finished.
import type { ActivityNode, BedParams, GameState, KitchenParams } from './types';
import {
  IndexedChapter, newGame, getNode, advance, visibleOptions, choose, visibleHotspots, useHotspot,
  resolveKitchen, resolveBed, kitchenValid,
} from './core';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

type Policy = 'random' | 'kind' | 'harsh';
const BAD_FLAGS = ['bag_peeked', 'lied_bag', 'bag_forced'];
const score = (e?: { vars?: Partial<Record<string, number>>; flags?: Record<string, unknown> }) =>
  (e?.vars?.trust ?? 0) + (e?.vars?.safety ?? 0) + (e?.vars?.openness ?? 0) - (e?.vars?.distress ?? 0)
  - (Object.keys(e?.flags ?? {}).some((f) => BAD_FLAGS.includes(f)) ? 8 : 0);

export function simulate(ic: IndexedChapter, seed: number, maxSteps = 2000, policy: Policy = 'random') {
  const r = rng(seed);
  const pick = <T extends { effects?: any },>(a: T[]): T => {
    if (policy === 'random') return a[Math.floor(r() * a.length)];
    const sorted = [...a].sort((x, y) => score(y.effects) - score(x.effects) || r() - 0.5);
    return policy === 'kind' ? sorted[0] : sorted[sorted.length - 1];
  };
  let s: GameState = newGame(ic);
  const path: string[] = [s.node];
  for (let i = 0; i < maxSteps; i++) {
    const n = getNode(ic, s.node);
    if (n.type === 'end') return { state: s, path, steps: i, ended: true };
    if (n.type === 'line' || n.type === 'card') s = advance(ic, s);
    else if (n.type === 'choice') {
      const opts = visibleOptions(n, s);
      if (!opts.length) throw new Error(`Dead end at choice ${n.id}`);
      s = choose(ic, s, pick(opts));
    } else if (n.type === 'hub') {
      const hs = visibleHotspots(n, s);
      if (!hs.length) throw new Error(`Dead end at hub ${n.id}`);
      const essential = policy === 'kind' ? hs.find((h) => h.id === 'cook' || h.id === 'bed') : undefined;
      s = useHotspot(ic, s, n, essential ?? hs[Math.floor(r() * hs.length)]);
    } else if (n.type === 'activity') {
      s = runActivity(ic, s, n, r);
    }
    path.push(s.node);
  }
  throw new Error(`No ending after ${maxSteps} steps (seed ${seed}); stuck near ${s.node}`);
}

function runActivity(ic: IndexedChapter, s: GameState, n: ActivityNode, r: () => number): GameState {
  if (n.activity === 'kitchen') {
    const p = n.params as KitchenParams;
    for (let tries = 0; tries < 50; tries++) {
      const k = 1 + Math.floor(r() * p.maxPicks);
      const picks = [...p.items].sort(() => r() - 0.5).slice(0, k).map((i) => i.id);
      if (kitchenValid(p, s, picks)) return resolveKitchen(ic, s, picks);
    }
    return resolveKitchen(ic, s, [p.items.find((i) => i.price === 0)!.id]);
  }
  const p = n.params as BedParams;
  const picks: Record<string, string> = {};
  for (const g of p.groups) picks[g.id] = g.options[Math.floor(r() * g.options.length)].id;
  return resolveBed(ic, s, picks);
}
