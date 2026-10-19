# بيتنا فين؟ — Where Is Home?

Playable: **Chapter 1 — الشنطة** and **Chapter 2 — الكلمة** (about 20 minutes together). Chapters 3–4 are designed but wait for approval.
Mobile-first web prototype · React 18 + TypeScript + Vite + Tailwind · JSON narrative · LocalStorage saves.

> All artwork is **TEMP placeholder art** drawn in SVG code. Every sound is a **genuine recording** (see docs/AUDIO.md). No synthetic voices or synthesized music; cues with no genuine recording available stay silent.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # engine, content validation, save migration, audio assets, radio rights/date rules,
                     # and thousands of simulated Ch1 → Ch2 playthroughs
npm run build        # type-check + production build into dist/
```

Browser playthrough test (headless Chromium, mobile 390×844 and desktop 1440×900):

```bash
npm run build && npx vite preview --port 4173 &
npm run e2e -- ./e2e-shots          # full Ch1 → Ch2 playthroughs, phone + desktop
node scripts/audio-e2e.mjs          # audio unlock, buses, mute, volumes, persistence
node scripts/radio-e2e.mjs ./shots  # radio player, subtitles, controls, date gate, rights labels
```

## Deploy to Vercel

1. Push the folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Deploy. No environment variables or backend needed.

CLI alternative: `npm i -g vercel && vercel --prod` from the project folder.

## Audio and historical radio

See **docs/AUDIO.md** (what plays where, sources, mix, rebuild) and **docs/ARCHIVE-SOURCES.md**. In short: every sound is a genuine recording listed with its licence in `audio-src/SOURCES.json` (credits: `public/audio-credits.html`). The radio's song slot plays a genuine c. 1914 record by Munira al-Mahdiyya; the 27 Oct and 3 Nov news and the children's programme are silent because no reusable archival recording was found. Archival recordings without cleared rights stay **Pending rights clearance**; local-only archive build: `npm run dev:archive` (never deployed). Broadcasts are gated by the in-game date.

## Saves

Saves are versioned (`src/engine/migrate.ts`). v1 saves from the first deployed build upgrade automatically to v2. Moving to the next chapter carries Hoda's memory: hidden variables, every flag, the foods Fatma has learned, and money.

## Asset status (what is temporary)

| Asset | Status | Where |
|---|---|---|
| Hoda (all poses, 10 expressions, portrait) | **TEMP** – coded SVG placeholder | `src/art/Hoda.tsx` |
| Scenes: door, living room (day/evening/night/morning), bedroom night, notebook drawing | **TEMP** – coded SVG placeholder | `src/art/scenes.tsx` |
| Paper grain / mottling | **TEMP** – generated texture | `src/index.css` (`.grain`, `.mottle`) |
| Ambience (4), effects (16), title music | Genuine recordings (public domain / CC0 / CC BY / CC BY-SA); suitcase latch and balcony basket unavailable (silent) | `public/audio`, `audio-src/`, `tools/audio/build_real.py` |
| Radio | Genuine archival only: Munira al-Mahdiyya record (c. 1914, public domain) and Radio Cairo shortwave, Oct 1973 (CC BY-NC 3.0, not used in scenes); news and children's programme silent | `public/radio`, `tools/audio/build_radio.py` |
| Chapter 2 art: school gate, teacher, Umm Nadia, homework notebook, school dress | **TEMP** – coded SVG placeholder | `src/art/scenes.tsx`, `src/art/Hoda.tsx` |
| Fonts (Aref Ruqaa, Noto Naskh Arabic) | Final candidates, open licence (OFL) | `@fontsource/*` |
| UI layout, dialogue, narrative JSON | Working prototype | `src/ui`, `src/content` |

Every temporary visual is marked on screen: "TEMP ART · رسم مؤقت" on the stage, "TEMP" on Hoda's portrait, and a note on the title screen and pause menu. Final illustrations should replace the art components one-for-one; hotspot rectangles live next to each scene (`livingTargets`, `drawingTargets`).

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
  art/                     TEMP SVG art: Hoda model (all poses/expressions), scenes, hotspot geometry
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
| `activity` | `kitchen` or `bed` mini-interaction, parameters in JSON |
| `branch` | silent routing by condition |
| `card` | chapter / day title card |
| `end` | chapter ending with variants + "memories" list |

Conditions: `{ "var": "trust", "gte": 20 }`, `{ "flag": "greet", "eq": "kneel" }`, `{ "money": { "gte": 3 } }`, `{ "slot": { "gte": 5 } }`, combined with `all` / `any` / `not`.
Effects: `vars`, `flags`, `inc`, `money`, `slots`, `setTime`, `likes`, `dislikes`.

Hidden variables (never shown): trust, safety, openness, autonomy, distress. Start: 15 / 20 / 10 / 50 / 60.

## Historical details flagged for verification

See `_notes.verify_history` at the top of the chapter JSON (grocer prices, blue-painted windows / blackout, the Abla Fadila radio slot, the deliberately generic radio communiqué, and the open Suez displacement backstory).
