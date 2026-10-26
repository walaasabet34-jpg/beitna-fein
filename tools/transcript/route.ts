// Prints the text a player reads on one simulated route through all six chapters (editorial review).
// Usage: npx vite-node tools/transcript/route.ts -- <seed> <policy: random|kind|harsh>
import { CHAPTERS, CHAPTER_ORDER, CHARACTERS } from '../../src/content';
import { indexChapter, newGame, continueToChapter, getNode, resolveLine, visibleOptions } from '../../src/engine/core';
import { simulate } from '../../src/engine/sim';
import type { GameState } from '../../src/engine/types';
const seed = Number(process.argv[2] ?? 3), policy = (process.argv[3] ?? 'random') as 'random' | 'kind' | 'harsh';
let s: GameState | undefined; let words = 0;
for (const id of CHAPTER_ORDER) {
  const ic = indexChapter(CHAPTERS[id]);
  const start = s ? continueToChapter(ic, s) : newGame(ic);
  console.log(`\n══ ${CHAPTERS[id].title}`);
  let prev = start;
  const show = (st: GameState) => {
    const n = getNode(ic, st.node);
    if (n.type === 'line') { const r = resolveLine(n, st); words += r.text.split(/\s+/).length; console.log(`${r.speaker === 'narrator' ? '   ' : (CHARACTERS[r.speaker]?.name ?? r.speaker) + ': '}${r.text}`); }
    else if (n.type === 'choice') console.log(`  [اختيار] ${n.prompt ?? ''} ${visibleOptions(n, st).map((o) => o.text).join(' / ')}`);
    else if (n.type === 'activity') console.log(`  [فعل: ${n.activity}]`);
    else if (n.type === 'hub') console.log(`  [الأوضة]`);
    else if (n.type === 'end') console.log(`  [نهاية] ${n.title}`);
    prev = st;
  };
  show(start);
  const run = simulate(ic, seed * 7 + id.length, 3000, policy, start, show);
  s = run.state;
}
console.log(`\n(words read on this route: ${words})`);
