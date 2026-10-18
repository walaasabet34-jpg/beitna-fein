import type { GameState, Chapter } from '../../engine/types';
import { piasters } from '../../util/ar';
import { useGame } from '../../store/gameStore';

function SunIcon({ slot }: { slot: number }) {
  const night = slot >= 4;
  const angle = Math.PI * (1 - (Math.min(slot, 3) + 0.5) / 4);
  return (
    <svg viewBox="0 0 40 24" className="w-6 h-4 sm:w-8 sm:h-5 shrink-0" aria-hidden="true">
      <path d="M2 22 A18 18 0 0 1 38 22" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      {night
        ? <path d="M24 6 a7 7 0 1 0 6 10 a6 6 0 1 1 -6 -10z" fill="#e8dcb8" />
        : <circle cx={20 + Math.cos(angle) * 17} cy={22 - Math.sin(angle) * 17} r="4" fill="#f0c27a" />}
    </svg>
  );
}

export function Hud({ s, chapter }: { s: GameState; chapter: Chapter }) {
  const setMenu = useGame((g) => g.setMenu);
  const settings = useGame((g) => g.settings);
  const update = useGame((g) => g.updateSettings);
  return (
    <div className="absolute top-0 inset-x-0 p-2 sm:p-3 flex items-start justify-between gap-2 pointer-events-none">
      <div className="ui-btn flex items-center gap-1.5 pointer-events-auto whitespace-nowrap min-w-0 text-xs sm:text-sm" aria-live="polite" data-testid="clock">
        <SunIcon slot={s.slot} />
        <span className="truncate">{chapter.dayNames[s.day] ?? ''} · {chapter.slotNames[s.slot]}</span>
      </div>
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="ui-btn whitespace-nowrap text-xs sm:text-sm" title="الفلوس اللي معاكي" data-testid="money">
          <span aria-hidden="true">🪙 </span>{piasters(s.money)}
        </div>
        <button className="ui-btn" aria-pressed={settings.sound} aria-label={settings.sound ? 'اقفلي الصوت' : 'شغّلي الصوت'} onClick={() => update({ sound: !settings.sound })}>
          {settings.sound ? '🔈' : '🔇'}
        </button>
        <button className="ui-btn" aria-label="القايمة" data-menu onClick={() => setMenu(true)}>☰</button>
      </div>
    </div>
  );
}
