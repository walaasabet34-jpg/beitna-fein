// علبة الزراير: sorting buttons for the current sewing order. Work and time with Hoda in the same action.
// Tap a button then a bowl (or drag it). Hoda sorts beside you; she gets some wrong, notices some of yours,
// and once she finds the red button she asks to keep it. Wrong buttons left in a bowl end up on the garment.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ButtonsParams, ButtonsResult, Expr, GameState } from '../../engine/types';
import { resolveButtons } from '../../engine/core';
import { POSES } from '../../art/figure';
import { Hoda } from '../../art/Hoda';
import { outfitOf } from '../../art/scenes';
import { useGame } from '../../store/gameStore';
import { play } from '../../audio/sfx';
import { RitualFrame, Bubble, pick } from './RitualFrame';
import { arNum } from '../../util/ar';

type Kind = 'bigBrown' | 'smallWhite' | 'smallBrown' | 'bigWhite' | 'black' | 'red';
interface Btn { id: number; kind: Kind; x: number; y: number; where: 'pile' | 0 | 1 | 'hoda' | 'gone'; by?: 'fatma' | 'hoda'; slot?: number }
const NEED = 5;
const LOOK: Record<Kind, { r: number; fill: string; edge: string; holes: number }> = {
  bigBrown: { r: 21, fill: '#7a4a2a', edge: '#4e2e18', holes: 4 },
  smallBrown: { r: 13, fill: '#7f4e2c', edge: '#4e2e18', holes: 2 },
  smallWhite: { r: 13, fill: '#f1ead8', edge: '#a99f86', holes: 2 },
  bigWhite: { r: 20, fill: '#efe7d2', edge: '#a99f86', holes: 4 },
  black: { r: 16, fill: '#2b2b2b', edge: '#111', holes: 2 },
  red: { r: 17, fill: '#c0352b', edge: '#7a1c16', holes: 4 },
};
const RIGHT: [Kind, Kind] = ['bigBrown', 'smallWhite'];
const CONFUSE: [Kind, Kind] = ['smallBrown', 'bigWhite']; // same colour, wrong size
const BOWL: [number, number][] = [[330, 640], [870, 640]];

function ButtonShape({ b, lift }: { b: Btn; lift?: boolean }) {
  const L = LOOK[b.kind];
  return (
    <g transform={`translate(${b.x} ${b.y - (lift ? 10 : 0)})`}>
      <ellipse cx="2" cy={L.r * 0.5 + (lift ? 12 : 3)} rx={L.r} ry={L.r * 0.35} fill="#000" opacity={lift ? 0.18 : 0.25} />
      <circle r={L.r} fill={L.fill} stroke={L.edge} strokeWidth="2" />
      <circle r={L.r * 0.72} fill="none" stroke={L.edge} strokeWidth="1.2" opacity=".55" />
      {(L.holes === 4 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : [[-1, 0], [1, 0]]).map(([hx, hy], i) => <circle key={i} cx={hx * L.r * 0.22} cy={hy * L.r * 0.22} r={L.r * 0.09 + 0.8} fill={L.edge} />)}
      <ellipse cx={-L.r * 0.35} cy={-L.r * 0.4} rx={L.r * 0.3} ry={L.r * 0.16} fill="#fff" opacity=".25" />
      {lift && <circle r={L.r + 6} fill="none" stroke="#f0c27a" strokeWidth="4" />}
    </g>
  );
}

function makePile(hasRed: boolean): Btn[] {
  const kinds: Kind[] = [...Array(NEED).fill('bigBrown'), ...Array(NEED).fill('smallWhite'), 'smallBrown', 'smallBrown', 'smallBrown', 'bigWhite', 'bigWhite', 'black', 'black', ...(hasRed ? ['red' as Kind] : [])];
  const out: Btn[] = [];
  kinds.forEach((kind, id) => {
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random());
      const x = 600 + Math.cos(a) * d * 300, y = 440 + Math.sin(a) * d * 120;
      if (out.every((o) => Math.hypot(o.x - x, o.y - y) > 44) || k === 39) { out.push({ id, kind, x, y, where: 'pile' }); break; }
    }
  });
  return out;
}

const bowlSpot = (bowl: 0 | 1, slot: number): [number, number] => {
  const [cx, cy] = BOWL[bowl];
  const a = slot * 2.4;
  return [cx + Math.cos(a) * (14 + slot * 5), cy - 8 + Math.sin(a) * (6 + slot * 2)];
};

