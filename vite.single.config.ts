// Builds one self-contained HTML file (used for sharing a playable link). Normal builds use vite.config.ts.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({ plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single', assetsInlineLimit: 100000000 } });
