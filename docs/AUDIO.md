# Audio & radio — genuine recordings only

**Rule (creative requirement):** every sound is a genuine recording of the real object, place, performance or broadcast. No speech synthesis or voice cloning, no recreated bulletins, no synthesized or sequenced music, no stand-ins assembled from other objects. If no genuine, reusable recording exists, the cue is **silent** and marked unavailable. Silence is preferred to anything fake.

Every recording, with author, licence and link: `audio-src/SOURCES.json` (a test fails if a sound file is not listed) and the in-game page `public/audio-credits.html` (Pause menu → «مصادر الأصوات»).

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
| Broadcast | What plays |
|---|---|
| 27 Oct news (`news_1973_10_27`) | **Silent.** No reusable recording of that day's General Programme bulletin was found. The player says: «مافيش تسجيل أصلي متاح للبث ده، فالراديو ساكت.» |
| 3 Nov news (`news_1973_11_03`) | **Silent**, same reason |
| Children's programme (`kids_programme`) | **Silent.** The real programmes (e.g. Abla Fadila) are under copyright and no reusable recording was found |
| Song (`radio_song`) | **Genuine record:** Munira al-Mahdiyya, Baidaphon 23045, c. 1914 (public domain). The subtitle states plainly that it is an old record, not a live 1973 broadcast. The file is only converted from Ogg to MP3 (256 kbps) for browser support |
| `shortwave_radio_cairo_1973` (registry only, not used by any scene) | **Genuine Radio Cairo, October 1973**: off-air shortwave recording by Dan Robinson (CC BY-NC 3.0). Content checked by speech recognition: it is the **English-language North American service** («Spotlights on the Middle East», then a tourism programme), and the exact day is unknown. Not wired to the Arabic news slot, because Fatma would hear the Arabic General Programme and the date can't be matched |

### Recordings supplied by the creative director (local archive only)
These are genuine recordings, but their reuse isn't cleared, so they live only in the git-ignored `public/local-archive/` and play only in `npm run dev:archive` (red banner, «نسخة محلية · الحقوق مش مؤكدة» badge). The public build stays silent at those moments and says no authentic recording is available.

| Recording | Checked | Where it plays (local build) |
|---|---|---|
| **Abla Fadila, «غنوة وحدوتة»** (9 min, original file kept as supplied) | Speech recognition: the intro song, then the story of a rich man who painted his palace with gold, ending «إيه غلطتك اللي عملتها في دنيتك؟». **Undated**: the subtitle says it is not a confirmed 1973 broadcast | Chapter 2, the quiet evening moment when Hoda sits in front of the radio (`c2_kids`, broadcast `kids_fadila_episode`) |
| **Amal Fahmy, «على الناصية»** (11.7 min) | **Not from 1973.** Amal Fahmy mentions the 25 January 2011 revolution and a 2011 graduating class | Not used in any scene; kept in the archive with that note |
| **Abdel Halim Hafez, «عاش اللي قال»** (lyrics Mohamed Hamza, music Baligh Hamdi) | The supplied file starts with a later narrated intro («أكتوبر 73… إنها النصر»), cut at 37 s, so only the song plays (the original file is kept too). **Date of first broadcast not verified** in any source found | Not used in any scene: it can't be placed on 27–28 Oct or 3–4 Nov 1973 until the date is confirmed |

Note: Chapter 2's line «الحدوتة النهارده عن ولد بيكذب» describes a different story from the supplied episode. The text was left unchanged.

All earlier synthetic voices, recreated bulletins and the generated listeners' programme have been deleted from the project.

## Mix and controls
Loudness is matched per bus (effects by their loudest 0.4 s, ambience by overall level); ambience sits about 20 dB under effects; ambience and music duck while the radio plays. Pause menu: sound on/off, music, house & street, effects, radio; the radio player has mute, volume, subtitles, replay and source details.

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
| Browser behaviour (unlock, buses, mute, volumes, ducking, silence for unavailable broadcasts) | `audio-e2e.mjs`, `radio-e2e.mjs` on phone and desktop sizes: pass |
| **How it sounds to a listener** | **Not judged by a human** |
| **Safari / iOS / real devices** | **Not tested** |
