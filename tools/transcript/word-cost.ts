// Which lines cost the most reading, weighted by how often routes pass them (editing aid).
// Usage: npx vite-node tools/transcript/word-cost.ts -- [runs]
import { CHAPTERS, CHAPTER_ORDER } from '../../src/content';
import { indexChapter, newGame, continueToChapter, getNode, resolveLine } from '../../src/engine/core';
import { simulate } from '../../src/engine/sim';
import type { GameState } from '../../src/engine/types';
const runs = Number(process.argv[2] ?? 200);
const cost = new Map<string, { words: number; hits: number; text: string }>();
let total = 0, lines = 0, acts = 0, choices = 0;
for (let seed = 1; seed <= runs; seed++) {
  let s: GameState | undefined;
  for (const id of CHAPTER_ORDER) {
    const ic = indexChapter(CHAPTERS[id]);
    const start = s ? continueToChapter(ic, s) : newGame(ic);
    const seen = (st: GameState) => {
      const n = getNode(ic, st.node);
      if (n.type === 'activity') acts++; if (n.type === 'choice') choices++;
      if (n.type !== 'line') return; lines++;
      const t = (n.lead ? n.lead + ' ' : '') + resolveLine(n, st).text; const w = t.split(/\s+/).length; total += w;
      const k = `${id}/${n.id}`; const c = cost.get(k) ?? { words: 0, hits: 0, text: t }; c.words += w; c.hits++; cost.set(k, c);
    };
    seen(start);
    s = simulate(ic, seed * 5 + id.length, 3000, (['random', 'kind', 'harsh'] as const)[seed % 3], start, seen).state;
  }
}
console.log('average words per full route:', Math.round(total / runs), '| text screens:', Math.round(lines / runs), '| activities:', Math.round(acts / runs), '| choices:', Math.round(choices / runs));
const byCh: Record<string, number> = {};
for (const [k, v] of cost) byCh[k.split('/')[0]] = (byCh[k.split('/')[0]] ?? 0) + v.words / runs;
console.log('per chapter:', Object.fromEntries(Object.entries(byCh).map(([k, v]) => [k, Math.round(v)])));
[...cost.entries()].sort((a, b) => (process.env.BY_HITS ? b[1].hits - a[1].hits : b[1].words - a[1].words)).slice(0, Number(process.argv[3] ?? 60))
  .forEach(([k, v]) => console.log(Math.round((process.env.BY_HITS ? v.hits : v.words) / runs * 100) / 100, k, v.text.slice(0, 80)));
