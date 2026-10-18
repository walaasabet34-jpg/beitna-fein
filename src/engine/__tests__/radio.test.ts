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
  it('archival recordings: none cleared, none bundled, all labelled "Pending rights clearance"', () => {
    for (const b of Object.values(live.broadcasts)) for (const s of b.sources.filter((x) => x.type === 'archival')) {
      expect(s.license.status).toBe('pending');
      expect(s.license.label).toBe('Pending rights clearance');
      expect(s.file).toBeNull();
    }
    const radioDir = fs.readdirSync(path.join(root, 'public/radio'));
    expect(radioDir.filter((f) => !f.startsWith('ph_') && f !== 'registry.json')).toEqual([]);
  });
  it('a pending archival source is never chosen for playback', () => {
    for (const id of Object.keys(live.broadcasts)) {
      const s = playableSource(id, live);
      if (s) { expect(s.license.status).toBe('cleared'); expect(s.type).not.toBe('archival'); }
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
