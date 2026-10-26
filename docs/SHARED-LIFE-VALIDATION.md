# Shared-life revision — executed verification (26 Oct 2026)

Branch `feat/huda-shared-life`, base `d2a1514`. Only what was actually run is listed.

| Check | Result |
|---|---|
| `npm test` (vitest) | 84 passed, 1 skipped (optional local radio overlay). Includes 2,000 six-chapter simulations, 3,000 ch1, ch1→2 and ch1→3 runs, the new `shared-life.test.tsx` (19 tests: ritual scoring, clothes history, contact chain, proof detail, literacy, cost labels, the absence, end memories, v2→v3 migration, reload inside a ritual, the household visuals) |
| `npm run build` | passes (tsc + vite) |
| Browser, full story, phone 390×844, touch, random choices (seed 11) | all six chapters, 493 steps, 9 rituals played by touch, 0 JS errors, 0 horizontal overflow |
| Browser, full story, desktop 1440×900, mouse, rotating first choices, reload inside the first ritual | all six chapters, 714 steps, 12 rituals (button drags and taps, ball by keyboard), 0 errors, 0 overflow; reload returned to the same ritual |
| Browser, full story, phone, touch, "last" choices (seed 3) | all six chapters, 384 steps, 0 errors, 0 overflow |
| Browser, chapter 5 from a simulated save | ends correctly, packing and the lonely ball game played |
| `scripts/saves-layout-e2e.mjs` | 39/39: v2 save on a removed node resumes at its equivalent with flags; v2 mid-ch4 save; unknown node resumes its chapter; reload inside ball, buttons, dressing and packing; RTL and no overflow at 360×640, 390×844, 1440×900 |
| Screenshots inspected | stairs ball game, sorting with Hoda, dressing (phone and desktop), sickroom with doctor, ball from bed, sleeping, hospital, mother and Naima, packing, the lonely ball; contact sheets of all poses and expressions (`tools/artsheet`) |
| Reading measurement | 1,977 → ≈1,640 words per route; 210 → ≈185 text screens; 2 → 11 played activities (`tools/transcript/word-cost.ts`, 300 routes) |
| Independent continuity review | three complete routes, 25 findings, all fixed |

Not done: no human playtest; no audio check on new rituals (they reuse existing genuine recordings: tap, clink, fabric, sewing, tick); the Vercel production deploy depends on GitHub push access, which this session did not have.
