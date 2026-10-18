import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Local archive guard. Recordings whose reuse rights are NOT confirmed live in public/local-archive/
 * (git-ignored). They are only served in the local experimental mode (`--mode archive`). Any other
 * build deletes them from the output, so they can never reach the public Vercel deployment.
 */
function localArchiveGuard(mode: string): Plugin {
  return {
    name: 'local-archive-guard',
    apply: 'build',
    closeBundle() {
      if (mode === 'archive') return;
      const out = path.resolve(__dirname, 'dist/local-archive');
      if (fs.existsSync(out)) { fs.rmSync(out, { recursive: true, force: true }); console.log('[local-archive-guard] removed dist/local-archive from public build'); }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localArchiveGuard(mode)],
  test: { environment: 'node' },
}) as any);
