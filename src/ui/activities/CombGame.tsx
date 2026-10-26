// تسريح الشعر: every morning, her braid and the comb with the broken tooth.
// Each tap is one stroke. Hurrying (a tap while the comb is still moving) pulls her hair; slow, steady strokes
// and she starts talking — a line every two gentle strokes, from her own stories for that day.
// Early on, if she doesn't trust Fatma's hands yet, she braids herself and the player holds the mirror.
import { useEffect, useRef, useState } from 'react';
import type { CombParams, CombResult, Expr, GameState } from '../../engine/types';
import { resolveComb, evaluate } from '../../engine/core';
import { Hoda } from '../../art/Hoda';
import { outfitOf, RoomShell } from '../../art/scenes';
import { useGame } from '../../store/gameStore';
import { play } from '../../audio/sfx';
import { RitualFrame, Bubble } from './RitualFrame';

const HX = 430, HY = 110, HS = 2.6;
// down the braid on her left (screen right), from the ear to the ribbon
const TOP: [number, number] = [HX + 101 * HS, HY + 60 * HS];
const BOTTOM: [number, number] = [HX + 104 * HS, HY + 80 * HS];

function Comb({ t }: { t: number }) {
  const x = TOP[0] + (BOTTOM[0] - TOP[0]) * t, y = TOP[1] + (BOTTOM[1] - TOP[1]) * t;
  return (
    // Fatma's hand comes from the right; the comb lies across the braid, teeth down, one tooth missing.
    <g transform={`translate(${x} ${y}) rotate(-6)`} pointerEvents="none">
      <path d="M44 -18 Q90 -46 150 -40 L156 -16 Q100 -20 58 8Z" fill="#6e7f8c" />
      <ellipse cx="36" cy="-6" rx="18" ry="14" fill="#bf8862" stroke="#3a2418" strokeOpacity=".4" />
      <rect x="-22" y="-6" width="44" height="9" rx="3" fill="#3a2a22" />
      {Array.from({ length: 9 }, (_, i) => (i === 5 ? null : <rect key={i} x={-20 + i * 5} y="3" width="2.4" height="11" fill="#3a2a22" />))}
      <path d="M22 -2 q8 -6 14 -2" stroke="#9c6a48" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Mirror() {
  return (
    <g pointerEvents="none">
      <path d="M820 830 Q860 640 900 560" stroke="#bf8862" strokeWidth="34" strokeLinecap="round" />
      <ellipse cx="900" cy="470" rx="78" ry="98" fill="#6b4a2f" />
      <ellipse cx="900" cy="470" rx="64" ry="84" fill="#c9d6dc" />
      <path d="M860 420 q30 -30 60 -10" stroke="#fff" strokeWidth="5" opacity=".6" fill="none" />
    </g>
  );
}

export function CombGame({ p, s }: { p: CombParams; s: GameState }) {
  const act = useGame((g) => g.act);
  const self = evaluate(p.selfIf, s) && !!p.selfIf;
  const need = p.strokes ?? 8;
  const [t, setT] = useState(0);
  const [stroking, setStroking] = useState(false);
  const [gentle, setGentle] = useState(0);
  const [rough, setRough] = useState(0);
  const [heard, setHeard] = useState(0);
  const [expr, setExpr] = useState<Expr>(self ? 'guarded' : 'neutral');
  const [bubble, setBubble] = useState<string | null>(self ? 'أنا بعرف أضفّر لوحدي. امسكي المراية بس.' : null);
  const [done, setDone] = useState(false);
  const [ribbon, setRibbon] = useState<'old' | 'red'>('old');
  const raf = useRef(0);
  const counts = useRef({ gentle: 0, heard: 0 });

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const stroke = () => {
    if (done) return;
    if (stroking) {
      if (self) return;
      setRough((r) => r + 1); setExpr('upset'); setBubble('آي! براحة');
      play('tick');
      return;
    }
    setStroking(true); play('fabric');
    const t0 = performance.now(), dur = self ? 700 : 520;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      setT(self ? 0 : k);
      if (k < 1) { raf.current = requestAnimationFrame(step); return; }
      setStroking(false); setT(0);
      const ng = counts.current.gentle + 1; counts.current.gentle = ng; setGentle(ng);
      const h = counts.current.heard;
      if (ng % 2 === 0 && h < p.lines.length) {
        counts.current.heard = h + 1; setHeard(h + 1); setBubble(p.lines[h]); setExpr(self ? 'focused' : 'smile');
      } else if (!self) setExpr('neutral');
      if (ng >= need) { setDone(true); setExpr('proud'); if (counts.current.heard >= p.lines.length && ng % 2 !== 0) setBubble(self ? 'خلصت. معوّجة؟' : 'كده حلوة.'); }
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stroke(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pickRibbon = (r: 'old' | 'red') => {
    if (r === 'red' && !p.special) { setBubble('الحمرا لما ماما تيجي.'); setExpr('guarded'); setRibbon('old'); return; }
    setRibbon(r); setBubble(r === 'red' ? 'النهارده ينفع!' : 'ماشي.'); setExpr(r === 'red' ? 'laugh' : 'smile'); play('tick');
  };
  const finish = () => {
    const r: CombResult = { gentle, rough, heard, ribbon, self };
    act((ic, gs) => resolveComb(ic, gs, r));
  };
  const look = { ...outfitOf(s), ribbon };

  return (
    <>
      <RitualFrame s={s} label="تسريح شعر هدى" onTap={() => stroke()}>
        <RoomShell s={s} slot={Math.min(s.slot, 3)} morning={s.slot === 0} />
        {/* she stands close to us, in front of the tabliya */}
        <g transform={`translate(${HX} ${HY}) scale(${HS})`}><Hoda pose="stand" expr={expr} outfit={look} animate={false} gaze={self ? [0.8, 0] : [0.6, 0.4]} /></g>
        {self ? <Mirror /> : <Comb t={t} />}
        {bubble && <Bubble x={HX + 185} y={HY + 360} text={bubble} />}
        <g data-comb-progress={gentle} pointerEvents="none">
          {Array.from({ length: need }, (_, i) => <circle key={i} cx={600 - (need - 1) * 14 + i * 28} cy={770} r="8" fill={i < gentle ? '#f0c27a' : '#fff8ea'} opacity={i < gentle ? 1 : 0.35} stroke="#2b2118" strokeOpacity=".4" />)}
        </g>
      </RitualFrame>
      <div className="px-2 sm:px-0 pb-4" data-panel>
        <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" data-activity="comb" data-done={done ? '1' : '0'}>
          {done ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2" role="group" aria-label="الشريطة">
                <button className="choice-btn !py-2" data-ribbon="old" onClick={() => pickRibbon('old')}>الشريطة القديمة</button>
                <button className="choice-btn !py-2" data-ribbon="red" onClick={() => pickRibbon('red')}>الشريطة الحمرا</button>
              </div>
              <div className="flex justify-end"><button data-comb-done className="rounded-full px-5 py-2 bg-rust text-paper font-semibold" onClick={finish}>خلصنا</button></div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] text-ink/75 leading-7">{self ? 'المسي عشان تمسكي المراية ثابتة.' : 'المسي لكل مشطة. على مهلك.'}</p>
              <button data-comb-stroke className="rounded-full px-5 py-2 bg-rust text-paper font-semibold shrink-0" onPointerDown={(e) => { e.stopPropagation(); stroke(); }}>{self ? 'المراية' : 'مشطة'}</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
