# بيتنا فين؟ — Where Is Home?

Playable story draft: **six connected chapters**, from 4 October to 4 December 1973: الشنطة → صوت الراديو → الكلمة → الخبر → لما ترجعي → الشنطة. The story includes childhood illness, death and grief.
Mobile-first web prototype · React 18 + TypeScript + Vite + Tailwind · JSON narrative · LocalStorage saves.

> **Shared-life revision (Oct 2026):** the player now *does* things with Hoda — a sock-ball game whose rules she changes, sorting buttons for Fatma's orders beside her, dressing and mending her clothes — and the same actions return, empty, after her death. Characters are drawn with one rigged, shaded model (14 expressions). See [docs/DESIGN-SHARED-LIFE.md](docs/DESIGN-SHARED-LIFE.md) and the canon in [docs/STORY-BIBLE.md](docs/STORY-BIBLE.md).
>
> All artwork is original 2D art drawn in SVG code (no on-screen "temporary" labels). Every sound is a **genuine recording** (see docs/AUDIO.md). No synthetic voices or synthesized music; cues with no genuine recording available stay silent.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # engine, content validation, save migration, audio assets, radio rights/date rules,
                     # and thousands of simulated six-chapter playthroughs
npm run build        # type-check + production build into dist/
```

Browser playthrough test (headless Chromium, mobile 390×844 and desktop 1440×900):

```bash
npm run build && npx vite preview --port 4173 &
npm run e2e -- ./e2e-shots          # full six-chapter playthroughs, phone + desktop
node scripts/story-visual-e2e.mjs   # crossing, hospital, mother and returned-belongings scenes
node scripts/audio-e2e.mjs          # audio unlock, buses, mute, volumes, persistence
node scripts/radio-e2e.mjs ./shots  # radio player, subtitles, controls, date gate, rights labels
# Full story played with real taps/clicks on the shared rituals (needs Playwright):
PW=/path/to/playwright/index.mjs E2E_VP=mobile node scripts/shared-life-e2e.mjs ./shots
npx vite-node tools/artsheet/sheet.tsx > sheet.svg      # contact sheet of every pose/expression
npx vite-node tools/transcript/route.ts -- 3 kind        # the text a player reads on one route
```

## Deploy to Vercel

1. Push the folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Deploy. No environment variables or backend needed.

CLI alternative: `npm i -g vercel && vercel --prod` from the project folder.

## Audio and historical radio

See **docs/AUDIO.md** (what plays where, sources, mix, rebuild) and **docs/ARCHIVE-SOURCES.md**. In short: every sound is a genuine recording listed with its licence in `audio-src/SOURCES.json` (credits: `public/audio-credits.html`). The radio's song slot plays a genuine c. 1914 record by Munira al-Mahdiyya; unavailable news recordings stay silent; the war chapter conveys events through authored narration, while children's programmes use official Egyptian Radio embeds. Archival recordings without cleared rights stay **Pending rights clearance**; local-only archive build: `npm run dev:archive` (never deployed). Broadcasts are gated by the in-game date.

## Saves

Saves are versioned (`src/engine/migrate.ts`). v1 saves from the first deployed build upgrade to v2, and v2 to v3 (shared-life revision: thread spools, clothes states, removed nodes mapped to their nearest equivalent). A save pointing at a node this build doesn't have resumes its chapter with everything remembered instead of restarting. Moving to the next chapter carries Hoda's memory: hidden variables, every flag, the foods Fatma has learned, and money.

## Asset status

| Asset | Status | Where |
|---|---|---|
| Characters: one jointed 2D rig (`figure.tsx`) for Hoda and every adult (`people.tsx`) — 14 expressions, 20 poses, clothes with visible history (dust, tear, patch, long sleeve, cardigan, red ribbon/button) | Original SVG code; no external, generated or reference-game art | `src/art/` |
| Scenes (landing, door, living room by hour with the coin tin, thread spools, calendar; sickroom; hospital; night; notebook; school; homework; ritual close-ups) | Original SVG code | `src/art/scenes.tsx`, `src/ui/activities/` |
| Paper grain / mottling | Generated texture | `src/index.css` |
| Ambience (4), effects (16), title music | Genuine recordings (public domain / CC0 / CC BY / CC BY-SA); suitcase latch silent | `public/audio`, `audio-src/`, `tools/audio/build_real.py` |
| Radio | Official Egyptian Radio embeds (Abla Fadila), a 1914 public-domain record; local build adds the supplied gold-palace episode and «عاش اللي قال». News silent. See docs/AUDIO.md | `public/radio`, `public/local-archive/` (local only) |
| Fonts (Aref Ruqaa, Noto Naskh Arabic) | Open licence (OFL) | `@fontsource/*` |

Hotspot rectangles live next to each scene (`livingTargets`, `drawingTargets`) so art can be replaced component by component.

## Time system

A day has **4 playable periods** (الصبح · الضهر · العصر · المغرب) followed by **night (بالليل)**, which is reserved for story scenes.
Every action marked ⏳ costs exactly one period; talking and small interactions are free. Chapter 1 starts at الضهر, so the player gets 3 actions before night (dinner, bed, and one free choice).

## Project layout

```
src/
  content/                 ← all story text lives here (edit freely)
    chapters/ch1-elshanta.json
    chapters/ch2-elkelma.json
    characters.json
  engine/                  ← pure TypeScript, no React, no story text
    types.ts               schema: nodes, conditions, effects, state
    core.ts                conditions, effects, navigation, activities, mood → expression
    validate.ts            static content checks (broken links, unset flags)
    sim.ts                 headless random playthroughs
    save.ts                versioned LocalStorage save + settings
  store/gameStore.ts       zustand wrapper: autosave after every step, sound cues
  art/                     SVG art: Hoda model (all poses/expressions), scenes, hotspot geometry
  audio/                   engine (buses, ducking), manifest, scene → ambience
  ui/                      stage, HUD, dialogue, choices, hub, kitchen, bed, menus
scripts/e2e.mjs            browser playthrough test
```

## Writing content (cheat sheet)

Nodes run in file order; `next` is only needed to jump.

| type | purpose |
|---|---|
| `line` | one line of dialogue/narration. `variants` pick alternative text by condition |
| `choice` | player choice. Options can have `if`, `effects`, `once` |
| `hub` | free-roam room. `hotspots` (spatial + listed), `ambient` behaviour lines, `exitWhen` |
| `activity` | `kitchen`, `bed`, or a shared ritual played on the stage: `ball` (variant stairs/count/crossing/wall/bed/alone), `buttons` (helper hoda/bed/none, skill, pay), `dress` (mode dress/pack, school, cold, special, captions) |
| `branch` | silent routing by condition |
| `card` | chapter / day title card |
| `end` | chapter ending with variants + "memories" list |

Conditions: `{ "var": "trust", "gte": 20 }`, `{ "flag": "greet", "eq": "kneel" }`, `{ "money": { "gte": 3 } }`, `{ "slot": { "gte": 5 } }`, combined with `all` / `any` / `not`.
Effects: `vars`, `flags`, `inc`, `money`, `slots`, `setTime`, `likes`, `dislikes`.

Hidden variables (never shown): trust, safety, openness, autonomy, distress. Start: 15 / 20 / 10 / 50 / 60.

## Historical details flagged for verification

See `_notes.verify_history` at the top of the chapter JSON (grocer prices, blue-painted windows / blackout, the Abla Fadila radio slot, the deliberately generic radio communiqué, and the open Suez displacement backstory).

## Historical story revision

See [chronology and sources](docs/STORY-HISTORY-1973.md). Begin a new game to experience the new prewar opening and war chapter; existing node IDs are retained so older saves can continue from their current chapter. The final meeting and belongings choices are independent of the pre-illness relationship, which affects remembered dialogue.
