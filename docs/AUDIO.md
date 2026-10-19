# Audio & radio — genuine recordings only

**Rule (creative requirement):** every sound is a genuine recording of the real object, place, performance or broadcast. No speech synthesis or voice cloning, no recreated bulletins, no synthesized or sequenced music, no stand-ins assembled from other objects. If no genuine, reusable recording exists, the cue is **silent** and marked unavailable. Silence is preferred to anything fake.

Every recording, with author, licence and link: `audio-src/SOURCES.json` (a test fails if a sound file is not listed) and the in-game page `public/audio-credits.html` (Pause menu → «الأصوات والتسجيلات: المصادر»).

## What plays

| Cue | Genuine recording(s) | Licence |
|---|---|---|
| `amb_day` / `amb_morning` | Quiet room with distant pigeons (blouhond); through the window: birds (keweldog ×3, dwareing), hens (jsbarrett), bicycle bell (13gkopeckak), hooves/steps in the street (hintringer), a dog (magnus589), a cat (philsapphire); morning adds roosters (jsbarrett, bob58) | CC0 / CC BY 3.0 |
| `amb_night` | Crickets (GiovanniProvenzale, rgbrobot), an old clock ticking (LanDub), a dog at night (rickyjezz) | CC0 / CC BY 4.0 |
| `amb_stair` | Quiet building, footsteps on a staircase (Hippocampuz), a door below, a cat | CC BY-SA 4.0 / CC0 / CC BY 3.0 |
| `sewing` | **An 1894 Singer sewing machine** in use (Pannini, Wikimedia Commons; audio from the video, 13–29 s) | CC BY-SA 4.0 |
| `pencil` | Pencil on paper (gypsygirl) | Public domain |
| `page` | Turning a page (planish) | Public domain |
| `coins` | Coins dropped on a wooden floor (ezwa) | Public domain |
| `steps` | Footsteps on a staircase (Hippocampuz) | CC BY-SA 4.0 |
| `knock` | Knock on a wooden door (TeamKill3r) | CC0 |
| `door` / `door_close` / `window` | Wooden door opening (MaxDemianAGL) / closing (kyles), window (xdrav) | CC BY 3.0 / CC0 |
| `pour` / `boil` / `tap` | Water poured into a cup (Zabuhailo), a boiling pot, a running tap (FOSSarts) | CC0 / CC BY 4.0 |
| `clink` / `fabric` | Plate and cutlery, cloth handling (tgstation foley, credited authors) | CC BY-SA 3.0 |
| `bag_open` | A real suitcase set down and opened (Joseph Sardin, BigSoundBank 0802) | CC0 |
| `basket` | A real rope creaking with a real wicker basket (BigSoundBank 0554 + 0865) | CC0 |
| `radio` | A real switch click (stephan) + real radio static (digifishmusic) | Public domain / CC BY 4.0 |
| `tick` (UI) | One tick of the old clock (LanDub) | CC0 |
| `music_title` | Title screen only: Egyptian ensemble, «Art-song Maqam Sika», gramophone record 1931 (Hornbostel, *Musik des Orients*), first minute, unaltered | Public domain |

Effects are only trimmed, faded and level-matched: no added reverb, pitch changes or synthesis. Ambience beds layer several real field recordings.

### Silent (unavailable)
| Cue | Why |
|---|---|
| `latch` (the clasp clicking shut, «تِك. القفل قفل») | No openly licensed recording of a bag clasp found. The suitcase recording opens with a zip, so it is used only where the bag is opened |
| Story music (`music_home`, `music_play`, `music_night`) | Removed. No genuine performance is used as underscore; scenes rely on the room and the street |

## Radio
Three ways a broadcast can play, depending on the build:

