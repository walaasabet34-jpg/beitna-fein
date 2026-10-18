# بيتنا فين؟ — Where Is Home?

Vertical slice: **Chapter 1 — الشنطة** (playable, ~6–9 minutes).
Mobile-first web prototype · React 18 + TypeScript + Vite + Tailwind · JSON narrative · LocalStorage saves.

> All artwork is **TEMP placeholder art** drawn in SVG code. Sounds are **procedurally generated placeholders** (Web Audio). Nothing here is final art or audio.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # engine + content validation + 3,000 simulated playthroughs
npm run build        # type-check + production build into dist/
```

Browser playthrough test (headless Chromium, mobile 390×844 and desktop 1440×900):

```bash
npm run build && npx vite preview --port 4173 &
npm run e2e -- ./e2e-shots
```

## Deploy to Vercel

1. Push the folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Deploy. No environment variables or backend needed.

CLI alternative: `npm i -g vercel && vercel --prod` from the project folder.

## Project layout

```
src/
  content/                 ← all story text lives here (edit freely)
    chapters/ch1-elshanta.json
    characters.json
  engine/                  ← pure TypeScript, no React, no story text
    types.ts               schema: nodes, conditions, effects, state
    core.ts                conditions, effects, navigation, activities, mood → expression
    validate.ts            static content checks (broken links, unset flags)
    sim.ts                 headless random playthroughs
    save.ts                versioned LocalStorage save + settings
  store/gameStore.ts       zustand wrapper: autosave after every step, sound cues
  art/                     TEMP SVG art: Hoda model (all poses/expressions), scenes, hotspot geometry
  audio/sfx.ts             procedural placeholder sounds
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
