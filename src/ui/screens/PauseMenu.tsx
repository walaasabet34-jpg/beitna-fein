import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../store/gameStore';
import type { Settings } from '../../engine/save';

export function PauseMenu() {
  const { setMenu, manualSave, toTitle, restartChapter, settings, updateSettings, savedFlash } = useGame();
  const [confirm, setConfirm] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  const justSaved = Date.now() - savedFlash < 2500;
  const row = 'flex items-center justify-between gap-3 py-2 border-b border-ink/10';
  const seg = <K extends keyof Settings>(key: K, opts: [Settings[K], string][]) => (
    <div className="flex gap-1">
      {opts.map(([v, label]) => (
        <button key={String(v)} aria-pressed={settings[key] === v} onClick={() => updateSettings({ [key]: v } as Partial<Settings>)}
          className={`rounded-full px-3 py-1 text-sm border ${settings[key] === v ? 'bg-rust text-paper border-rust' : 'border-ink/20 text-ink'}`}>{label}</button>
      ))}
    </div>
  );
  return (
    <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4 scene-fade" role="dialog" aria-modal="true" aria-label="القايمة"
      onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}>
      <div className="paper paper-edge rounded-2xl w-full max-w-md p-5" data-pause>
        <h2 className="font-ruqaa text-3xl text-ink mb-3">استراحة</h2>
        <div className="flex flex-col gap-2 mb-4">
          <button ref={first} className="rounded-full px-5 py-2.5 bg-rust text-paper font-semibold" onClick={() => setMenu(false)}>رجوع للعبة</button>
          <button className="rounded-full px-5 py-2.5 border border-ink/25 text-ink" onClick={manualSave} data-save>
            {justSaved ? 'اتحفظت ✓' : 'حفظ'}
          </button>
          <p className="text-xs text-ink/55 text-center -mt-1">اللعبة بتتحفظ لوحدها بعد كل خطوة كمان.</p>
        </div>
        <div className="text-ink">
          <div className={row}><span>الصوت</span>{seg('sound', [[true, 'شغّال'], [false, 'مقفول']])}</div>
          <div className={row}><span>حركة أقل</span>{seg('reducedMotion', [[null, 'زي الجهاز'], [true, 'أيوه'], [false, 'لأ']])}</div>
          <div className={row}><span>سرعة الكلام</span>{seg('textSpeed', [['slow', 'بطيء'], ['normal', 'عادي'], ['instant', 'على طول']])}</div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {!confirm ? (
            <button className="rounded-full px-5 py-2 border border-ink/25 text-ink" onClick={() => setConfirm(true)}>ابدئي من الأول</button>
          ) : (
            <div className="rounded-xl bg-rust/10 p-3 text-ink text-sm">
              <p className="mb-2">الحفظ الحالي هيتمسح. متأكدة؟</p>
              <div className="flex gap-2">
                <button className="rounded-full px-4 py-1.5 bg-rust text-paper" onClick={restartChapter} data-confirm-restart>أيوه، من الأول</button>
                <button className="rounded-full px-4 py-1.5 border border-ink/25" onClick={() => setConfirm(false)}>لأ</button>
              </div>
            </div>
          )}
          <button className="rounded-full px-5 py-2 text-ink/70 underline underline-offset-4" onClick={toTitle} data-to-title>الشاشة الرئيسية</button>
        </div>
      </div>
    </div>
  );
}
