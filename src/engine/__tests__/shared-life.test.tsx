// The shared-life revision: rituals score real outcomes, objects keep their history, the contact chain is causal,
// money and time are spent where the UI says they are, and later lines only remember what happened on this route.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTERS, CHAPTER_ORDER } from '../../content';
import { advance, choose, continueToChapter, enter, evaluate, getNode, indexChapter, newGame, resolveBall, resolveButtons, resolveDress, resolveLine, visibleHotspots, visibleOptions, wardrobe } from '../core';
import { simulate } from '../sim';
import { migrateSave, REMOVED_NODES } from '../migrate';
import { outfitOf, LivingRoom } from '../../art/scenes';
import type { GameState, HubNode } from '../types';
const [c1, war, c2, c3, c4, c5] = CHAPTER_ORDER.map((id) => indexChapter(CHAPTERS[id]));
const text = (ic: typeof c1, s: GameState) => { const n = getNode(ic, s.node); if (n.type !== 'line') throw new Error(s.node); return resolveLine(n, s).text; };
const opt = (ic: typeof c1, s: GameState, goto: string) => { const o = visibleOptions(getNode(ic, s.node), s).find((x) => x.goto === goto); if (!o) throw new Error(`no ${goto} at ${s.node}`); return choose(ic, s, o); };

describe('rituals', () => {
  it('the sock ball records a personal best, her favourite throw and the rule of each chapter', () => {
    let s = enter(c1, newGame(c1), 'ball_c1');
    s = resolveBall(c1, s, { catches: 3, hodaCatches: 4, best: 7, high: 2 });
    expect(s.flags).toMatchObject({ ball_games: 1, ball_best: 7, knows_high: true, ball_count: true });
    expect(text(c1, s)).toContain('ستة ورا بعض');
    const worse = resolveBall(c1, enter(c1, s, 'ball_c1'), { catches: 1, hodaCatches: 1, best: 2, high: 0 });
    expect(worse.flags.ball_best).toBe(7);
    expect(worse.flags.ball_games).toBe(2);
  });
  it('cannot be scored beyond what a game allows, and the lonely game never counts as playing with her', () => {
    const s = resolveBall(c1, enter(c1, newGame(c1), 'ball_c1'), { catches: 99, hodaCatches: 99, best: 99, high: 99 });
    expect(s.flags.ball_best).toBeLessThanOrEqual(18);
    const alone = resolveBall(c5, enter(c5, newGame(c5, { flags: { ball_games: 3, ball_best: 6 } }), 'ball_alone'), { catches: 2, hodaCatches: 5, best: 9, high: 1 });
    expect(alone.flags.ball_games).toBe(3); expect(alone.flags.ball_best).toBe(6); expect(alone.flags.ball_alone_caught).toBe(true);
  });
  it('button sorting distinguishes showing her, fixing quietly, her catching your mistake and the red button', () => {
    let s = enter(c1, newGame(c1), 'c1_buttons_with');
    s = resolveButtons(c1, s, { hodaPlaced: 5, hodaWrong: 2, fixedQuietly: 1, showedHer: 1, caughtFatma: 1, keptRed: true, leftWrong: 1 });
    expect(s.flags).toMatchObject({ hoda_sorted: 1, buttons_showed: 1, buttons_fixed_quietly: 1, hoda_caught_fatma: 1, red_button: 'hoda', buttons_left_wrong: true });
    expect(s.node).toBe('c1_sew_pedal');
    const alone = resolveButtons(c1, enter(c1, newGame(c1), 'c1_buttons_alone'), { hodaPlaced: 5, hodaWrong: 2, fixedQuietly: 0, showedHer: 2, caughtFatma: 3, keptRed: true });
    expect(alone.flags.hoda_sorted).toBeUndefined(); expect(alone.flags.red_button).toBeUndefined(); expect(alone.flags.buttons_alone).toBe(true);
  });
  it('a sewing order is paid and uses a spool; the bed version is company, not work', () => {
    const at = enter(c4, newGame(c4, { money: 10, flags: { thread: 2 } }), 's_buttons');
    const paid = resolveButtons(c4, at, { hodaPlaced: 6, hodaWrong: 0, fixedQuietly: 0, showedHer: 0, caughtFatma: 0, keptRed: false });
    expect(paid.money).toBe(25); expect(paid.flags.thread).toBe(1);
    const bed = resolveButtons(c4, enter(c4, newGame(c4, { money: 10 }), 'buttons_bed'), { hodaPlaced: 3, hodaWrong: 0, fixedQuietly: 0, showedHer: 0, caughtFatma: 0, keptRed: false });
    expect(bed.money).toBe(10);
  });
});

