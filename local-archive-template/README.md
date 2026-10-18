# Local archive (experimental, local-only)

Recordings whose reuse rights are **not confirmed** go here. They are for listening tests on your own computer only.

1. Copy this folder to `public/local-archive/` (that path is git-ignored and is stripped from every public build).
2. Put each recording in it **unaltered** (keep the original file; don't re-encode or "clean up" the sound).
3. Add an entry to `public/local-archive/registry.local.json` (start from `registry.local.example.json` here).
4. Run `npm run dev:archive` and open the game. A banner says you are in the local archive version.

Never run `vercel` from a folder that contains `public/local-archive/`, and never commit it.
The normal build (`npm run build`, used by Vercel) deletes `local-archive` from the output even if the folder exists.