| Slot (date in game) | Public build (Vercel) | Local personal build (`npm run dev:archive`) |
|---|---|---|
| Ch1 children's programme (`kids_programme`, 27 Oct) | **Official embed**: Abla Fadila, «غنوة وحدوتة: حُب الوطن», Egyptian Radio's YouTube channel (@EgyRadio, `x0fnDixn_-w`) | same embed |
| Ch2 Abla Fadila (`kids_fadila_episode`, 3 Nov) | **Official embed**: «غنوة وحدوتة: التاجر والشحات» (@EgyRadio, `a_uNSnFAFCQ`) | **Local file**: the supplied episode, the rich man who painted his palace with gold |
| Ch1 song (`radio_song`, 27 Oct) | Munira al-Mahdiyya, Baidaphon 23045, c. 1914 (public domain, file in the build) | same |
| Ch2 song (`radio_song_c2`, 3 Nov) | Munira al-Mahdiyya record | **Local file**: Abdel Halim Hafez, «عاش اللي قال» (song only, the later narrated intro cut at 37 s). Egyptian radio broadcast it from 18 Oct 1973 ([wazizamusic.com](https://wazizamusic.com/بليغ-حمدي-موسيقار-نصر-أكتوبر1973م/)); this recording is not claimed to be from 3 Nov |
| News 27 Oct / 3 Nov | Silent, player hidden | same |

**Official embeds**: YouTube's own player, shown at full size (≥ 200 px tall) on the radio card; the game never extracts or hides the audio. Volume, mute and the ambience duck follow the game's radio settings through YouTube's documented `postMessage` commands. Needs an internet connection. Checked in Chrome: both episodes load, start after a tap (state buffering → playing), pause/play/volume commands work. Not checked: Safari/iOS. The provider can remove a video or disable embedding at any time; the player would then show YouTube's own error.

**Story text follows the recording** (content condition `{"build": "archive"}`): Chapter 1 now tells «حُب الوطن» (three brothers who left their country, and who still carried it in his heart); Chapter 2 tells the merchant and the beggar in the public build, and the gold palace in the local build; the Ch2 song line names «عاش اللي قال» only in the local build.

**Not used**: «على الناصية» (supplied episode is post-2011; no official pre-1973 episode found online). Radio Cairo's English shortwave service, Oct 1973 (`shortwave_radio_cairo_1973`), stays in the registry only.

**Local files** live in the git-ignored `public/local-archive/` (overlay `registry.local.json`), are never copied into `dist/`, and are delivered separately (`beitna-local-archive.zip`). Licensing notes live here and on the credits page, never in the story or the player.

## Mix and controls
Loudness is matched per bus (effects by their loudest 0.4 s, ambience by overall level); ambience sits about 20 dB under effects; ambience and music duck while the radio plays. Pause menu: sound on/off, music, house & street, effects, radio; the radio player has mute and volume (plus play/pause, replay and subtitles for recordings in the build).

## Rebuild
```bash
python3 tools/audio/build_real.py     # ambience, effects, title music → public/audio + manifest
python3 tools/audio/build_radio.py    # archival radio files + registry
python3 tools/audio/credits.py        # public/audio-credits.html
python3 tools/audio/check.py          # decode every file: clipping, DC, loop seams
```
To add a genuine recording later (e.g. a cleared Maspero bulletin): put the file in `audio-src/`, add it to `SOURCES.json`, wire it in the build script (or, for radio, add it as a `cleared` archival source), rebuild.

## Verified / not verified
| Check | Result |
|---|---|
| Content of every source (right object, no traffic/horns/music in ambience) | AudioSet classifier on each file; the Singer recording scores «Sewing machine» 0.90–0.95 |
| Radio Cairo recording: language, station, programme | Whisper speech recognition: English, Radio Cairo station ID heard |
| Files decode, no clipping, seamless loops | `check.py`: pass |
| Browser behaviour (unlock, buses, mute, volumes, ducking, hidden player for silent news, embed shown ≥ 200 px, no developer text) | `audio-e2e.mjs`, `radio-e2e.mjs` (phone + desktop), `archive-e2e.mjs` (public vs local build): pass |
| Official embeds actually play | In Chrome on an ordinary web page: both episodes load, play after a tap, pause/play/volume commands work. **Not** in the claude.ai preview: its sandbox blocks YouTube frames, so the player shows a link to the episode on the official channel instead |
| Full playthroughs, Ch1 → Ch2 | `e2e.mjs`, 5 runs (phone + desktop, different choices, save/reload) |
| **How it sounds to a listener** | **Not judged by a human** |
| **Safari / iOS / real devices** | **Not tested** |
