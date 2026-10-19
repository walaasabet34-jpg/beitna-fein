import { useEffect, useRef, useState } from 'react';
import { useRadio, broadcastTitle } from '../radio/player';
import { radioState, pauseRadio, resumeRadio, replayRadio, setDuck } from '../audio/engine';
import { useGame } from '../store/gameStore';
import { arabicDate } from '../engine/calendar';
import { arNum } from '../util/ar';
import type { RadioSource } from '../radio/registry';

/** Mini radio on the stage: what's on, subtitles, and the controls. Silent broadcasts show nothing. */
export function RadioPlayer({ gameDate }: { gameDate: string | null }) {
  const { broadcast, source } = useRadio();
  const settings = useGame((g) => g.settings);
  const update = useGame((g) => g.updateSettings);
  const [rs, setRs] = useState(radioState());
  useEffect(() => {
    if (!broadcast || source?.embed) return;
    const id = window.setInterval(() => setRs(radioState()), 200);
    return () => clearInterval(id);
  }, [broadcast, source]);
  if (!broadcast || !source) return null;

  const embed = !!source.embed;
  const cue = embed ? undefined : source.transcript.filter((c) => c.t <= rs.position + 0.05).slice(-1)[0]?.text;
  const ended = rs.duration > 0 && !rs.playing && rs.position >= rs.duration - 0.15;
  const btn = 'w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white text-base';

  return (
    <div className="absolute inset-x-2 bottom-2 sm:inset-x-auto sm:left-3 sm:bottom-3 sm:w-[min(420px,60%)] pointer-events-auto fade-in" data-radio dir="rtl">
      {settings.subtitles && cue && (
        <p className="mb-1.5 mx-auto w-fit max-w-full rounded-md bg-black/70 px-3 py-1 text-white text-[15px] leading-7 text-center" aria-live="polite" data-radio-subtitle>{cue}</p>
      )}
      <div className="rounded-2xl bg-[#1b1611]/90 backdrop-blur ring-1 ring-white/10 p-2.5 text-white shadow-xl">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">📻 {broadcastTitle(broadcast)}</div>
          <div className="text-[11px] text-white/60">{gameDate ? arabicDate(gameDate).replace(/\d+/g, (d) => arNum(d)) : ''} · البرنامج العام</div>
        </div>
        {embed ? <EmbedPlayer key={source.id} source={source} volume={settings.radioMuted ? 0 : settings.radioVolume} /> : null}
        <div className="flex items-center gap-1.5 mt-2">
          {!embed && <button className={btn} aria-label={rs.playing ? 'إيقاف مؤقت' : 'تشغيل'} onClick={() => (rs.playing ? pauseRadio() : resumeRadio())} data-radio-toggle>{rs.playing ? '⏸' : '▶'}</button>}
          {!embed && <button className={btn} aria-label="إعادة من الأول" onClick={() => replayRadio()} data-radio-replay>↺</button>}
          <button className={btn} aria-pressed={settings.radioMuted} aria-label={settings.radioMuted ? 'شغّلي صوت الراديو' : 'اكتمي الراديو'} onClick={() => update({ radioMuted: !settings.radioMuted })} data-radio-mute>{settings.radioMuted ? '🔇' : '🔈'}</button>
          <input type="range" min={0} max={100} step={5} value={Math.round(settings.radioVolume * 100)} aria-label="صوت الراديو" dir="ltr"
            onChange={(e) => update({ radioVolume: Number(e.target.value) / 100, radioMuted: false })} className="flex-1 min-w-0 accent-[#e2b35c]" data-radio-volume />
          {!embed && <button className={`${btn} text-[11px] font-bold ${settings.subtitles ? '!bg-[#e2b35c] !text-black' : ''}`} aria-pressed={settings.subtitles} aria-label="الترجمة" onClick={() => update({ subtitles: !settings.subtitles })} data-radio-cc>CC</button>}
        </div>
        {!embed && (
          <div className="h-1 mt-2 rounded bg-white/10 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-[#e2b35c]" style={{ width: `${rs.duration ? Math.min(100, (rs.position / rs.duration) * 100) : 0}%` }} />
          </div>
        )}
        {ended && <p className="text-[11px] text-white/60 mt-1">الحلقة خلصت. ↺ عشان تسمعيها تاني.</p>}
      </div>
    </div>
  );
}

const ORIGIN = 'https://www.youtube-nocookie.com';

/** The provider's own embedded player, shown at full size (not hidden, audio not extracted).
 *  Volume, mute and the ambience duck follow the game's radio settings through the documented postMessage API. */
function EmbedPlayer({ source, volume }: { source: RadioSource; volume: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  // Some hosts (e.g. a sandboxed preview) refuse to load the YouTube player. If it never answers, offer the
  // episode on Egyptian Radio's own channel instead of leaving a broken frame on screen.
  useEffect(() => { if (ready) return; const t = window.setTimeout(() => setBlocked(true), 9000); return () => clearTimeout(t); }, [ready]);
  const send = (func: string, args: unknown[] = []) =>
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== ORIGIN || e.source !== ref.current?.contentWindow) return;
      let d: { event?: string; info?: { playerState?: number } } = {};
      try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d.event === 'onReady') { setReady(true); send('playVideo'); }   // the player was tuned by a tap, so it may start
      const st = d.info?.playerState;
      if (typeof st === 'number') { setDuck(st === 1 || st === 3); (window as unknown as { __beitnaEmbedState?: number }).__beitnaEmbedState = st; }
    };
    window.addEventListener('message', onMsg);
    return () => { window.removeEventListener('message', onMsg); setDuck(false); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (volume <= 0) send('mute'); else { send('unMute'); send('setVolume', [Math.round(volume * 100)]); }
  }, [ready, volume]);
  const onLoad = () => {
    // documented handshake: ask the player to report its state (playing / paused) back to us
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: source.id, channel: 'widget' }), ORIGIN);
  };
  const id = source.embed!.videoId;
  const src = `${ORIGIN}/embed/${id}?enablejsapi=1&autoplay=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(location.origin)}`;
  if (blocked && !ready) return (
    <a href={source.sourceUrl ?? '#'} target="_blank" rel="noopener" className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-3 text-sm" data-radio-embed-link={id}>
      ▶ اسمعي الحلقة على قناة الإذاعة المصرية
    </a>
  );
  return (
    <div className="mt-2 rounded-lg overflow-hidden bg-black" style={{ minHeight: 200 }} data-radio-embed={id}>
      <iframe ref={ref} src={src} onLoad={onLoad} title={source.title} className="w-full aspect-video" style={{ minHeight: 200, border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
    </div>
  );
}
