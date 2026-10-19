# Archival audio: sources and rights (researched 18 Oct 2026)

This is a research record, not legal advice. Nothing below has been downloaded or bundled.

## How the game treats archival audio

| Tier | Where it can play | Who decides |
|---|---|---|
| **cleared** | Public build (Vercel) and local build | Only after written permission or a documented public-domain/licence basis, plus a human listening check (content, date, language) |
| **local-only** | Only `npm run dev:archive` / `build:archive` on your own computer. Lives in git-ignored `public/local-archive/`; the public build deletes it even if present | You, for private listening tests |
| **pending** | Nowhere. Listed for research only | — |

Authentic recordings are played **unaltered** (no radio filter, no re-encoding beyond what the source provides). No recreations or synthetic audio are used anywhere.

## Egyptian law: what the terms mean for 1973 audio
Summary of Law 82/2002 as published by AGIP (Abu-Ghazaleh IP):

| Right | Term | 1973 material |
|---|---|---|
| Broadcasting organisation (Art. 168) | 20 years from first broadcast | Appears expired (1993) |
| Performers, e.g. announcers (Art. 166) | 50 years from performance | Appears expired (2023) |
| Sound-recording producer (Art. 167) | 50 years from registration or publication, whichever is later | Expired if published in 1973; **not** if first published later |
| Authors, e.g. composers, lyricists, scriptwriters (Art. 160) | Life + 50 years | Mostly **still protected**: 1973 songs, Abla Fadila's stories |
| Official documents, mere news (Art. 141) | Not protected | Communiqué texts and plain news reports |

What this means in practice:
- **Military communiqués and news bulletins** are the most promising for public use: the text is unprotected, and the broadcast and announcer rights appear expired in Egypt. The obstacles are getting a genuine copy, and the fact that the site is reachable worldwide, where other countries' rules may differ.
- **Period songs and children's programmes** remain protected through their composers and writers. They stay local-only unless rights holders agree. "Non-commercial" does not by itself grant permission.

## Candidate recordings

