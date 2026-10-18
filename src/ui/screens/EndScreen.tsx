import type { EndNode, GameState } from '../../engine/types';
import { evaluate } from '../../engine/core';
import { useGame } from '../../store/gameStore';

export function EndScreen({ node, s }: { node: EndNode; s: GameState }) {
  const toTitle = useGame((g) => g.toTitle);
  const restart = useGame((g) => g.restartChapter);
  const text = node.variants?.find((v) => evaluate(v.if, s))?.text ?? node.text;
  const memories = (node.memories ?? []).filter((m) => evaluate(m.if, s));
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-[#120e0b]/95 scene-fade" data-screen="end">
      <div className="min-h-full grid place-items-center p-4">
        <div className="paper paper-edge rounded-2xl max-w-xl w-full p-6 sm:p-8">
          <h2 className="font-ruqaa text-3xl sm:text-4xl text-ink mb-4">{node.title}</h2>
          <p className="text-[18px] leading-9 text-ink mb-6">{text}</p>
          {memories.length > 0 && (
            <>
              <div className="font-ruqaa text-xl text-rust mb-2">حاجات فضلت من الليلة دي</div>
              <ul className="space-y-1.5 mb-6">
                {memories.map((m, i) => <li key={i} className="text-[16px] text-[#4a392c] leading-8 flex gap-2"><span aria-hidden="true">✦</span>{m.text}</li>)}
              </ul>
            </>
          )}
          {node.nextChapterTitle && <p className="text-sm text-ink/55 mb-6">{node.nextChapterTitle}</p>}
          <div className="flex flex-wrap gap-2 justify-end">
            <button className="rounded-full px-5 py-2 border border-ink/25 text-ink hover:bg-white/60" onClick={restart} data-restart>العبي الفصل من الأول</button>
            <button className="rounded-full px-5 py-2 bg-rust text-paper font-semibold" onClick={toTitle} data-to-title>الشاشة الرئيسية</button>
          </div>
        </div>
      </div>
    </div>
  );
}
