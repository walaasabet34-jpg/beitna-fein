// كورة الشراب: the sock-ball game Fatma and Hoda come back to across the story.
// Hoda throws, the player taps to catch (anywhere on the stage, or Space); then the player chooses how to throw back.
// Hoda reacts to each throw, counts out loud, adapts (slower after misses, faster when it goes well) and invents rules.
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { BallParams, BallResult, Expr, GameState } from '../../engine/types';
import { resolveBall } from '../../engine/core';
import { POSES, handPoints, type Pose } from '../../art/figure';
import { Hoda } from '../../art/Hoda';
import { RoomShell, SockBall, outfitOf, LandingBackdrop } from '../../art/scenes';
import { useGame } from '../../store/gameStore';
import { play } from '../../audio/sfx';
import { RitualFrame, Bubble, countWord, pick } from './RitualFrame';
import { arNum } from '../../util/ar';

type V = [number, number];
type Aim = 'high' | 'hands' | 'low';
type Phase = 'ready' | 'wind' | 'incoming' | 'caught' | 'dropped' | 'aim' | 'outgoing' | 'result' | 'end';

// Hoda stands across the room. Her local rig coordinates map to the canvas with this transform.
const HX = 500, HY = 250, HS = 1.25;
const toCanvas = (v: V): V => [HX + v[0] * HS, HY + v[1] * HS];
const CATCH: V = [600, 700];

const reduced = () => typeof document !== 'undefined' && (document.documentElement.classList.contains('rm') ||
  (!document.documentElement.classList.contains('rm-off') && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));

interface Flight { from: V; to: V; peak: number; t0: number; dur: number; kind: 'in' | 'out' | 'roll'; r0: number; r1: number; bounce?: boolean }

function ballAt(fl: Flight, t: number): { p: V; r: number } {
  const u = Math.max(0, Math.min(1, t));
  if (fl.bounce) {
    // wall bounce: first half goes up to the wall (back), second half comes to the player
    const wall: V = [(fl.from[0] + fl.to[0]) / 2 + 120, 300];
    if (u < 0.45) { const k = u / 0.45; return { p: [fl.from[0] + (wall[0] - fl.from[0]) * k, fl.from[1] + (wall[1] - fl.from[1]) * k - Math.sin(k * Math.PI) * 40], r: fl.r0 * (1 - 0.25 * k) }; }
    const k = (u - 0.45) / 0.55; return { p: [wall[0] + (fl.to[0] - wall[0]) * k, wall[1] + (fl.to[1] - wall[1]) * k - Math.sin(k * Math.PI) * 120], r: fl.r0 * 0.75 + (fl.r1 - fl.r0 * 0.75) * k };
  }
  const x = fl.from[0] + (fl.to[0] - fl.from[0]) * u;
  const y = fl.from[1] + (fl.to[1] - fl.from[1]) * u - Math.sin(u * Math.PI) * fl.peak;
  return { p: [x, y], r: fl.r0 + (fl.r1 - fl.r0) * u };
}

