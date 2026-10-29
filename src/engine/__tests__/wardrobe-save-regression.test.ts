import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAPTERS, CHAPTER_ORDER } from '../../content';
import { outfitOf } from '../../art/scenes';
import { useGame } from '../../store/gameStore';
import { canMend, continueToChapter, enter, evaluate, getNode, indexChapter, newGame, resolveButtons, resolveDress, wardrobe } from '../core';
import { migrateSave } from '../migrate';
import { loadGame } from '../save';
import { simulate } from '../sim';
import type { Condition, GameState } from '../types';

vi.mock('../../audio/sfx', () => ({ play: vi.fn(), setPrefs: vi.fn() }));

const school = indexChapter(CHAPTERS.ch2);
const last = indexChapter(CHAPTERS.ch5);
const legacy = (s: GameState, version = 2): GameState => {
  const flags = { ...s.flags };
  delete flags.thread;
  return { ...s, version, flags };
};

describe('navy uniform regression', () => {
  it.each([false, true])('keeps the chosen outfit and sleeve history through reload and packing (mended=%s)', (mended) => {
    const start = enter(school, newGame(school), 'c2_dress_act');
    const dressed = resolveDress(school, start, { outfit: 'navy', layer: 'none', ribbon: 'old', mended: mended ? ['navy'] : [] });
    expect(dressed.flags.c2_outfit).toBe('navy');
    expect(dressed.flags.outfit).toBe('navy');
    expect(dressed.flags.sleeve_loose_today).toBe(mended ? undefined : true);
    const reloaded = migrateSave(JSON.parse(JSON.stringify(dressed)))!;
    expect(reloaded).toEqual(dressed);
    let s = reloaded;
    for (const id of ['ch3', 'ch4', 'ch5']) {
      s = continueToChapter(indexChapter(CHAPTERS[id]), s);
      expect(wardrobe(s).navy).toBe(mended ? 'fitted' : 'loose');
      expect(outfitOf(s).longSleeve).toBe(!mended);
      expect(canMend(s, 'navy')).toBe(!mended);
    }
    const pack = getNode(last, 'g_pack');
    if (pack.type !== 'activity') throw new Error('Expected packing activity');
    const captions = (pack.params as { captions: { item: string; if?: Condition; text: string }[] }).captions;
    const caption = captions.find((c) => c.item === 'navy' && evaluate(c.if, s));
    expect(caption?.text).toContain(mended ? 'قصّرت' : 'طويل');
  });

  it('does not treat the legacy outfit choice as mending evidence', () => {
    const old = legacy(newGame(school, { flags: { c2_outfit: 'navy' } }));
    const s = migrateSave(old)!;
    expect(outfitOf(s).longSleeve).toBe(true);
    expect(canMend(s, 'navy')).toBe(true);
    expect(s.flags.c2_outfit).toBe('navy');
  });
});

describe('legacy chapter restart regression', () => {
  beforeEach(() => {
    const entries = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => { entries.set(key, value); },
      removeItem: (key: string) => { entries.delete(key); },
    });
  });
  afterEach(() => {
    useGame.setState({ state: null, screen: 'title', menuOpen: false, hasSave: false });
    vi.unstubAllGlobals();
  });

  it.each(CHAPTER_ORDER.slice(1))('loads a v2 save and immediately restarts %s with migrated entry state', (id) => {
    const ic = indexChapter(CHAPTERS[id]);
    const snapshot = legacy(newGame(ic, { money: 37, flags: { greet: 'kneel', c2_outfit: 'navy', proof_detail: 'egg' } }));
    const old = { ...snapshot, money: 7, flags: { ...snapshot.flags, proof_detail: 'sky' }, chapterStart: snapshot };
    const serialized = JSON.stringify(old);
    localStorage.setItem('beitna-fein:save', serialized);
    useGame.getState().continueGame();
    expect(useGame.getState().state!.chapterStart!.version).toBe(3);
    expect(useGame.getState().state!.flags.proof_detail).toBe('sky');
    useGame.getState().restartChapter();
    const restarted = useGame.getState().state!;
    expect(restarted).toEqual(migrateSave(snapshot));
    expect(restarted.flags).toMatchObject({ thread: 2, greet: 'kneel', c2_outfit: 'navy', proof_detail: 'egg' });
    expect(restarted.money).toBe(37);
    expect(loadGame()).toEqual(expect.objectContaining(JSON.parse(JSON.stringify(restarted))));
    expect(JSON.stringify(old)).toBe(serialized);
    expect(simulate(ic, 5, 3000, 'random', restarted).ended).toBe(true);

    if (id === 'ch4') {
      useGame.getState().act((chapter, s) => enter(chapter, s, 's_buttons'));
      useGame.getState().act((chapter, s) => resolveButtons(chapter, s, {
        hodaPlaced: 6, hodaWrong: 0, fixedQuietly: 0, showedHer: 0, caughtFatma: 0, keptRed: false,
      }));
      expect(useGame.getState().state!.flags.thread).toBe(1);
      expect(useGame.getState().state!.money).toBe(52);
    }
  });

  it('upgrades nested v1 snapshots and remaps their removed nodes without mutating input', () => {
    const snapshot = { ...legacy(newGame(school), 1), node: 'c2_day2_home', slot: 5 };
    const old = { ...newGame(school), chapterStart: snapshot };
    const original = JSON.stringify(old);
    const migrated = migrateSave(old)!;
    expect(migrated.chapterStart).toMatchObject({ version: 3, node: 'c2_day2_empty', slot: 4, flags: { thread: 2 }, completed: [] });
    expect(migrateSave(migrated)).toEqual(migrated);
    expect(JSON.stringify(old)).toBe(original);
  });

  it('preserves explicit spool and mending state independently in both snapshots', () => {
    const snapshot = { ...newGame(school, { flags: { thread: 0, cl_navy: 'fitted' } }), version: 2 };
    const old = { ...newGame(school, { flags: { thread: 1, c2_outfit: 'yellow' } }), version: 2, chapterStart: snapshot };
    const migrated = migrateSave(old)!;
    expect(migrated.flags).toEqual(old.flags);
    expect(migrated.chapterStart!.flags).toEqual(snapshot.flags);
    expect(migrated.chapterStart!.version).toBe(3);
    expect(migrateSave(migrated)).toEqual(migrated);
  });
});
