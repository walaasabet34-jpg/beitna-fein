import { useEffect, useState } from 'react';
import { setLoop } from '../../audio/engine';
import { useGame } from '../../store/gameStore';
import { loadGame } from '../../engine/save';
import { CHAPTERS } from '../../content';
import { ArtDefs, LivingRoom } from '../../art/scenes';
import { newGame, indexChapter } from '../../engine/core';

const preview = (() => { const s = newGame(indexChapter(CHAPTERS.ch1)); return { ...s, slot: 3, scene: 'living' }; })();

export function TitleScreen() {
  const { startNew, continueGame, hasSave } = useGame();
  const [confirm, setConfirm] = useState(false);
  // Gentle theme on the title (starts only once the player has tapped something).
  useEffect(() => { setLoop('music', 'music_title'); setLoop('ambience', 'amb_night'); }, []);
  const save = hasSave ? loadGame() : null;
  const ch = save ? CHAPTERS[save.chapter] : null;
  return (
    <div className="fixed inset-0 overflow-hidden" data-screen="title">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full scale-105 blur-[2px] opacity-70" aria-hidden="true">
        <ArtDefs /><LivingRoom s={preview} expr="neutral" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-[#120e0b]/95" />
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 gap-6">
        <div>
          <h1 className="font-ruqaa text-6xl sm:text-8xl text-paper drop-shadow-[0_4px_20px_rgba(0,0,0,.6)]">بيتنا فين؟</h1>
          <p className="mt-3 text-paper/75 text-lg">القاهرة · ١٩٧٣</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {save && ch && (
            <button className="rounded-full px-6 py-3 bg-rust text-paper font-semibold text-lg shadow-lg" onClick={continueGame} data-continue>
              كمّلي
              <span className="block text-xs font-normal opacity-80">{ch.title} · {ch.dayNames[save.day]} · {ch.slotNames[save.slot]}</span>
            </button>
          )}
          {!confirm ? (
            <button className={`rounded-full px-6 py-3 font-semibold text-lg ${save ? 'border border-paper/40 text-paper' : 'bg-rust text-paper shadow-lg'}`}
              onClick={() => (save ? setConfirm(true) : startNew())} data-new-game>
              لعبة جديدة
            </button>
          ) : (
            <div className="rounded-2xl bg-black/50 p-3 text-paper text-sm">
              <p className="mb-2">الحفظ القديم هيتمسح.</p>
              <div className="flex gap-2 justify-center">
                <button className="rounded-full px-4 py-1.5 bg-rust" onClick={startNew} data-confirm-new>ابدئي</button>
                <button className="rounded-full px-4 py-1.5 border border-paper/40" onClick={() => setConfirm(false)}>لأ</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
