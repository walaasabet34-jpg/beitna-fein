import { useEffect, useRef } from 'react';

export function CardScreen({ title, subtitle, onNext, nodeId }: { title: string; subtitle?: string; onNext: () => void; nodeId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [nodeId]);
  return (
    <button ref={ref} data-advance data-node={nodeId} onClick={onNext}
      className="fixed inset-0 z-30 grid place-items-center bg-[#120e0b] text-paper scene-fade focus-visible:outline-none"
      aria-label={`${title}. ${subtitle ?? ''}. كمّلي`}>
      <div className="text-center px-6">
        <div className="text-paper/50 text-sm tracking-widest mb-3">· · ·</div>
        <h2 className="font-ruqaa text-4xl sm:text-6xl mb-3">{title}</h2>
        {subtitle && <p className="font-ruqaa text-2xl sm:text-3xl text-[#e2b35c]">{subtitle}</p>}
        <p className="mt-10 text-sm text-paper/45 caret">المسي عشان تكمّلي</p>
      </div>
    </button>
  );
}
