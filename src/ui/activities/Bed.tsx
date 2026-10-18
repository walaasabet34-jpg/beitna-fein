import { useState } from 'react';
import type { BedParams } from '../../engine/types';
import { resolveBed } from '../../engine/core';
import { useGame } from '../../store/gameStore';
import { play } from '../../audio/sfx';

export function Bed({ p }: { p: BedParams }) {
  const act = useGame((g) => g.act);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const complete = p.groups.every((g) => picks[g.id]);
  return (
    <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" data-activity="bed">
      <div className="font-ruqaa text-xl text-ink mb-1">مكان النوم</div>
      <p className="text-sm text-ink/60 mb-3">جهّزي المكان اللي هدى هتبات فيه أول ليلة.</p>
      <div className="flex flex-col gap-3">
        {p.groups.map((g) => (
          <fieldset key={g.id}>
            <legend className="font-ruqaa text-lg text-rust mb-1">{g.label}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={g.label}>
              {g.options.map((o) => {
                const on = picks[g.id] === o.id;
                return (
                  <button key={o.id} role="radio" aria-checked={on} data-bed-option={`${g.id}:${o.id}`}
                    onClick={() => { play('tick'); setPicks((c) => ({ ...c, [g.id]: o.id })); }}
                    className={`rounded-full border px-3 py-1.5 text-[15px] transition-colors ${on ? 'bg-[#f6d9a8] border-rust text-ink' : 'bg-white/60 border-ink/15 text-ink hover:bg-white'}`}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="sticky -bottom-4 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-1 paper flex justify-end mt-4 border-t border-ink/10 pt-3 rounded-b-2xl">
        <button data-bed-confirm disabled={!complete} onClick={() => act((ic, st) => resolveBed(ic, st, picks))}
          className="rounded-full px-5 py-2 bg-rust text-paper disabled:opacity-40 font-semibold">جهّزي المكان</button>
      </div>
    </div>
  );
}
