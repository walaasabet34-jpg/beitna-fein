# Content revision scripts (shared-life revision, Oct 2026)

These scripts produced the chapter JSON changes in this revision from the base commit `d2a1514`.
The JSON files in `src/content/chapters/` are the source of truth; edit them directly from now on.
The scripts are kept so the transformation can be read, audited or replayed.

Replay (from the repo root):

```sh
for f in ch1-elshanta chwar-sout-elradio ch2-elkelma ch3-elkhabar ch4-lamma-tergaai ch5-elshanta; do git checkout d2a1514 -- src/content/chapters/$f.json; done
for s in ch1 chwar ch2 ch3 ch4 ch5; do python3 tools/content-revision-2026-10/$s.py; done
```

Running a script twice on already-edited JSON duplicates nodes — always start from `d2a1514`.
