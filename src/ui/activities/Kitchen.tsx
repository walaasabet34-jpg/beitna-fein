import { useState } from 'react';
import type { GameState, KitchenParams } from '../../engine/types';
import { kitchenCost, kitchenValid, resolveKitchen } from '../../engine/core';
import { useGame } from '../../store/gameStore';
import { piasters, arNum } from '../../util/ar';
import { play } from '../../audio/sfx';

const ICON: Record<string, string> = { bread: '🫓', rice: '🍚', lentil: '🥣', tomato: '🍅', egg: '🥚', potato: '🥔', cheese: '🧀', halawa: '🍯' };

export function Kitchen({ p, s }: { p: KitchenParams; s: GameState }) {
  const act = useGame((g) => g.act);
  const [picks, setPicks] = useState<string[]>([]);
  const cost = kitchenCost(p, picks);
  const ok = kitchenValid(p, s, picks);
  const toggle = (id: string) => {
    play('tick');
    setPicks((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= p.maxPicks ? cur : [...cur, id]);
  };
  const group = (src: 'pantry' | 'grocer', title: string, sub: string) => (
    <fieldset className="mb-3">
      <legend className="font-ruqaa text-lg text-rust">{title}</legend>
      <p className="text-xs text-ink/55 mb-2">{sub}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {p.items.filter((i) => i.source === src).map((i) => {
          const on = picks.includes(i.id);
          const tooMuch = !on && (picks.length >= p.maxPicks || cost + i.price > s.money);
          const liked = s.likes.includes(i.id);
          const disliked = s.dislikes.includes(i.id);
          return (
            <button key={i.id} data-kitchen-item={i.id} aria-pressed={on} disabled={tooMuch}
              onClick={() => toggle(i.id)}
              className={`rounded-xl border px-2 py-2 text-right transition-colors ${on ? 'bg-[#f6d9a8] border-rust' : 'bg-white/60 border-ink/15 hover:bg-white'} ${tooMuch ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-xl" aria-hidden="true">{ICON[i.id] ?? '•'}</span>
                <span className="text-xs text-ink/60">{i.price ? piasters(i.price) : 'في البيت'}</span>
              </div>
              <div className="text-[15px] text-ink mt-1">{i.label}</div>
              {liked && <div className="text-[11px] text-[#4f6f3a] mt-0.5">هدى قالت إنها بتحبه</div>}
              {disliked && <div className="text-[11px] text-rust mt-0.5">هدى مش بتحبه</div>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
  return (
    <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" data-activity="kitchen">
      <div className="font-ruqaa text-xl text-ink mb-1">المطبخ</div>
      <p className="text-sm text-ink/60 mb-3">اختاري لحد {arNum(p.maxPicks)} حاجات للوجبة. اللي من البقال بيتجاب بالسَّبَت، وبيتدفع من فلوسك.</p>
      {group('pantry', 'في البيت', 'ببلاش')}
      {group('grocer', 'من البقال', 'بالفلوس')}
      <div className="sticky -bottom-4 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-1 paper flex items-center justify-between gap-3 mt-2 border-t border-ink/10 pt-3 rounded-b-2xl">
        <div className="text-sm text-ink/70">
          {arNum(picks.length)}/{arNum(p.maxPicks)} · هتدفعي {piasters(cost)} · هيفضل معاكي {piasters(Math.max(0, s.money - cost))}
        </div>
        <button data-kitchen-confirm disabled={!ok}
          onClick={() => { play('boil'); act((ic, st) => resolveKitchen(ic, st, picks)); }}
          className="rounded-full px-5 py-2 bg-rust text-paper disabled:opacity-40 font-semibold">اطبخي</button>
      </div>
    </div>
  );
}
