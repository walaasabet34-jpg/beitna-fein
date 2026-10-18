import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import manifest from '../../audio/manifest.json';
import { CHAPTERS } from '../../content';
import { ambienceFor } from '../../audio/sceneAudio';

const root = path.resolve(__dirname, '../../..');
const M = manifest as Record<string, { file: string; bus: string }>;

describe('audio assets', () => {
  it('every manifest entry points to a real, non-empty file', () => {
    const missing = Object.entries(M).filter(([, m]) => { const f = path.join(root, 'public', m.file); return !fs.existsSync(f) || fs.statSync(f).size < 500; });
    expect(missing).toEqual([]);
  });
  it('every sound/music/ambience cue used in the story exists in the manifest', () => {
    const bad: string[] = [];
    for (const ch of Object.values(CHAPTERS)) for (const n of ch.nodes) {
      if (n.sfx && !M[n.sfx]) bad.push(`${n.id} sfx ${n.sfx}`);
      if (n.music && M[n.music]?.bus !== 'music') bad.push(`${n.id} music ${n.music}`);
      if (n.ambience && M[n.ambience]?.bus !== 'ambience') bad.push(`${n.id} ambience ${n.ambience}`);
    }
    expect(bad).toEqual([]);
  });
  it('every scene maps to an existing ambience', () => {
    for (const scene of ['door', 'living', 'morning', 'night', 'drawing']) for (const slot of [0, 2, 4]) {
      const a = ambienceFor({ scene, slot } as never);
      expect(a && M[a]?.bus).toBe('ambience');
    }
  });
});
