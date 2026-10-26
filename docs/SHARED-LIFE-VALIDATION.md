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

## After the coherence pass (canon v2, braiding, rehearsal)

| Check | Result |
|---|---|
| `npm test` | 87 passed, 1 skipped. New: every "فاضل N يوم" checked against the chapter calendar; no returned letter or old-plot words anywhere; the money order → gift and the rehearsal are reachable; the reply answers each of the five details Hoda can choose. |
| `npm run build` | passes |
| Browser, full story, phone, touch, random (seed 44), reload inside a ritual | all six chapters, 507 steps, 0 JS errors, 0 overflow |
| Browser, full story, desktop, mouse, "last" choices (seed 9) | all six chapters, 542 steps, 0 errors, 0 overflow |
| Browser, full story, phone (seed 31) and desktop (seed 5) | all six chapters, 0 errors, 0 overflow; braiding played by touch and by mouse |
| `scripts/saves-layout-e2e.mjs` | 39/39 |
| Screenshots inspected | braiding on phone and desktop (the first version had the comb on her cheek and the bubble under the top bar on phones; both fixed, bubbles now wrap) |
| Reading | ≈1,900 words per route (original 1,977); 196 text screens; 14 played activities |
| Independent review of the new canon | three routes, 30 findings, 28 fixed, 2 kept on purpose (see DESIGN-SHARED-LIFE.md) |

Not done: no human playtest; no audio check on new rituals (they reuse existing genuine recordings: tap, clink, fabric, sewing, tick); the Vercel production deploy depends on GitHub push access, which this session did not have.
