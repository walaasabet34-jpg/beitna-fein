import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import manifest from '../../audio/manifest.json';
import { CHAPTERS } from '../../content';
import { ambienceFor } from '../../audio/sceneAudio';

const root = path.resolve(__dirname, '../../..');
const M = manifest as Record<string, { file: string | null; bus: string; loop: boolean; unavailable?: string }>;
const SOURCES = JSON.parse(fs.readFileSync(path.join(root, 'audio-src', 'SOURCES.json'), 'utf8')) as { cues: Record<string, string[]>; sources: Record<string, { license: string; url: string }> };

describe('audio assets', () => {
  it('every manifest entry points to a real, non-empty file', () => {
    const missing = Object.entries(M).filter(([, m]) => m.file && (!fs.existsSync(path.join(root, 'public', m.file)) || fs.statSync(path.join(root, 'public', m.file)).size < 500));
    expect(missing).toEqual([]);
  });
  it('a silent cue is either unused music or a documented unavailable recording; music never loops', () => {
    for (const [k, m] of Object.entries(M)) {
      if (!m.file && m.bus !== 'music') expect(m.unavailable, `${k} silent without a stated reason`).toBeTruthy();
      if (m.bus === 'music') expect(m.loop, k).toBe(false);
    }
  });
  it('every sound file is documented: built from listed real recordings with a licence', () => {
    for (const [k, m] of Object.entries(M)) if (m.file) {
      const ids = SOURCES.cues[k]; expect(ids?.length, k).toBeGreaterThan(0);
      for (const id of ids) { expect(SOURCES.sources[id], `${k}: ${id}`).toBeTruthy(); expect(SOURCES.sources[id].license).toMatch(/CC0|CC BY|CC-BY|Public domain/); }
    }
    const files = fs.readdirSync(path.join(root, 'public', 'audio'));
    expect(files.filter((f) => !Object.values(M).some((m) => m.file === `audio/${f}`))).toEqual([]);   // no stray old files
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