export function ButtonTin({ p, s }: { p: ButtonsParams; s: GameState }) {
  const act = useGame((g) => g.act);
  const helping = p.helper !== 'none';
  const bed = p.helper === 'bed';
  const hasRed = s.flags.red_button !== 'hoda';
  const [btns, setBtns] = useState<Btn[]>(() => makePile(hasRed));
  const [sel, setSel] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [bubble, setBubble] = useState<string | null>(helping ? (bed ? 'هعمل شوية بس' : s.flags.hoda_sorted ? 'أنا الكبار!' : 'أنا أساعد؟') : null);
  const [expr, setExpr] = useState<Expr>(bed ? 'tired' : 'smile');
  const [ask, setAsk] = useState<null | { kind: 'wrong'; id: number } | { kind: 'red' }>(null);
  const stats = useRef({ hodaPlaced: 0, hodaWrong: 0, fixedQuietly: 0, showedHer: 0, caughtFatma: 0, keptRed: false, redAsked: false, shown: 0 });
  const svgRef = useRef<SVGGElement>(null);
  const outfit = outfitOf(s);

  const inBowl = (b: 0 | 1) => btns.filter((x) => x.where === b);
  const rightCount = (b: 0 | 1) => inBowl(b).filter((x) => x.kind === RIGHT[b]).length;
  const done = rightCount(0) >= NEED && rightCount(1) >= NEED;

  const place = (id: number, bowl: 0 | 1, by: 'fatma' | 'hoda') => {
    setBtns((cur) => {
      const slot = cur.filter((x) => x.where === bowl).length;
      const [x, y] = bowlSpot(bowl, slot);
      return cur.map((b) => (b.id === id ? { ...b, where: bowl, by, slot, x, y } : b));
    });
    play('clink');
  };
  const backToPile = (id: number) => setBtns((cur) => cur.map((b) => (b.id === id ? { ...b, where: 'pile', by: undefined, x: 600 + (Math.random() - 0.5) * 300, y: 420 + (Math.random() - 0.5) * 120 } : b)));

  // Hoda's turn every couple of seconds.
  useEffect(() => {
    if (!helping || done || ask) return;
    const st = stats.current;
    if (bed && st.hodaPlaced >= 3) return;
    const t = setTimeout(() => {
      const pile = btns.filter((b) => b.where === 'pile');
      // The red button: she sets it aside and asks.
      const red = pile.find((b) => b.kind === 'red');
      if (red && !st.redAsked && st.hodaPlaced >= 2 && !bed) {
        st.redAsked = true;
        setBtns((cur) => cur.map((b) => (b.id === red.id ? { ...b, where: 'hoda', x: 600, y: 300 } : b)));
        setExpr('smile'); setBubble('ده حلو… ممكن آخده؟'); setAsk({ kind: 'red' });
        return;
      }
      const needs = ([0, 1] as const).filter((b) => rightCount(b) < NEED);
      if (!needs.length) return;
      const bowl = pick([...needs]);
      const good = Math.random() < p.skill;
      const want = good ? RIGHT[bowl] : CONFUSE[bowl];
      const cand = pile.find((b) => b.kind === want) ?? pile.find((b) => b.kind === RIGHT[bowl]);
      if (!cand) return;
      st.hodaPlaced++;
      if (cand.kind !== RIGHT[bowl]) st.hodaWrong++;
      place(cand.id, bowl, 'hoda');
      setExpr(bed ? 'tired' : 'focused');
      setBubble(bed && st.hodaPlaced >= 3 ? 'كفاية… إيدي تقيلة' : Math.random() < 0.35 ? pick(['ده!', 'وده كمان', 'أنا أسرع منك', 'عدّي معايا']) : null);
    }, bed ? 3600 : 2300);
    return () => clearTimeout(t);
  }, [btns, helping, done, ask, bed, p.skill]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fatma's own wrong placements: sometimes Hoda spots them first.
  const fatmaPlaced = (id: number, bowl: 0 | 1) => {
    const b = btns.find((x) => x.id === id)!;
    place(id, bowl, 'fatma');
    if (b.kind !== RIGHT[bowl] && helping && !bed && Math.random() < 0.35 + p.skill * 0.4) {
      setTimeout(() => {
        stats.current.caughtFatma++;
        backToPile(id); setExpr('laugh');
        setBubble(b.kind === 'red' || b.kind === 'black' ? 'ده مش لونها يا خالتي!' : 'دي مش بتاعتها يا خالتي!');
      }, 700);
    }
  };

  const tapBowl = (bowl: 0 | 1) => { if (sel !== null && !ask) { fatmaPlaced(sel, bowl); setSel(null); } };
  const tapInBowl = (b: Btn) => {
    if (ask) return;
    const wrong = b.where !== 'pile' && b.where !== 'hoda' && b.where !== 'gone' && b.kind !== RIGHT[b.where];
    if (wrong && b.by === 'hoda' && helping) { setAsk({ kind: 'wrong', id: b.id }); return; }
    backToPile(b.id);
  };
  const tapPile = (b: Btn) => {
    if (ask) return;
    if (b.kind === 'red' && !helping && p.redLine) setBubble(p.redLine);
    setSel(b.id === sel ? null : b.id); play('tick');
  };

  const answerWrong = (id: number, show: boolean) => {
    const st = stats.current;
    backToPile(id); setAsk(null);
    if (show) {
      st.showedHer++; st.shown++;
      setExpr(p.skill >= 0.8 ? 'surprised' : st.shown > 1 ? 'smile' : 'upset');
      setBubble(p.skill >= 0.8 ? 'آه صح! ده أصغر' : st.shown > 1 ? 'خلاص، فهمت: الحجم كمان' : 'بس نفس اللون!');
    } else {
      st.fixedQuietly++;
      if (Math.random() < 0.3) { setExpr('guarded'); setBubble('إنتي شلتي بتاعي؟'); }
    }
  };
  const answerRed = (keep: boolean) => {
    const st = stats.current;
    setAsk(null);
    const red = btns.find((b) => b.kind === 'red');
    if (keep) { st.keptRed = true; setBtns((cur) => cur.map((b) => (b.kind === 'red' ? { ...b, where: 'gone' } : b))); setExpr('laugh'); setBubble('هخيّطه على الشريطة!'); }
    else { if (red) backToPile(red.id); setExpr('neutral'); setBubble('ماشي…'); }
  };

  // drag support (mouse and touch); a tap without movement keeps the tap-then-bowl flow
  const toCanvas = (e: React.PointerEvent) => {
    const svg = svgRef.current?.ownerSVGElement; if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if (!m) return null;
    const q = pt.matrixTransform(m.inverse()); return [q.x, q.y] as [number, number];
  };
  const onMove = (e: React.PointerEvent) => { if (!drag) return; const c = toCanvas(e); if (c) setDrag({ ...drag, x: c[0], y: c[1] }); };
  const onUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const c = toCanvas(e);
    const b = btns.find((x) => x.id === drag.id);
    if (c && b && Math.hypot(c[0] - b.x, c[1] - b.y) > 30) {
      const bowl = BOWL.findIndex(([bx, by]) => Math.hypot(c[0] - bx, c[1] - by) < 110);
      if (bowl === 0 || bowl === 1) { fatmaPlaced(drag.id, bowl); setSel(null); }
    }
    setDrag(null);
  };

  const finish = () => {
    const st = stats.current;
    const leftWrong = btns.filter((b) => (b.where === 0 || b.where === 1) && b.kind !== RIGHT[b.where]).length;
    const r: ButtonsResult = { hodaPlaced: st.hodaPlaced, hodaWrong: st.hodaWrong, fixedQuietly: st.fixedQuietly, showedHer: st.showedHer, caughtFatma: st.caughtFatma, keptRed: st.keptRed, leftWrong };
    act((ic, gs) => resolveButtons(ic, gs, r));
  };

  const bowls = p.bowls ?? ['كبار بني', 'صغيرين بيض'];
  const hodaHolding = btns.find((b) => b.where === 'hoda');
  const sorted = useMemo(() => [...btns].sort((a, b) => a.y - b.y), [btns]);

  return (
    <>
      <RitualFrame s={s} label="فرز الزراير">
        <g ref={svgRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setDrag(null)}>
          <rect width="1200" height="800" fill="#6b4a2f" />
          <rect width="1200" height="800" fill="url(#tiles)" opacity=".35" />
          {helping && (
            <g transform={bed ? 'translate(470 -60) scale(1.6)' : 'translate(470 -40) scale(1.6)'}>
              <Hoda poseOverride={POSES.sort} expr={expr} outfit={outfit} animate={false} />
            </g>
          )}
          {/* the tray */}
          <ellipse cx="600" cy="452" rx="440" ry="200" fill="#a8a89c" />
          <ellipse cx="600" cy="444" rx="430" ry="192" fill="#c4c4b8" />
          <ellipse cx="600" cy="444" rx="400" ry="170" fill="none" stroke="#9a9a8e" strokeWidth="3" />
          <text x="600" y="320" textAnchor="middle" direction="rtl" fontFamily="'Aref Ruqaa', serif" fontSize="28" fill="#3a3a32" opacity=".75">{p.order}</text>
          {([0, 1] as const).map((b) => (
            <g key={b} data-bowl={b} style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); tapBowl(b); }}>
              <ellipse cx={BOWL[b][0]} cy={BOWL[b][1] + 30} rx="120" ry="34" fill="#000" opacity=".2" />
              <path d={`M${BOWL[b][0] - 115} ${BOWL[b][1] - 20} Q${BOWL[b][0]} ${BOWL[b][1] + 90} ${BOWL[b][0] + 115} ${BOWL[b][1] - 20}Z`} fill="#e9e4d6" stroke="#2f4f6a" strokeWidth="5" />
              <ellipse cx={BOWL[b][0]} cy={BOWL[b][1] - 20} rx="115" ry="30" fill="#d8d2c2" stroke="#2f4f6a" strokeWidth="5" />
              <g transform={`translate(${BOWL[b][0]} ${BOWL[b][1] + 62})`}>
                <rect x="-90" y="-20" width="180" height="40" rx="8" fill="#f3ead6" stroke="#8a6d4a" strokeWidth="2" />
                <text x="20" y="9" textAnchor="middle" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize="22" fill="#2b2118">{bowls[b]} {arNum(Math.min(NEED, rightCount(b)))}/{arNum(NEED)}</text>
                <circle cx="-66" cy="0" r={LOOK[RIGHT[b]].r * 0.7} fill={LOOK[RIGHT[b]].fill} stroke={LOOK[RIGHT[b]].edge} strokeWidth="1.5" />
              </g>
              {sel !== null && <ellipse cx={BOWL[b][0]} cy={BOWL[b][1] - 20} rx="122" ry="36" fill="none" stroke="#f0c27a" strokeWidth="5" strokeDasharray="12 8" />}
            </g>
          ))}
          {sorted.filter((b) => b.where !== 'gone').map((b) => {
            const d = drag && drag.id === b.id ? { ...b, x: drag.x, y: drag.y } : b;
            if (b.where === 'hoda') return <g key={b.id} transform="translate(0 -60)"><ButtonShape b={d} lift /></g>;
            return (
              <g key={b.id} data-button={b.kind} data-where={String(b.where)} data-by={b.by ?? ''} style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (b.where === 'pile') { tapPile(b); (e.target as Element).setPointerCapture?.(e.pointerId); setDrag({ id: b.id, x: b.x, y: b.y }); }
                  else tapInBowl(b);
                }}>
                <circle cx={d.x} cy={d.y} r={LOOK[b.kind].r + 14} fill="transparent" />
                <ButtonShape b={d} lift={sel === b.id || drag?.id === b.id} />
              </g>
            );
          })}
          {bubble && helping && <Bubble x={600} y={bed ? 150 : 170} text={bubble} />}
          {bubble && !helping && <Bubble x={600} y={250} text={bubble} tone="quiet" />}
          {hodaHolding && null}
        </g>
      </RitualFrame>
      <div className="px-2 sm:px-0 pb-4" data-panel>
        <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" data-activity="buttons">
          {ask?.kind === 'wrong' && (
            <div className="flex flex-col sm:flex-row gap-2 mb-2" role="group" aria-label="زرار في المكان الغلط">
              <button className="choice-btn !py-2" data-buttons-quiet onClick={() => answerWrong(ask.id, false)}>(ترجّعيه من غير كلام)</button>
              <button className="choice-btn !py-2" data-buttons-show onClick={() => answerWrong(ask.id, true)}>«بصّي، ده أصغر من التانيين.»</button>
            </div>
          )}
          {ask?.kind === 'red' && (
            <div className="flex flex-col sm:flex-row gap-2 mb-2" role="group" aria-label="الزرار الأحمر">
              <button className="choice-btn !py-2" data-red-keep onClick={() => answerRed(true)}>«خديه.»</button>
              <button className="choice-btn !py-2" data-red-work onClick={() => answerRed(false)}>«ده ممكن ينفع في الشغل.»</button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] text-ink/75 leading-7">{done ? 'الطلبية زراريرها جاهزة.' : sel !== null ? 'المسي السلطانية.' : 'المسي زرار، وبعدين السلطانية (أو اسحبيه).'}</p>
            <button data-buttons-done disabled={!done} onClick={finish} className="rounded-full px-5 py-2 bg-rust text-paper font-semibold disabled:opacity-40 shrink-0">خلصنا</button>
          </div>
        </div>
      </div>
    </>
  );
}
