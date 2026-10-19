import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../store/gameStore';
import type { Settings } from '../../engine/save';
import { playSfx, setLoop, audioStatus } from '../../audio/engine';
import { arNum } from '../../util/ar';

export function PauseMenu() {
  const { setMenu, manualSave, toTitle, restartChapter, settings, updateSettings, savedFlash } = useGame();
  const [confirm, setConfirm] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  // Put the story's music back after a sound test.
  useEffect(() => () => setLoop('music', useGame.getState().state?.music ?? null), []);
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
          <Slider id="vol-music" label="المزيكا" value={settings.musicVolume} disabled={!settings.sound} onChange={(v) => updateSettings({ musicVolume: v })} />
          <Slider id="vol-amb" label="صوت البيت والشارع" value={settings.ambienceVolume} disabled={!settings.sound} onChange={(v) => updateSettings({ ambienceVolume: v })} />
          <Slider id="vol-sfx" label="المؤثرات" value={settings.sfxVolume} disabled={!settings.sound} onChange={(v) => updateSettings({ sfxVolume: v })} />
          <Slider id="vol-radio" label="الراديو" value={settings.radioVolume} disabled={!settings.sound} onChange={(v) => updateSettings({ radioVolume: v })} />
          <SoundTest disabled={!settings.sound} />
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
          <a className="text-xs text-ink/50 text-center underline underline-offset-4" href="./audio-credits.html" target="_blank" rel="noopener" data-audio-credits>الأصوات والتسجيلات: المصادر</a>
        </div>
      </div>
    </div>
  );
}

function Slider({ id, label, value, onChange, disabled }: { id: string; label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-ink/10">
      <label htmlFor={id} className={disabled ? 'opacity-50' : ''}>{label}</label>
      <div className="flex items-center gap-2">
        <input id={id} type="range" min={0} max={100} step={5} value={Math.round(value * 100)} disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) / 100)} className="w-32 accent-[#9c4a33]" dir="ltr" data-volume={id} />
        <span className="w-8 text-sm text-ink/60 tabular-nums">{arNum(Math.round(value * 100))}</span>
      </div>
    </div>
  );
}

function SoundTest({ disabled }: { disabled?: boolean }) {
  const [msg, setMsg] = useState('');
  const check = () => setTimeout(() => {
    const st = audioStatus();
    setMsg(st.failed.length ? `مش قادر يحمّل: ${st.failed.join('، ')}` : st.state === 'running' ? 'الصوت شغّال. لو مش سامعة حاجة، شوفي صوت الجهاز.' : 'الصوت لسه مش شغّال. المسي الشاشة تاني.');
  }, 600);
  return (
    <div className="py-2 border-b border-ink/10">
      <div className="flex items-center justify-between gap-2">
        <span className={disabled ? 'opacity-50' : ''}>اختبار الصوت</span>
        <div className="flex gap-1">
          <button disabled={disabled} className="rounded-full px-3 py-1 text-sm border border-ink/20 disabled:opacity-40" onClick={() => { playSfx('knock'); check(); }} data-test-sfx>خبط</button>
          <button disabled={disabled} className="rounded-full px-3 py-1 text-sm border border-ink/20 disabled:opacity-40" onClick={() => { setLoop('music', 'music_title'); check(); }} data-test-music>مزيكا</button>
        </div>
      </div>
      {msg && <p className="text-xs text-ink/60 mt-1" aria-live="polite">{msg}</p>}
    </div>
  );
}
