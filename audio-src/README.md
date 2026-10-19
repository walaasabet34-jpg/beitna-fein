# audio-src — the real recordings every game sound is built from

- `SOURCES.json`: every recording (title, author, original URL, licence, where it was obtained) and which game cue uses it. A unit test fails if a sound file isn't covered.
- `esc50/` CC0 clips from the ESC-50 dataset (originals on Freesound) · `tgstation/` Space Station 13 foley (CC BY-SA 3.0 unless noted) · `cdda/` CC-Sounds pack (per-file CC0 / CC BY) · `ss14/` bicycle bell (CC0) · `aurora/` typewriter (CC BY-SA 3.0)
- `radio_voice/` rendered radio lines + `INTELLIGIBILITY.txt` (speech-recognition check of each line)
- `vsco2/` string samples (CC0), not stored: run `tools/audio/fetch_sources.sh`

Build: see docs/AUDIO.md §4.
