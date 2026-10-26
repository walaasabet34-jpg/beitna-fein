# Content revision scripts (shared-life revision, Oct 2026)

These scripts produced this revision's chapter JSON from the base commit `d2a1514`. The JSON in `src/content/chapters/` is the source of truth from now on — edit it directly. The scripts are kept so the transformation can be read, audited or replayed.

Order: per-chapter rewrites (`ch1 … ch5`), then `fixes.py` (independent continuity review), `cut.py` and `cut2.py` (reading cuts measured with `tools/transcript/word-cost.ts`), `merge.py` (same-speaker lines that always follow each other), and `lead.py` (narration shown above the next character line on the same screen). Every removed node id is recorded in `removed.json`, which is copied to `src/engine/removed-nodes.json` and used by the save migration.

```sh
for f in ch1-elshanta chwar-sout-elradio ch2-elkelma ch3-elkhabar ch4-lamma-tergaai ch5-elshanta; do git checkout d2a1514 -- src/content/chapters/$f.json; done
rm -f tools/content-revision-2026-10/removed.json
for s in ch1 chwar ch2 ch3 ch4 ch5 fixes cut cut2 merge; do python3 tools/content-revision-2026-10/$s.py; done
(cd tools/content-revision-2026-10 && python3 lead.py)
cp tools/content-revision-2026-10/removed.json src/engine/removed-nodes.json
```

Running a script twice on already-edited JSON duplicates nodes — always start from `d2a1514`.
