import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CHAPTERS } from '../../content';
import { indexChapter, continueToChapter, getNode } from '../core';
import { simulate } from '../sim';
import { gameDate } from '../calendar';
import { aired, playableSource, type Registry } from '../../radio/registry';
import bundled from '../../radio/registry.default.json';

const root = path.resolve(__dirname, '../../..');
const live = JSON.parse(fs.readFileSync(path.join(root, 'public/radio/registry.json'), 'utf8')) as Registry;

describe('radio registry', () => {
  it('bundled fallback is identical to the live public registry', () => {
    expect(bundled).toEqual(live);
  });
  it('every source has the required rights/attribution fields', () => {
    for (const [id, b] of Object.entries(live.broadcasts)) {
      expect(b.airDate, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const s of b.sources) {
        for (const k of ['id', 'type', 'title', 'sourceUrl', 'historicalDate', 'authenticity', 'license', 'attribution', 'file', 'transcript']) expect(s, `${id}/${s.id}`).toHaveProperty(k);
        expect(['pending', 'cleared', 'rejected']).toContain(s.license.status);
      }
    }
  });
  it('genuine recordings only: no recreation, placeholder or synthetic source exists anywhere', () => {
    for (const b of Object.values(live.broadcasts)) for (const s of b.sources) {
      expect(s.type, s.id).toBe('archival');
      expect(['authentic-archival', 'unverified-archival']).toContain(s.authenticity);
      if (s.license.status === 'pending') { expect(s.license.label).toBe('Pending rights clearance'); expect(s.file).toBeNull(); }
      if (s.file) { expect(s.license.status).toBe('cleared'); expect(s.authenticity).toBe('authentic-archival'); expect(s.sourceUrl).toMatch(/^https:\/\//); expect(s.attribution).toBeTruthy(); }
    }
    const radioDir = fs.readdirSync(path.join(root, 'public/radio'));
    expect(radioDir.filter((f) => !f.startsWith('arch_') && f !== 'registry.json')).toEqual([]);
  });
  it('broadcasts without a genuine recording stay silent; the song is a genuine old record', () => {
    for (const id of ['news_1973_10_27', 'news_1973_11_03', 'kids_programme']) expect(playableSource(id, live), id).toBeNull();
    const song = playableSource('radio_song', live)!;
    expect(song.id).toBe('arch_munira_c1914');
    expect(song.transcript[0].text).toMatch(/تسجيل أصلي/);   // clearly identified, never presented as live 1973 audio
  });
  it('a pending archival source is never chosen for playback', () => {
    for (const id of Object.keys(live.broadcasts)) {
      const s = playableSource(id, live);
      if (s) { expect(s.license.status).toBe('cleared'); expect(s.authenticity).toBe('authentic-archival'); }
    }
  });
  it('every playable file exists', () => {
    for (const id of Object.keys(live.broadcasts)) {
      const s = playableSource(id, live);
      if (s?.file) expect(fs.existsSync(path.join(root, 'public', s.file)), s.file).toBe(true);
    }
  });
  it('date gate: same-day news only on its date; nothing before airDate', () => {
    expect(aired('news_1973_10_27', '1973-10-26', live)).toBe(false);
    expect(aired('news_1973_10_27', '1973-10-27', live)).toBe(true);
    expect(aired('news_1973_10_27', '1973-10-28', live)).toBe(false);
    expect(aired('kids_programme', '1973-10-27', live)).toBe(true);
    expect(aired('news_1973_11_03', '1973-10-27', live)).toBe(false);
  });
});

describe('story never tunes in before a broadcast aired', () => {
  it('checked at every step of 1,000 chained Ch1 → Ch2 playthroughs', () => {
    const ic1 = indexChapter(CHAPTERS.ch1), ic2 = indexChapter(CHAPTERS.ch2);
    const refs = new Set<string>(); const bad: string[] = [];
    const check = (ch: typeof CHAPTERS.ch1) => (s: { node: string; day: number }) => {
      const n = getNode(ch.id === 'ch1' ? ic1 : ic2, s.node);
      const date = gameDate(ch, s.day);
      if (typeof n.broadcast === 'string') { refs.add(n.broadcast); if (!aired(n.broadcast, date, live)) bad.push(`${n.id} ${n.broadcast} @ ${date}`); }
      if (n.type === 'choice') n.options.forEach((o) => { if (o.broadcast) { refs.add(o.broadcast); if (!aired(o.broadcast, date, live)) bad.push(`${n.id} option ${o.broadcast} @ ${date}`); } });
    };
    for (let seed = 1; seed <= 1000; seed++) {
      const a = simulate(ic1, seed, 2000, 'random', undefined, check(CHAPTERS.ch1));
      simulate(ic2, seed, 3000, 'random', continueToChapter(ic2, a.state), check(CHAPTERS.ch2));
    }
    expect([...new Set(bad)]).toEqual([]);
    for (const r of refs) expect(live.broadcasts[r], r).toBeTruthy();
  });
});

import { mergeOverlay } from '../../radio/registry';
describe('local archive (unconfirmed rights)', () => {
  it('the committed public registry never contains local-only sources', () => {
    for (const b of Object.values(live.broadcasts)) for (const s of b.sources) expect(s.license.status).not.toBe('local-only');
  });
  it('public/local-archive is git-ignored', () => {
    expect(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')).toMatch(/^public\/local-archive\/$/m);
  });
  const overlay = { broadcasts: { news_1973_10_27: { sources: [
    { id: 'loc', type: 'archival', title: 't', sourceUrl: 'u', historicalDate: '1973-10-27', authenticity: 'unverified-archival', license: { status: 'local-only', label: 'Local only', holder: null, terms: null, verifiedBy: null, verifiedOn: null }, attribution: null, file: 'local-archive/x.mp3', transcript: [] },
    { id: 'bad', type: 'archival', title: 't', sourceUrl: 'u', historicalDate: null, authenticity: 'unverified-archival', license: { status: 'pending', label: 'p', holder: null, terms: null, verifiedBy: null, verifiedOn: null }, attribution: null, file: 'local-archive/y.mp3', transcript: [] },
  ] } } } as never;
  it('local-only recordings play only in the local build', () => {
    const merged = mergeOverlay(live, overlay);
    expect(playableSource('news_1973_10_27', merged, false)).toBeNull();                          // public build → silent
    expect(playableSource('news_1973_10_27', merged, true)?.id).toBe('loc');                  // local build → archive copy
  });
  it('overlay sources still marked pending are ignored, even with a file', () => {
    expect(mergeOverlay(live, overlay).broadcasts.news_1973_10_27.sources.some((s) => s.id === 'bad')).toBe(false);
  });
  it('date gating still applies to local recordings', () => {
    expect(aired('news_1973_10_27', '1973-11-03', mergeOverlay(live, overlay))).toBe(false);
  });
});
