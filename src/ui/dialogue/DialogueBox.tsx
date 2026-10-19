import { useEffect, useRef, useState } from 'react';
import type { Expr } from '../../engine/types';
import { CHARACTERS } from '../../content';
import { HodaPortrait } from '../../art/Hoda';
import { useGame } from '../../store/gameStore';

const SPEED = { slow: 45, normal: 24, instant: 0 } as const;

export function DialogueBox({ speaker, text, expr, onNext, nodeId, outfit }:
  { speaker: string; text: string; expr?: Expr; onNext: () => void; nodeId: string; outfit?: 'mustard' | 'navy' }) {
  const speed = useGame((g) => SPEED[g.settings.textSpeed]);
  const [shown, setShown] = useState(speed === 0 ? text.length : 0);
  const done = shown >= text.length;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => { setShown(speed === 0 ? text.length : 0); }, [text, nodeId, speed]);
  useEffect(() => {
    if (done || speed === 0) return;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + (text[n] === ' ' ? 2 : 1))), speed);
    return () => clearTimeout(t);
  }, [shown, done, speed, text]);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [nodeId]);

  const ch = CHARACTERS[speaker];
  const narrator = speaker === 'narrator';
  const isHoda = speaker === 'hoda';
  const click = () => (done ? onNext() : setShown(text.length));

  return (
    <button
      ref={ref}
      data-advance
      data-node={nodeId}
      onClick={click}
      className="paper paper-edge relative w-full text-right rounded-2xl px-4 sm:px-6 pt-4 pb-6 min-h-[132px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#e2b35c] fade-in"
      aria-label={done ? 'كمّلي' : 'اظهري الكلام كله'}
    >
      <div className="flex gap-3 items-start">
        {isHoda && (
          <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden ring-2 ring-[#b8862e]/60 -mt-10 bg-[#e8d6b6] shadow-lg">
            <HodaPortrait expr={expr ?? 'neutral'} outfit={outfit} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {!narrator && ch?.name && (
            <div className="font-ruqaa text-lg sm:text-xl mb-0.5" style={{ color: ch.color }}>{ch.name}</div>
          )}
          <p className={`text-[17px] sm:text-[19px] leading-[1.95] ${narrator ? 'text-[#4a392c]' : 'text-ink'}`} aria-hidden="true">
            {text.slice(0, shown)}
            <span className="opacity-0">{text.slice(shown)}</span>
          </p>
          <p className="sr-only" aria-live="polite">{(!narrator && ch?.name ? ch.name + ': ' : '') + text}</p>
        </div>
      </div>
      <span className={`absolute bottom-2 left-4 text-rust text-sm ${done ? 'caret' : 'opacity-0'}`} aria-hidden="true">▼ كمّلي</span>
    </button>
  );
}
