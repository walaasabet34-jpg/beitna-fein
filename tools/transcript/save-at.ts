// Writes a save at the start of a chapter, reached by simulating the earlier chapters (for browser tests).
// Usage: npx vite-node tools/transcript/save-at.ts -- <chapterId> <seed> <policy> > save.json
import { CHAPTERS, CHAPTER_ORDER } from '../../src/content';
import { indexChapter, newGame, continueToChapter } from '../../src/engine/core';
import { simulate } from '../../src/engine/sim';
import type { GameState } from '../../src/engine/types';
const target = process.argv[2] ?? 'ch5', seed = Number(process.argv[3] ?? 5), policy = (process.argv[4] ?? 'kind') as 'random' | 'kind' | 'harsh';
let s: GameState | undefined;
for (const id of CHAPTER_ORDER) {
  const ic = indexChapter(CHAPTERS[id]);
  const start = s ? continueToChapter(ic, s) : newGame(ic);
  if (id === target) { process.stdout.write(JSON.stringify({ ...start, chapterStart: start })); break; }
  s = simulate(ic, seed, 3000, policy, start).state;
}
