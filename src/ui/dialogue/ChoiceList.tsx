import { useEffect, useRef } from 'react';
import { arNum } from '../../util/ar';
import { CHARACTERS } from '../../content';

export interface ChoiceItem { key: string; text: string; badge?: string; testid?: string }

export function ChoiceList({ prompt, context, items, onPick, nodeId }:
  { prompt?: string; context?: { speaker: string; text: string }; items: ChoiceItem[]; onPick: (i: number) => void; nodeId: string }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus({ preventScroll: true }); }, [nodeId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= items.length) { e.preventDefault(); onPick(n - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onPick]);
  return (
    <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" role="group" aria-label={prompt ?? 'اختاري'}>
      {context && (
        <p className="px-1 mb-2 text-[16px] leading-8 text-[#4a392c]">
          {context.speaker !== 'narrator' && <b className="font-ruqaa text-lg ml-1" style={{ color: CHARACTERS[context.speaker]?.color }}>{CHARACTERS[context.speaker]?.name}:</b>}
          {context.text}
        </p>
      )}
      {prompt && <div className="font-ruqaa text-lg sm:text-xl text-rust mb-2 px-1">{prompt}</div>}
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <button key={it.key} ref={i === 0 ? first : undefined} className="choice-btn flex items-start gap-3" data-choice={i} data-testid={it.testid} onClick={() => onPick(i)}>
            <span className="shrink-0 mt-1 w-6 h-6 rounded-full grid place-items-center text-xs bg-ink/10 text-ink/70" aria-hidden="true">{arNum(i + 1)}</span>
            <span className="flex-1 text-[16px] sm:text-[17px]">{it.text}</span>
            {it.badge && <span className="shrink-0 text-xs mt-1.5 px-2 py-0.5 rounded-full bg-rust/10 text-rust">{it.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