function FlyingBall({ flight, onDone }: { flight: Flight | null; onDone: () => void }) {
  const [, tick] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    done.current = false;
    if (!flight) return;
    let raf = 0;
    const loop = () => {
      const t = (performance.now() - flight.t0) / flight.dur;
      tick((n) => n + 1);
      if (t >= 1) { if (!done.current) { done.current = true; onDone(); } return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [flight, onDone]);
  if (!flight) return null;
  const t = (performance.now() - flight.t0) / flight.dur;
  const { p, r } = ballAt(flight, t);
  const shadowY = flight.kind === 'in' ? 640 + (CATCH[1] - 640) * Math.min(1, t) : 650;
  return (
    <g pointerEvents="none">
      <ellipse cx={p[0]} cy={shadowY + 40} rx={r * 0.9} ry={r * 0.25} fill="#000" opacity=".15" />
      <SockBall x={p[0]} y={p[1]} r={r} rot={t * 540} />
      {flight.kind === 'in' && t > 0.25 && (
        <circle cx={flight.to[0]} cy={flight.to[1]} r={18 + 60 * Math.max(0, 1 - t)} fill="none" stroke="#f0c27a" strokeWidth="4" opacity={Math.min(0.9, t)} />
      )}
    </g>
  );
}

const HodaFigure = memo(function HodaFigure({ pose, expr, outfit, bed }: { pose: Pose; expr: Expr; outfit: ReturnType<typeof outfitOf>; bed: boolean }) {
  return (
    <g transform={`translate(${HX} ${HY}) scale(${HS})`}>
      {bed && <g><rect x="-80" y="196" width="320" height="64" rx="12" fill="#d8ccb2" stroke="#9c8a6a" strokeWidth="2" /><ellipse cx="80" cy="150" rx="70" ry="24" fill="#efe6d4" stroke="#b9ac92" strokeWidth="2" /></g>}
      <Hoda poseOverride={pose} expr={expr} outfit={outfit} animate={false} />
      {bed && <path d="M-40 236 Q80 214 200 236 L210 300 L-50 300Z" fill="#a56a5a" stroke="#6f4438" strokeWidth="2" />}
    </g>
  );
});

export function BallGame({ p, s }: { p: BallParams; s: GameState }) {
  const act = useGame((g) => g.act);
  const alone = p.variant === 'alone';
  const bed = p.variant === 'bed';
  const slow = reduced();
  const [phase, setPhase] = useState<Phase>('ready');
  const [flight, setFlight] = useState<Flight | null>(null);
  const [count, setCount] = useState(p.variant === 'stairs' ? 17 : 0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [pose, setPose] = useState<keyof typeof POSES>(bed ? 'sit' : 'ready');
  const [expr, setExpr] = useState<Expr>(bed ? 'tired' : 'smile');
  const stats = useRef({ catches: 0, hodaCatches: 0, best: 0, high: 0, run: 0, misses: 0, streak: 0, thrown: 0, speed: 1, lastAim: '' as Aim | '', beatRecord: false });
  const [thrown, setThrown] = useState(0);
  const prevBest = typeof s.flags.ball_best === 'number' ? (s.flags.ball_best as number) : 0;
  const countBy = p.variant === 'wall' ? 2 : 1;
  const say = useCallback((t: string | null) => setBubble(t), []);
  const outfit = outfitOf(s);

  const handPos = (): V => {
    const hp = handPoints('child', POSES.throw);
    return toCanvas([hp.R[0], hp.R[1] - (bed ? 30 : 0)]);
  };

  // Hoda winds up and throws towards the player.
  const hodaThrow = useCallback(() => {
    const st = stats.current;
    if (alone) return;
    if (st.thrown >= p.rounds) { setPhase('end'); return; }
    setPhase('wind'); setPose(bed ? 'sit' : 'throw'); setExpr('focused');
    say(st.thrown === 0 ? (p.variant === 'stairs' ? 'خدي!' : p.variant === 'crossing' ? 'فوق الساتر!' : p.variant === 'wall' ? 'على الحيطة الأول!' : bed ? 'براحة…' : (s.flags.knows_high ? 'جاهزة؟' : 'امسكي!')) : null);
    setTimeout(() => {
      st.thrown += 1; setThrown(st.thrown);
      setPose(bed ? 'sit' : 'throwFollow');
      const base = (bed ? 1700 : p.variant === 'stairs' ? 1500 : 1250) * (slow ? 1.5 : 1) * st.speed;
      const to: V = [CATCH[0] + (Math.random() - 0.5) * (bed ? 60 : 200), CATCH[1]];
      setFlight({ from: handPos(), to, peak: bed ? 30 : p.variant === 'crossing' ? 260 : 170, t0: performance.now(), dur: base, kind: 'in', r0: 13, r1: 34, bounce: p.variant === 'wall' });
      setPhase('incoming');
    }, slow ? 900 : 600);
  }, [alone, bed, p.rounds, p.variant, s.flags.knows_high, say, slow]);

  useEffect(() => {
    if (alone) { say(null); return; }
    const t = setTimeout(hodaThrow, 700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bump = (who: 'fatma' | 'hoda') => {
    const st = stats.current;
    st.run += countBy;
    if (who === 'fatma') st.catches++; else st.hodaCatches++;
    const shown = (p.variant === 'stairs' ? 17 : 0) + st.run;
    st.best = Math.max(st.best, st.run / countBy);
    setCount(shown);
    if (!st.beatRecord && prevBest > 0 && st.run / countBy > prevBest) { st.beatRecord = true; return 'أكتر من المرة اللي فاتت!'; }
    return countWord(shown) + '!';
  };

  // A tap anywhere on the stage = catch attempt.
  const tryCatch = useCallback(() => {
    if (phase !== 'incoming' || !flight) return;
    const t = (performance.now() - flight.t0) / flight.dur;
    const window = slow || stats.current.speed > 1.1 ? 0.62 : 0.72;
    if (t < window) { if (!alone) { setExpr('laugh'); say(pick(['لسه!', 'استني!', 'بدري!'])); } return; }
    const st = stats.current;
    play('tap');
    setFlight(null);
    st.misses = 0; st.streak++;
    if (alone) { st.catches++; setPhase('caught'); setTimeout(() => setPhase('aim'), 500); return; }
    setPhase('caught'); setExpr('laugh'); setPose(bed ? 'sit' : 'cheer');
    say(bump('fatma'));
    if (st.streak >= 3 && st.speed > 0.8 && !bed) { st.speed *= 0.88; }
    setTimeout(() => { setPhase('aim'); setPose(bed ? 'sit' : 'ready'); setExpr('smile'); if (stats.current.thrown === 1 && !bed && p.variant !== 'stairs') say(s.flags.knows_high ? 'عالي!' : 'دورك!'); }, 650);
  }, [phase, flight, slow, alone, bed, say, p.variant, s.flags.knows_high]); // eslint-disable-line react-hooks/exhaustive-deps

  const arrived = useCallback(() => {
    const st = stats.current;
    if (!flight) return;
    if (flight.kind === 'in') {
      // nobody caught it
      setFlight(null);
      st.streak = 0; st.misses++; st.run = 0;
      play('tap');
      if (alone) { setPhase('dropped'); setTimeout(() => setPhase('aim'), 700); return; }
      setPhase('dropped'); setExpr(st.misses >= 2 ? 'smile' : 'laugh');
      setCount(p.variant === 'stairs' ? 17 : 0);
      if (st.misses >= 2) { st.speed = Math.min(1.5, st.speed * 1.25); say('هرميها براحة'); }
      else say(pick(['وقعت! من الأول', 'يا خبر!', 'من الأول!']));
      setTimeout(() => { setPhase('aim'); setExpr('smile'); }, 900);
    } else if (flight.kind === 'out') {
      setFlight(null);
      resolveHoda(st.lastAim as Aim);
    } else {
      setFlight(null); setPhase('end');
    }
  }, [flight, alone, p.variant, say]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveHoda = (aim: Aim) => {
    const st = stats.current;
    let chance = aim === 'hands' ? 0.92 : aim === 'high' ? 0.74 : 0.6;
    if (bed) chance = 0.85;
    let line: string;
    let caught = Math.random() < chance;
    if (p.variant === 'crossing' && aim === 'low') { caught = false; line = 'اتمسكت في الساتر!'; }
    else if (caught) line = bump('hoda');
    else line = aim === 'high' ? 'عالية أوي!' : aim === 'low' ? 'واطية!' : 'فلتت!';
    if (caught && aim === 'high' && !bed) { setPose('catch'); setExpr('laugh'); if (p.variant === 'crossing') line = 'عبرنا! ' + line; }
    else if (caught) { setPose(bed ? 'sit' : aim === 'low' ? 'catchLow' : 'hold'); setExpr(bed ? 'tired' : 'proud'); }
    else { setPose(bed ? 'sit' : 'catchLow'); setExpr('surprised'); st.run = 0; setCount(p.variant === 'stairs' ? 17 : 0); }
    play('tap');
    say(line);
    setPhase('result');
    const last = st.thrown >= p.rounds;
    setTimeout(() => {
      if (last) {
        setPhase('end'); setPose(bed ? 'sit' : 'stand'); setExpr(bed ? 'sleepy' : 'smile');
        say(bed ? 'تعبت. كمّلي إنتي العد' : p.variant === 'stairs' ? null : st.best >= 5 ? 'بكرة نعدّي العشرة!' : 'تاني بكرة؟');
      } else hodaThrow();
    }, 1100);
  };

  const throwBall = (aim: Aim, force = false) => {
    if (phase !== 'aim' && !force) return;
    const st = stats.current;
    play('tick');
    if (alone) {
      // Against the wall. It comes back slower each time; nobody counts.
      st.thrown++; setThrown(st.thrown);
      if (st.thrown > p.rounds) { setFlight({ from: CATCH, to: [170, 650], peak: 20, t0: performance.now(), dur: 1400, kind: 'roll', r0: 30, r1: 15 }); setPhase('outgoing'); return; }
      setFlight({ from: CATCH, to: [CATCH[0] - 40, CATCH[1]], peak: aim === 'high' ? 220 : 120, t0: performance.now(), dur: 1900 * st.speed, kind: 'in', r0: 30, r1: 32, bounce: true });
      st.speed *= 1.12;
      setPhase('incoming');
      return;
    }
    if (aim === 'high') st.high++;
    if (st.lastAim === aim && aim !== 'high' && !bed && Math.random() < 0.5) say('غيّري!');
    st.lastAim = aim;
    const hp = handPoints('child', POSES.catch);
    const target: V = aim === 'high' ? toCanvas([80, hp.R[1] - 10]) : aim === 'hands' ? toCanvas([80, bed ? 190 : 160]) : toCanvas([80, 260]);
    setFlight({ from: CATCH, to: target, peak: aim === 'high' ? 210 : aim === 'low' ? 60 : 140, t0: performance.now(), dur: 900 * (slow ? 1.4 : 1), kind: 'out', r0: 32, r1: 14 });
    setPhase('outgoing');
    setPose(bed ? 'sit' : aim === 'high' ? 'ready' : 'ready');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tryCatch(); }
      if (phase === 'aim') { if (e.key === '1') throwBall('high'); if (e.key === '2') throwBall('hands'); if (e.key === '3') throwBall('low'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finish = (stoppedEarly = false) => {
    const st = stats.current;
    const r: BallResult = { catches: st.catches, hodaCatches: st.hodaCatches, best: Math.round(st.best), high: st.high, stoppedEarly };
    act((ic, gs) => resolveBall(ic, gs, r));
  };

  const hp = handPoints('child', POSES.catch);
  const zones: { aim: Aim; label: string; y: number; h: number }[] = bed
    ? [{ aim: 'hands', label: 'دحرجيها', y: toCanvas([0, 150])[1], h: 120 }]
    : [
      { aim: 'high', label: 'عالي', y: toCanvas([0, hp.R[1] - 40])[1], h: 90 },
      { aim: 'hands', label: 'في إيدها', y: toCanvas([0, 120])[1], h: 110 },
      { aim: 'low', label: 'واطي', y: toCanvas([0, 220])[1], h: 100 },
    ];
  const head = toCanvas([80, -6]);

  return (
    <>
      <RitualFrame s={s} label="لعب الكورة الشراب" onTap={() => tryCatch()}>
        {p.variant === 'stairs' ? <LandingBackdrop /> : null}
        <RoomShell s={s} slot={Math.min(s.slot, 3)} hidden={p.variant === 'stairs'}>
          {p.variant === 'crossing' && <g><rect x="380" y="560" width="440" height="26" rx="8" fill="#6b8fb0" opacity=".55" /><text x="600" y="552" textAnchor="middle" fontFamily="'Aref Ruqaa', serif" fontSize="26" fill="#3a2a1e" opacity=".7">القناة</text></g>}
          {!alone && <HodaFigure pose={POSES[pose]} expr={expr} outfit={outfit} bed={bed} />}
          {alone && phase === 'ready' && <SockBall x={170} y={650} r={16} />}
          {!alone && (phase === 'aim' || phase === 'wind') && phase === 'wind' && <SockBall x={handPos()[0]} y={handPos()[1]} r={13} />}
        </RoomShell>
        {(phase === 'aim' || phase === 'caught') && <SockBall x={CATCH[0]} y={CATCH[1] - 10} r={32} />}
        <FlyingBall flight={flight} onDone={arrived} />
        {bubble && !alone && <Bubble x={head[0] + 40} y={head[1] - 20} text={bubble} />}
        {!alone && count > 0 && <text x="1160" y="770" textAnchor="end" fontFamily="'Aref Ruqaa', serif" fontSize="46" fill="#fff6e0" stroke="#2b2118" strokeWidth="1.5" opacity=".9" data-ball-count={count}>{arNum(count)}</text>}
        {phase === 'aim' && !alone && zones.map((z) => (
          <g key={z.aim} data-aim={z.aim} style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); throwBall(z.aim); }}>
            <rect x={HX - 20} y={z.y} width={200} height={z.h} rx="20" fill="#f0c27a" opacity=".1" stroke="#f0c27a" strokeWidth="2" strokeDasharray="8 8" />
            <path d={`M${HX + 182} ${z.y + z.h / 2} H${HX + 214}`} stroke="#f0c27a" strokeWidth="3" />
            <rect x={HX + 214} y={z.y + z.h / 2 - 30} width="150" height="60" rx="30" fill="#fff8ea" stroke="#9c4a33" strokeWidth="3" />
            <text x={HX + 289} y={z.y + z.h / 2 + 9} textAnchor="middle" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize="26" fontWeight="700" fill="#2b2118">{z.label}</text>
          </g>
        ))}
        {alone && (phase === 'ready' || phase === 'aim') && (
          <g data-aim="hands" style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); throwBall('hands', phase === 'ready'); }}>
            <rect x="420" y="250" width="360" height="300" rx="24" fill="#f0c27a" opacity=".08" stroke="#f0c27a" strokeWidth="3" strokeDasharray="10 8" />
            <text x="600" y="410" textAnchor="middle" fontFamily="'Noto Naskh Arabic', serif" fontSize="26" fill="#fff8ea" stroke="#2b2118" strokeWidth=".8">{phase === 'ready' ? 'الكورة تحت الماكينة' : 'على الحيطة'}</text>
          </g>
        )}
      </RitualFrame>
      <div className="px-2 sm:px-0 pb-4" data-panel>
        <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in flex items-center justify-between gap-3" data-activity="ball" data-phase={phase}>
          <p className="text-[15px] sm:text-[16px] text-ink/80 leading-7">
            {phase === 'end' ? (alone ? 'الكورة وقفت تحت الماكينة.' : bed ? 'هدى سندت راسها على المخدة.' : `آخر عدّة: ${arNum(Math.round(stats.current.best) * countBy)}.`)
              : phase === 'incoming' ? 'المسي الشاشة لما الكورة توصل للدايرة.'
              : phase === 'aim' ? (alone ? 'ارمي الكورة.' : 'ارمي لها: المسي فين على هدى.')
              : alone ? '' : `${arNum(thrown)} من ${arNum(p.rounds)}`}
          </p>
          {phase === 'end'
            ? <button data-ball-done className="rounded-full px-5 py-2 bg-rust text-paper font-semibold shrink-0" onClick={() => finish(false)}>كمّلي</button>
            : <button data-ball-stop className="rounded-full px-4 py-2 border border-ink/25 text-ink text-sm shrink-0" onClick={() => finish(true)}>{alone ? 'سيبيها' : 'كفاية كده'}</button>}
        </div>
      </div>
    </>
  );
}
