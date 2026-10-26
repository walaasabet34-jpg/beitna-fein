import type { GameState, HubNode } from '../engine/types';
import { visibleHotspots, ambientLine, NIGHT_SLOT } from '../engine/core';
import { useGame } from '../store/gameStore';
import { applyHotspot } from './scene/Stage';
import { useUiSfx } from './useUiSfx';
import { arNum, costBadge } from '../util/ar';

export function HubPanel({ node, s }: { node: HubNode; s: GameState }) {
  const act = useGame((g) => g.act);
  const tick = useUiSfx();
  const spots = visibleHotspots(node, s);
  const ambient = ambientLine(node, s);
  // Periods left before this hub ends: its own slot limit if it has one (e.g. Hoda back at العصر), else night.
  const ex = node.exitWhen as { slot?: { gte?: number } } | undefined;
  const left = Math.max(0, (ex?.slot?.gte ?? NIGHT_SLOT) - s.slot);
  const timed = spots.some((h) => h.takesTime);
  return (
    <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" data-hub={node.id}>
      {ambient && <p className="text-[16px] sm:text-[17px] leading-8 text-[#4a392c] mb-1" aria-live="polite">{ambient}</p>}
      <p className="text-sm text-ink/60 mb-3">
        {node.hint}
        {timed && <> <span className="whitespace-nowrap">— فاضل وقت لـ <b className="text-rust">{arNum(left)}</b> {left === 1 ? 'حاجة' : 'حاجات'}.</span></>}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {spots.map((h) => (
          <button
            key={h.id}
            className="choice-btn flex flex-col items-start justify-between gap-1 !py-2 !px-3"
            data-hotspot={h.id}
            onClick={() => { tick(); act((ic, st) => applyHotspot(ic, st, node, h.id)); }}
          >
            <span className="text-[15px] leading-6">{h.label}</span>
            {(h.takesTime || costBadge(h.effects)) && <span className="text-xs px-2 py-0.5 rounded-full bg-rust/10 text-rust shrink-0" data-cost>{costBadge({ slots: h.takesTime ? 1 : 0, money: h.effects?.money })}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
