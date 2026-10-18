# Audio & radio — how it works and how to change it

## 1. Game audio (music, ambience, effects)

All 18 game sounds are **original**, synthesized from code by `tools/audio/generate.py` (no samples, no recordings). They are placeholders until a composer/sound designer delivers final audio, but they are fully cleared for use (project-owned).

| Cue | Bus | What it is |
|---|---|---|
| `music_home` | music | Plucked-string theme in maqam Bayati (with quarter tones), loop |
| `music_night` | music | Slow theme in maqam Nahawand, loop |
| `music_play` | music | Light theme in maqam Ajam with riq pattern, loop |
| `amb_day` | ambience | Room tone, distant street, cart hooves, sparrows, bicycle bell |
| `amb_night` | ambience | Quiet room tone, crickets |
| `amb_stair` | ambience | Hollow stairwell tone |
| `knock` `tick` `latch` `page` `radio` `sewing` `basket` `coins` `pencil` `door` `clink` `steps` | sfx | Interaction sounds |

- Manifest: `src/audio/manifest.json` (file, bus, loop, mix gain, "exclusive" = never overlaps itself).
- Story control: a node's `sfx` plays a one-shot; `music` switches/crossfades the loop (`null` = silence); ambience follows the scene and time of day (`src/audio/sceneAudio.ts`) unless a node sets `ambience`.
- Regenerate: `python3 tools/audio/generate.py && python3 tools/audio/check.py` (the check decodes every file and fails on clipping, DC offset or a bad loop seam).
- To replace a sound with a final recording: put the MP3 in `public/audio/` with the same name. No code change.

### Player controls
Pause menu → الصوت (on/off), المزيكا (music volume), أصوات البيت (effects + ambience volume), اختبار الصوت (plays a knock and a music sample, and reports whether the browser's audio is running). The HUD speaker button mutes everything. All preferences persist in `localStorage`.

### Browser rules handled
- Nothing is created before the first tap/click/key (Chrome, Safari and iOS autoplay rules).
- iOS: a silent buffer is played inside the first gesture to unlock output.
- Audio pauses when the tab/app is hidden and resumes when visible.
- Long effects (radio static, sewing, footsteps) fade out on scene changes and never stack.

## 2. Historical radio

### Rules the game enforces
1. **Only rights-cleared audio can play.** For each broadcast the game plays the *first* source whose `license.status` is `"cleared"` **and** has a `file`. Archival sources are `"pending"` with `file: null`, so they are never fetched, bundled or played.
2. **Never before the real date.** Each broadcast has an `airDate`. `window: "same-day"` (news, communiqués) plays only on that exact in-game date; `"any-after"` (songs, recurring programmes) on or after it. The in-game date comes from each chapter's `calendar`.
3. **Authentic vs recreated is always visible.** The radio player shows a badge: تسجيل أصلي من الأرشيف · تسجيل أرشيفي (لسه ماتأكدش) · إعادة تمثيل حديثة · صوت مؤقت. The ⓘ panel shows source, rights label, attribution, URL, and a note when an original recording is still pending clearance.

### Player controls
Play/pause, replay from start, radio mute, radio volume (separate from music and effects), subtitles (CC) on/off, and source details. Preferences persist.

### Registry
`public/radio/registry.json` (read at runtime; a bundled copy in `src/radio/registry.default.json` is the offline fallback, and a test keeps them identical).

Each source records: `title`, `sourceUrl`, `historicalDate`, `authenticity`, `license` (`status`, `label`, `holder`, `terms`, `verifiedBy`, `verifiedOn`), `attribution`, `file`, `transcript` (timed subtitles).

**All archival entries are currently `"Pending rights clearance"` with no URL.** The specific recordings the team identified have not been entered yet. Send the list and I'll add each with its source URL and date (still pending, still not downloaded).

### Swapping in a cleared archival recording (no code change)
1. Get written permission; note holder, terms and required attribution.
2. Put the file in `public/radio/` (e.g. `arch_news_1973_10_27.mp3`).
3. In `registry.json`, on that archival source: set `file`, `sourceUrl`, `license.status: "cleared"`, `license.holder/terms/verifiedBy/verifiedOn`, `attribution`, and `authenticity: "authentic-archival"` once verified. Add the `transcript`.
4. Copy the same JSON to `src/radio/registry.default.json` (or re-run the tests; one fails until they match).
5. Because it is listed first, the cleared archival source automatically replaces the placeholder.

The test `radio.test.ts` currently asserts that **no** archival source is cleared or bundled. Update that test deliberately when the first recording is cleared.

### Placeholder broadcasts
`tools/audio/radio_placeholders.py` generates `public/radio/ph_news.mp3`, `ph_kids.mp3`, `ph_song.mp3`. The "voices" are intentionally unintelligible synthetic murmur through an AM-radio filter: they cannot be mistaken for a real announcer, and they do not imitate Abla Fadila or anyone else. The words come from the subtitles, which are labelled as rewritten text.

## 3. What has and hasn't been verified

| Check | How | Result |
|---|---|---|
| Every referenced file exists | unit test (manifest + registry) | Pass |
| Files decode, no clipping/DC, loops seamless | `tools/audio/check.py` | Pass (18/18) |
| Unlock only after a gesture, buses, mute, volumes, crossfade, persistence | `scripts/audio-e2e.mjs` in headless **Chromium** (measures real output level) | Pass |
| Radio: tune-in, subtitles, CC, mute, volume, replay, pause, labels, date gate | `scripts/radio-e2e.mjs`, Chromium at phone + desktop sizes | see test report |
| **Safari / iOS / Android Chrome on real devices** | — | **Not tested.** No WebKit or real device was available. |
| **How it actually sounds** | — | **Not listened to.** Checks are signal-level only. |