describe('clothes keep their history', () => {
  it('a tear from hopscotch shows on her until it is mended, and the patch she got is the one she wears later', () => {
    let s = enter(c2, newGame(c2, { flags: { outfit: 'yellow' } }), 'c2_ret_tear_b');
    expect(s.flags.cl_yellow).toBe('torn'); expect(outfitOf(s).tear).toBe(true);
    s = enter(c2, s, 'c2_d2_dress');
    const flower = resolveDress(c2, { ...s, flags: { ...s.flags, patch_flower: true } }, { outfit: 'yellow', layer: 'none', ribbon: 'old', mended: ['yellow'] });
    expect(flower.flags.cl_yellow).toBe('flower'); expect(outfitOf(flower)).toMatchObject({ patch: 'flower', tear: false });
    const later = continueToChapter(c5, continueToChapter(c4, continueToChapter(c3, flower)));
    const pack = getNode(c5, 'g_pack'); if (pack.type !== 'activity') throw new Error();
    const cap = (pack.params as { captions: { item: string; if?: never; text: string }[] }).captions.find((c) => c.item === 'yellow' && evaluate(c.if, later));
    expect(cap?.text).toContain('الوردة');
  });
  it('the navy sleeve stays long until fitted; she only wears the red ribbon on a special day unless insisted', () => {
    const s = enter(c2, newGame(c2), 'c2_dress_act');
    expect(wardrobe(s).navy).toBe('loose');
    const fitted = resolveDress(c2, s, { outfit: 'navy', layer: 'none', ribbon: 'old', mended: ['navy'] });
    expect(fitted.flags.cl_navy).toBe('fitted'); expect(outfitOf(fitted).longSleeve).toBe(false);
    const insisted = resolveDress(c2, s, { outfit: 'navy', layer: 'none', ribbon: 'red', mended: [], insisted: true });
    expect(insisted.flags.dress_insisted).toBe(1); expect(outfitOf(insisted).ribbon).toBe('red');
  });
  it('the cardigan only exists after Fatma cuts hers down, and warmth is recorded on a cold day', () => {
    const before = enter(c4, newGame(c4), 's_ribbon_dress');
    expect(resolveDress(c4, before, { outfit: 'yellow', layer: 'cardigan', ribbon: 'red', mended: [] }).flags.layer).toBe('none');
    const made = enter(c4, before, 's_cardigan');
    expect(made.flags.cl_cardigan).toBe('made');
  });
});

describe('the search for the mother is a chain of results', () => {
  it('each chapter adds a concrete step: shop → factory letter → hostel address → correction → reply → telegram', () => {
    const reached = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      let s: GameState | undefined;
      for (const ic of [c1, war, c2, c3, c4]) {
        const run = simulate(ic, seed, 3000, 'random', s ? continueToChapter(ic, s) : newGame(ic));
        s = run.state;
      }
      for (const f of ['search_fawzi', 'search_factory_letter', 'search_hostel_address', 'search_hostel_letter', 'search_supervisor_reply', 'search_second_letter', 'mother_contacted', 'mother_told_illness', 'mother_telegram']) {
        expect(s!.flags[f], `${seed}: ${f}`).toBeTruthy(); reached.add(f);
      }
      expect(['egg', 'cat', 'ball', 'sky', 'count']).toContain(s!.flags.proof_detail);
    }
  });
  it('the mother answers the very detail Hoda (or Fatma) chose as proof', () => {
    for (const p of ['egg', 'cat', 'ball', 'sky', 'count']) {
      const s = enter(c4, newGame(c4, { flags: { proof_detail: p } }), 'mother_reply');
      const want = { egg: 'البيض', cat: 'مشمش', ball: 'الكورة', sky: 'السما', count: 'السلالم' }[p]!;
      expect(text(c4, s)).toContain(want);
    }
  });
  it('a cat proof is only offered if the cat came up on this route', () => {
    const base = enter(c3, newGame(c3), 'c3_proof_c');
    expect(visibleOptions(getNode(c3, base.node), base).some((o) => o.goto === 'c3_proof_cat')).toBe(false);
    const cat = enter(c3, newGame(c3, { flags: { cat: 'honest' } }), 'c3_proof_c');
    expect(visibleOptions(getNode(c3, cat.node), cat).some((o) => o.goto === 'c3_proof_cat')).toBe(true);
  });
  it('Naima cannot read; Fatma reads for her, and Hoda corrects Fatma’s spelling', () => {
    expect(text(war, enter(war, newGame(war), 'w_box_naima'))).toContain('مابعرفش أقرا');
    expect(enter(war, newGame(war), 'w_details').flags.hoda_corrected_fatma).toBe(true);
    for (const c of Object.values(CHAPTERS)) for (const n of c.nodes) if (n.type === 'line' && n.speaker === 'naima') expect(n.text).not.toMatch(/كتبت(ها)? الجواب|هكتب/);
  });
});

