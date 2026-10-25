# Six-chapter story validation — 25 October 2026

Base: PR #1 branch `chapter-3-elkhabar`, commit `4d42bf81b9b3e3c62d49aa2c0c2e206511124186`.

## Scope

Six linked chapters, 683 story nodes including branches and choices. The opening moves to 4–5 October. New chapters cover the war, Hoda's illness and death, and the mother's arrival and belongings decisions. Existing Chapter 1–3 node IDs are retained for save compatibility. New games experience the war chapter; existing later-chapter saves continue from their current position.

Relationship before illness is recorded separately from bedside choices. The mother's identity is checked, and she receives the death news before the meeting decision. All medical-care paths lead to treatment; no money/relationship threshold offers survival. Story dates and historical anchors are documented in `STORY-HISTORY-1973.md`.

## Checks

- `npm test`: **43 passed, 1 skipped**. The skipped test requires the optional local-only radio overlay, which is not supplied here.
- **2,000 complete six-chapter simulations**: all finish, time moves forward, every new war/illness/grief node is reached, and all three final outcomes occur.
- Existing Chapter 1/2 reachability and caring/harsh divergence tests pass. Previous Chapter 3 suitcase, day/night lighting and continuity regressions pass.
- Explicit tests cover immediate and deferred meetings, messenger handover, refusal, reconsideration, unconditional medical care, pre-illness relationship memory, carried crossing-day memories, and removal of the suitcase art after delivery.
- `npm run build`: passed (TypeScript and production Vite build).
- Chromium full playthroughs on mobile: first-choice and random paths finish all six chapters (five chapter transitions), reload/continue and manual saving pass, RTL/layout pass, no JavaScript/console errors.
- Eight targeted Chromium scene checks: crossing, hospital, mother's arrival and post-handover at 390 and 1440 pixels. Stage, crossing clock, suitcase disappearance and horizontal layout pass. Screenshots of the new scenes were inspected.
- Removed seven unreferenced legacy public files that caused the old audio/radio audit failures: `audio/latch.mp3`, `audio/music_home.mp3`, `audio/music_night.mp3`, `audio/music_play.mp3`, `radio/ph_kids.mp3`, `radio/ph_news.mp3`, `radio/ph_song.mp3`. Runtime manifest/registry entries are unchanged; no synthetic audio is added.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In a second terminal:
E2E_URL=http://127.0.0.1:4173/ E2E_RUNS=3 E2E_NO_SHOTS=1 E2E_REDUCED=1 node scripts/e2e.mjs
E2E_URL=http://127.0.0.1:4173/ node scripts/story-visual-e2e.mjs
```

Both browser scripts accept `CHROMIUM_PATH=/path/to/chromium`. In this execution environment the packaged extraction failed due to tar ownership handling; extracting the existing package into an isolated temporary directory without changing file ownership supplied a working Chromium executable. No dependency code was changed.

## Release limits

This is a complete playable narrative draft, not a claim of exhaustive historical or literary verification. Old grocery prices remain approximate, historical recordings without verified provenance/rights are not newly supplied, and character visuals remain the prototype's SVG style. PR #1 is not merged; main-branch conflicts must be reviewed separately. This change does not update the production site by merging into main.
