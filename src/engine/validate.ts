import type { Chapter, Condition, Effect, StoryNode } from './types';
import { indexChapter } from './core';

/** Static checks on chapter content. Returns errors (blocking) and warnings. */
export function validateChapter(ch: Chapter, inherited: Iterable<string> = []): { errors: string[]; warnings: string[]; setFlags: Set<string> } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let ic;
  try { ic = indexChapter(ch); } catch (e) { return { errors: [(e as Error).message], warnings, setFlags: new Set<string>() }; }
  const ids = new Set(ch.nodes.map((n) => n.id));
  const need = (from: string, to: string | undefined, what: string) => {
    if (!to) errors.push(`${from}: missing ${what}`);
    else if (!ids.has(to)) errors.push(`${from}: ${what} → unknown node "${to}"`);
  };

  const setFlags = new Set<string>(['cooked', 'used_basket', 'meal_score', 'bed_done', ...inherited]);
  const usedFlags = new Map<string, string>();
  const addEffect = (e?: Effect) => {
    if (!e) return;
    Object.keys(e.flags ?? {}).forEach((f) => setFlags.add(f));
    Object.keys(e.inc ?? {}).forEach((f) => setFlags.add(f));
  };
  const addCond = (c: Condition | undefined, at: string) => {
    if (!c) return;
    if ('all' in c) c.all.forEach((x) => addCond(x, at));
    else if ('any' in c) c.any.forEach((x) => addCond(x, at));
    else if ('not' in c) addCond(c.not, at);
    else if ('flag' in c) usedFlags.set(c.flag, at);
    else if ('visited' in c && !ids.has(c.visited)) errors.push(`${at}: visited → unknown node ${c.visited}`);
  };

  for (const n of ch.nodes as StoryNode[]) {
    addEffect(n.effects);
    switch (n.type) {
      case 'line':
      case 'card':
        need(n.id, ic.nextOf.get(n.id), 'next');
        if (n.type === 'line') n.variants?.forEach((v) => addCond(v.if, n.id));
        break;
      case 'choice':
        if (!n.options.length) errors.push(`${n.id}: choice with no options`);
        n.options.forEach((o) => { need(n.id, o.goto, 'option.goto'); addEffect(o.effects); addCond(o.if, n.id); });
        if (!n.options.some((o) => !o.if && !o.once)) warnings.push(`${n.id}: every option is conditional/once – possible dead end`);
        break;
      case 'hub':
        need(n.id, n.exit, 'exit');
        addCond(n.exitWhen, n.id);
        n.ambient?.forEach((a) => addCond(a.if, n.id));
        n.hotspots.forEach((h) => { need(n.id, h.goto, `hotspot ${h.id}`); addEffect(h.effects); addCond(h.if, n.id); });
        n.events?.forEach((e) => { need(n.id, e.goto, `event ${e.id}`); addCond(e.if, n.id); });
        if (!n.exitWhen) warnings.push(`${n.id}: hub without exitWhen`);
        break;
      case 'branch':
        n.cases.forEach((c) => { need(n.id, c.goto, 'case.goto'); addCond(c.if, n.id); });
        need(n.id, ic.nextOf.get(n.id), 'else');
        break;
      case 'activity': {
        need(n.id, ic.nextOf.get(n.id), 'next');
        const p = n.params as { groups?: { id: string; options: { effects?: Effect; resolve?: { if: Condition }[] }[] }[] };
        p.groups?.forEach((g) => {
          setFlags.add(`bed_${g.id}`); setFlags.add(`bed_${g.id}_asked`);
          g.options.forEach((o) => { addEffect(o.effects); o.resolve?.forEach((r) => addCond(r.if, n.id)); });
        });
        if (n.activity === 'ball') ['ball_games', 'ball_best', 'ball_last', 'ball_high', 'knows_high', 'ball_stopped', 'ball_alone', 'ball_alone_caught',
          'ball_stairs', 'ball_count', 'ball_crossing', 'ball_wall', 'ball_bed'].forEach((f) => setFlags.add(f));
        if (n.activity === 'buttons') ['buttons_sessions', 'buttons_last_order', 'hoda_sorted', 'buttons_showed', 'buttons_fixed_quietly', 'hoda_caught_fatma', 'red_button', 'buttons_alone', 'buttons_left_wrong'].forEach((f) => setFlags.add(f));
        if (n.activity === 'dress') ['packed', 'packed_all', 'cl_yellow', 'cl_navy', 'c2_outfit', 'outfit', 'layer', 'ribbon', 'dressed_times', 'dress_insisted', 'warm_today', 'cold_today', 'sleeve_loose_today', 'mended_yellow', 'mended_navy'].forEach((f) => setFlags.add(f));
        addEffect((n.params as { effects?: Effect }).effects);
        if (n.activity === 'kitchen') {
          (n.params as { items: { id: string }[] }).items.forEach((i) => setFlags.add(`meal_${i.id}`));
        }
        break;
      }
      case 'end':
        n.memories?.forEach((m) => addCond(m.if, n.id));
        n.variants?.forEach((v) => addCond(v.if, n.id));
        break;
    }
  }
  for (const [f, at] of usedFlags) if (!setFlags.has(f)) errors.push(`${at}: flag "${f}" is read but never set`);
  return { errors, warnings, setFlags };
}