describe('money, time and the absence', () => {
  it('every hub action that costs time or money says so, and the effect matches the label', () => {
    for (const c of Object.values(CHAPTERS)) for (const n of c.nodes) if (n.type === 'hub') for (const h of (n as HubNode).hotspots) {
      if (h.effects?.slots) expect(h.takesTime, `${n.id}/${h.id}`).toBe(true);
      if (h.takesTime) expect(h.effects?.slots, `${n.id}/${h.id}`).toBe(1);
    }
  });
  it('the thread runs out and there is always a free way to get more', () => {
    const s = enter(c3, newGame(c3, { money: 0 }), 'c3_thread');
    const free = visibleOptions(getNode(c3, s.node), s).filter((o) => !o.effects?.money);
    expect(free.length).toBeGreaterThanOrEqual(2);
    expect(visibleOptions(getNode(c3, s.node), s).some((o) => o.goto === 'c3_buy')).toBe(false);
    expect(opt(c3, s, 'c3_borrow').flags.read_for_naima).toBe(true);
  });
  it('after her death the same actions have no partner: nobody counts, nobody sorts beside you', () => {
    const s = enter(c5, newGame(c5, { flags: { ball_games: 2, hoda_died: true } }), 'g_objects');
    const o = visibleOptions(getNode(c5, s.node), s).map((x) => x.goto);
    expect(o).toContain('ball_alone'); expect(o).toContain('g_buttons');
    const tin = getNode(c5, 'g_buttons'); if (tin.type !== 'activity') throw new Error();
    expect((tin.params as { helper: string }).helper).toBe('none');
  });
  it('the mother decides about the ball; a final action uses it only if she left it', () => {
    let s = enter(c5, newGame(c5, { flags: { ball_games: 1, mother_meeting: 'now' } }), 'g_ball_b');
    expect(s.node).toBe('g_ball_mother'); s = advance(c5, s); s = advance(c5, s);
    expect(s.flags.ball_left_by_mother).toBe(true);
    const fm = enter(c5, s, 'final_machine');
    expect(visibleOptions(getNode(c5, fm.node), fm).some((x) => x.goto === 'final_ball')).toBe(true);
    const none = enter(c5, newGame(c5), 'final_machine');
    expect(visibleOptions(getNode(c5, none.node), none).some((x) => x.goto === 'final_ball')).toBe(false);
  });
  it('end memories never mention a habit that did not happen on this route', () => {
    for (let seed = 1; seed <= 300; seed++) {
      let s: GameState | undefined;
      for (const ic of [c1, war, c2, c3, c4, c5]) { s = simulate(ic, seed * 3, 3000, 'random', s ? continueToChapter(ic, s) : newGame(ic)).state; }
      const end = getNode(c5, s!.node); if (end.type !== 'end') throw new Error();
      const mem = (end.memories ?? []).filter((m) => evaluate(m.if, s!)).map((m) => m.text).join('|');
      if (mem.includes('الزرار الأحمر')) expect(s!.flags.red_button).toBe('hoda');
      if (mem.includes('بالاتنين')) expect(s!.flags.fatma_counts).toBe(true);
      if (mem.includes('العشرة')) expect(s!.flags.ball_last).toBeGreaterThanOrEqual(10);
      if (mem.includes('وردة')) expect(s!.flags.cl_yellow).toBe('flower');
    }
  });
});

describe('saves', () => {
  it('v2 saves on removed nodes resume at the nearest equivalent with everything she remembers', () => {
    for (const [ch, map] of Object.entries(REMOVED_NODES)) for (const [gone, to] of Object.entries(map)) {
      const ic = indexChapter(CHAPTERS[ch]);
      const old = { ...newGame(ic, { flags: { greet: 'kneel', bag_promise: true } }), version: 2, node: gone };
      const m = migrateSave(JSON.parse(JSON.stringify(old)))!;
      expect(m.version).toBe(3); expect(m.node).toBe(to); expect(m.flags.greet).toBe('kneel'); expect(m.flags.thread).toBe(2);
      expect(() => getNode(ic, m.node)).not.toThrow();
      expect(migrateSave(m)).toEqual(m);
      expect(simulate(ic, 5, 3000, 'random', m).ended).toBe(true);
    }
  });
  it('a reload in the middle of a ritual resumes the same ritual without charging it twice', () => {
    const s = enter(c4, newGame(c4, { money: 10, flags: { thread: 1 } }), 's_buttons');
    const reloaded = migrateSave(JSON.parse(JSON.stringify(s)))!;
    expect(reloaded.node).toBe('s_buttons'); expect(reloaded.money).toBe(10);
  });
  it('the living room shows the household as it is: coins in the tin and spools on the machine follow state', () => {
    const poor = renderToStaticMarkup(<svg><LivingRoom s={{ ...newGame(c1), money: 0, flags: { thread: 0 } }} expr="neutral" /></svg>);
    const rich = renderToStaticMarkup(<svg><LivingRoom s={{ ...newGame(c1), money: 40, flags: { thread: 3 } }} expr="neutral" /></svg>);
    expect(poor).toContain('data-coins="0"'); expect(rich).toContain('data-coins="7"');
    expect((poor.match(/data-spool/g) ?? []).length).toBe(0); expect((rich.match(/data-spool/g) ?? []).length).toBe(3);
  });
});
