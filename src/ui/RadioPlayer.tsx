import { useEffect, useState } from 'react';
import { useRadio, broadcastTitle } from '../radio/player';
import { AUTH_LABEL, pendingArchival } from '../radio/registry';
import { radioState, pauseRadio, resumeRadio, replayRadio } from '../audio/engine';
import { useGame } from '../store/gameStore';
import { arabicDate } from '../engine/calendar';
import { arNum } from '../util/ar';

const BADGE: Record<string, string> = {
  'authentic-archival': 'bg-[#3d6b47] text-white',
  'unverified-archival': 'bg-[#8a6d2c] text-white',
  'modern-recreation': 'bg-[#7a4f6a] text-white',
  placeholder: 'bg-black/55 text-white/90',
};

/** Mini radio on the stage: what's on, how authentic it is, subtitles, and the controls. */
export function RadioPlayer({ gameDate }: { gameDate: string | null }) {
  const { broadcast, source, status } = useRadio();
  const settings = useGame((g) => g.settings);
  const update = useGame((g) => g.updateSettings);
  const [rs, setRs] = useState(radioState());
  const [info, setInfo] = useState(false);
  useEffect(() => {
    if (!broadcast) return;
    const id = window.setInterval(() => setRs(radioState()), 200);
    return () => clearInterval(id);
  }, [broadcast]);
  if (!broadcast) return null;

  const cue = source?.transcript.filter((c) => c.t <= rs.position + 0.05).slice(-1)[0]?.text;
  const pending = pendingArchival(broadcast).length > 0;
  const ended = rs.duration > 0 && !rs.playing && rs.position >= rs.duration - 0.15;
  const btn = 'w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white text-base';

  return (
    <div className="absolute inset-x-2 bottom-2 sm:inset-x-auto sm:left-3 sm:bottom-3 sm:w-[min(420px,60%)] pointer-events-auto fade-in" data-radio dir="rtl">
      {settings.subtitles && cue && (
        <p className="mb-1.5 mx-auto w-fit max-w-full rounded-md bg-black/70 px-3 py-1 text-white text-[15px] leading-7 text-center" aria-live="polite" data-radio-subtitle>{cue}</p>
      )}
      <div className="rounded-2xl bg-[#1b1611]/90 backdrop-blur ring-1 ring-white/10 p-2.5 text-white shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">📻 {broadcastTitle(broadcast)}</div>
            <div className="text-[11px] text-white/60">{gameDate ? arabicDate(gameDate).replace(/\d+/g, (d) => arNum(d)) : ''} · البرنامج العام</div>
          </div>
          {source && <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${BADGE[source.authenticity]}`} data-radio-auth={source.authenticity}>{AUTH_LABEL[source.authenticity]}</span>}
        </div>
        {status === 'unavailable' && <p className="text-xs text-amber-200 mt-1">مافيش تسجيل مسموح بتشغيله للبث ده لسه.</p>}
        <div className="flex items-center gap-1.5 mt-2">
          <button className={btn} aria-label={rs.playing ? 'إيقاف مؤقت' : 'تشغيل'} onClick={() => (rs.playing ? pauseRadio() : resumeRadio())} data-radio-toggle disabled={!source}>{rs.playing ? '⏸' : '▶'}</button>
          <button className={btn} aria-label="إعادة من الأول" onClick={() => replayRadio()} data-radio-replay disabled={!source}>↺</button>
          <button className={btn} aria-pressed={settings.radioMuted} aria-label={settings.radioMuted ? 'شغّلي صوت الراديو' : 'اكتمي الراديو'} onClick={() => update({ radioMuted: !settings.radioMuted })} data-radio-mute>{settings.radioMuted ? '🔇' : '🔈'}</button>
          <input type="range" min={0} max={100} step={5} value={Math.round(settings.radioVolume * 100)} aria-label="صوت الراديو" dir="ltr"
            onChange={(e) => update({ radioVolume: Number(e.target.value) / 100, radioMuted: false })} className="flex-1 min-w-0 accent-[#e2b35c]" data-radio-volume />
          <button className={`${btn} text-[11px] font-bold ${settings.subtitles ? '!bg-[#e2b35c] !text-black' : ''}`} aria-pressed={settings.subtitles} aria-label="الترجمة" onClick={() => update({ subtitles: !settings.subtitles })} data-radio-cc>CC</button>
          <button className={btn} aria-expanded={info} aria-label="عن التسجيل" onClick={() => setInfo(!info)} data-radio-info>ⓘ</button>
        </div>
        <div className="h-1 mt-2 rounded bg-white/10 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-[#e2b35c]" style={{ width: `${rs.duration ? Math.min(100, (rs.position / rs.duration) * 100) : 0}%` }} />
        </div>
        {ended && <p className="text-[11px] text-white/60 mt-1">البث خلص. ↺ عشان تسمعيه تاني.</p>}
        {info && source && (
          <div className="mt-2 text-[11px] leading-5 text-white/75 border-t border-white/10 pt-2" data-radio-details>
            <div>المصدر: {source.title}</div>
            <div>الحقوق: {source.license.label}</div>
            {source.attribution && <div>نَسب: {source.attribution}</div>}
            {source.sourceUrl && <div className="truncate" dir="ltr">{source.sourceUrl}</div>}
            {pending && <div className="text-amber-200 mt-1">التسجيل الأرشيفي الأصلي في انتظار تصريح الحقوق. لحد ما يتصرّح، بيتشغل صوت مؤقت أصلي مكانه.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