| ID | Recording | Source URL | Date | Authenticity | Licence / rights | Attribution required | Tier now | What's needed |
|---|---|---|---|---|---|---|---|---|
| `arch_sraa_radio_cairo_1973` | Radio Cairo segment, shortwave aircheck (on the same item as an Israel Radio newscast) | https://archive.org/details/RadioCairoDuring73War | During the 1973 war; exact date unknown | Unverified (off-air recording) | Uploader states **CC BY-NC 3.0**; Radio Cairo's own rights appear expired (Art. 168); any music inside may be protected | "Recording: Dan Robinson, via the Shortwave Radio Audio Archive / Internet Archive (CC BY-NC 3.0)" | pending → local-only once you download it | Listen: Arabic or foreign service? Date? Any music? Shortwave external services were often not in Arabic, which would make it wrong for a Cairo home |
| `arch_sraa_radio_cairo_c1971` | Radio Cairo opening music, shortwave aircheck, 9.475 MHz | https://shortwavearchive.com/archive/radio-cairo-circa-1971 | c.1971 | Unverified | Site licence **CC BY-NC 3.0**; composition of the music unknown | "Recording: Dan Greenall, Shortwave Radio Audio Archive (CC BY-NC 3.0)" | pending | Confirm it is the external service's music, not the General Programme's; identify the composer |
| `arch_communique_1_maspero` | Communiqué No. 1, 6 Oct 1973, General Programme | — (Maspero / National Media Authority archive) | 6 Oct 1973 | — | Text unprotected (Art. 141); recording held by the National Media Authority | Per the archive's terms | pending | **Authenticity warning:** per Al-Youm Al-Sabea (11 Oct 2026), the circulating recordings use the wrong voices. Only a copy with archive provenance should ever be labelled authentic. Not reachable in the current timeline anyway |
| `arch_news_1973_10_27`, `arch_news_1973_11_03` | General Programme news bulletins for the game's dates | — | 27 Oct / 3 Nov 1973 | — | As for communiqués | — | pending | Find whether any recording of those bulletins survives (Maspero). If not, the slot stays silent |
| `arch_ghenwa_wa_hadduta` | Abla Fadila, «غنوة وحدوتة» | — | autumn 1973 | — | Scripts and songs protected (authors' life + 50) | — | pending | Permission from the rights holders, or keep it local-only |

**Texts for subtitles.** The full texts of communiqués No. 1–63 (6–26 Oct 1973) are reproduced by group73historians (https://group73historians.com/حرب-أكتوبر/822-1973-88). Official documents can be quoted, so these can become subtitles for a genuine recording.

## Research findings that changed the game
- **No communiqué on 27 October.** The historians' list ends at No. 63 on 26 Oct 1973. Chapter 1's radio line no longer claims a new communiqué that day; it now says "this is Cairo, here is the news, and in news from the front…".
- **The famous communiqués fall outside the timeline.** No. 1 and the crossing communiqué (No. 7) are dated 6 Oct, but the game's provisional dates are 27–28 Oct and 3–4 Nov. Hearing them would mean an earlier chapter date. The radio never plays a broadcast before, or except on, its real day.

## Adding a recording you've obtained (local-only)
See `local-archive-template/README.md`. In short: copy the folder to `public/local-archive/`, drop the original file in, add an entry with `license.status: "local-only"`, and run `npm run dev:archive`. The game shows a red banner and a "نسخة محلية · الحقوق مش مؤكدة" (local copy, rights unconfirmed) badge, and the recording plays unfiltered with your subtitles.

## Moving a recording to the public game
Only when its tier becomes **cleared**:
1. Move the file to `public/radio/`.
2. Edit its entry in `public/radio/registry.json` (and the bundled copy): set `status: "cleared"`, `holder`, `terms`, `verifiedBy`, `verifiedOn`, `attribution` and `transcript`.
3. Set `authenticity: "authentic-archival"` only with archive provenance.
4. Update the test in `radio.test.ts` that currently asserts no archival source is cleared.

## Status update (18 Oct 2026, genuine-only rule)
- **Obtained and used:** Munira al-Mahdiyya, «Aldahre Kata Awsali», Baidaphon 23045, c. 1914 (Wikimedia Commons, public domain) → radio song slot, labelled as an old record.
- **Obtained, verified, not used in scenes:** Radio Cairo shortwave recording, Oct 1973 (`RadioCairoDuring73War`, CC BY-NC 3.0). Speech recognition shows it is the **English** North American service («Spotlights on the Middle East»), exact day unknown. Kept in `public/radio/arch_radio_cairo_1973_sw.mp3` and the registry (`shortwave_radio_cairo_1973`).
- **Found, not used (rights):** «من تراثنا الإذاعي» (Quran Radio) replay of Sheikh Abdel Halim Mahmoud's Friday sermon of 16 Ramadan 1393 (12 Oct 1973), Internet Archive `MenTorathenAlEzaey10061973`. The uploader's CC licence can't be verified and the sermon text is protected until 2028 (author died 1978).
- **Not found:** any recording of the General Programme news on 27 Oct or 3 Nov 1973 (those slots are silent). Children's programme: undated Abla Fadila episodes from Egyptian Radio's official YouTube channel (@EgyRadio) are played through its embedded player; see docs/AUDIO.md.

## Recordings supplied by the creative director (19 Oct 2026), local archive only
- **Abla Fadila, «غنوة وحدوتة»**: undated episode (rich man and the gold palace). Used locally at `c2_kids`. Rights: Egyptian Radio / National Media Authority, not cleared.
- **«على الناصية», Amal Fahmy**: episode from after 2011 (mentions the 25 January revolution). Not used.
- **«عاش اللي قال», Abdel Halim Hafez**: first-broadcast date not verified; Baligh Hamdi (d. 1993) and Mohamed Hamza (d. 2010) still protected. Not used in scenes.
