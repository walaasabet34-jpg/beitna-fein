# Chapter 3 regression check — 2026-10-25

Base: `fe05dead15376f78a6768ce17eb2dfdf4e8cc39f`, PR #1, `chapter-3-elkhabar`.

## Changes

- Scope the wardrobe seating override to Chapter 1. Keep `bag_on_closet` and all choice consequences for story continuity, including existing saves. Chapters 2 and 3 use normal safety/sewing-based placement and render the suitcase beside Hoda.
- Set the evening scene to slot 3, the night narration to slot 4 on the current day, and advance to day 2 slot 0 on entry to `c3_day2`.
- No Chapter 1 or Chapter 2 story JSON changes.

## Verification

- New regression tests fail against the original core/content and pass with these changes.
- 2,000 seeded three-chapter simulations finish and reach every Chapter 3 node, including all three outcome branches.
- Existing Chapter 1 and Chapter 2 simulation/continuity suites pass, including their reachability and caring/harsh divergence checks.
- Actual Chapter 1 wardrobe option is carried through Chapters 2 and 3, with its flag and variable effects preserved. Suitcase SVG and hotspot placement checked at low, medium and high safety.
- Rendered SVG checks confirm nighttime lamp/no daylight rays and daylight on returning home the following morning. Ambience and day/slot checked across all three answers leading to the night scene.
- `npm run build`: passed (TypeScript and Vite).
- `npm test`: 34 passed, 2 failed, 1 skipped. The two failures also occur with the original core/content: undocumented audio files (`latch.mp3`, `music_home.mp3`, `music_night.mp3`, `music_play.mp3`) and leftover radio placeholders (`ph_kids.mp3`, `ph_news.mp3`, `ph_song.mp3`). These assets were not changed.
- Browser test prepared at `scripts/chapter3-e2e.mjs`; execution could not complete in this environment because Chromium extraction fails with `EINVAL` on `chown` and leaves an empty executable. No browser pass is claimed.

## Reproduce

```sh
npm ci
npm test
npm run build
# Terminal 1:
npm run dev -- --port 4173
# Terminal 2 (a working Chromium runtime is required):
node scripts/chapter3-e2e.mjs
# Optional existing Chromium executable:
CHROMIUM_PATH=/path/to/chromium node scripts/chapter3-e2e.mjs
```

PR remains unmerged. GitHub reports merge conflicts with main; those and the existing audio failures still need resolving before merge. This check does not certify the entire narrative or audiovisual quality.

## Follow-up

The six-chapter revision removes the unreferenced public audio leftovers and completes browser checks using an isolated Chromium extraction. See `FULL-STORY-VALIDATION.md` for current results; the results above describe the earlier fix commit.
