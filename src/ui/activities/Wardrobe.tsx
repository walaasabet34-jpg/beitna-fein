// الهدوم: dressing Hoda for the day (and, at the end, folding her things into the suitcase).
// Clothes keep their history — dust, a tear, a patch, a sleeve that is too long — and it shows on her afterwards.
// Hoda has opinions: she argues for her own pick, refuses the red ribbon on an ordinary day, complains the wool itches.
import { useState } from 'react';
import type { DressParams, DressResult, Expr, GameState } from '../../engine/types';
import { resolveDress, wardrobe, canMend, evaluate } from '../../engine/core';
import { Hoda, Suitcase, Doll, hodaGarment, type Look } from '../../art/Hoda';
import { outfitOf, RoomShell, SockBall } from '../../art/scenes';
import { useGame } from '../../store/gameStore';
import { play } from '../../audio/sfx';
import { RitualFrame, Bubble } from './RitualFrame';

type Item = 'yellow' | 'navy' | 'cardigan' | 'ribbon';

function Garment({ look, x, y, s = 1 }: { look: Look; x: number; y: number; s?: number }) {
  const g = hodaGarment(look);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-6 -8 q6 -10 12 0" stroke="#5a4636" strokeWidth="3" fill="none" />
      <path d="M-40 6 L40 6" stroke="#5a4636" strokeWidth="4" />
      <path d="M-30 6 Q0 0 30 6 L36 40 L58 60 L46 74 L34 62 L44 170 Q0 178 -44 170 L-34 62 L-46 74 L-58 60 L-36 40Z" fill={g.color} stroke={g.shade} strokeWidth="2.5" />
      <path d="M-12 8 Q-6 20 0 10 Q6 20 12 8" fill="#efe3c8" />
      {look.dust && <ellipse cx="-10" cy="150" rx="22" ry="9" fill="#8d7656" opacity=".35" />}
      {look.tear && !look.patch && <path d="M18 168 l4 -18 l4 10 l3 -12" stroke="#2b1d14" strokeWidth="2" fill="none" />}
      {look.patch === 'plain' && <rect x="12" y="140" width="22" height="20" fill={g.shade} stroke="#efe3c8" strokeDasharray="3 3" />}
      {look.patch === 'flower' && <g transform="translate(24 150)">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-6" rx="4.5" ry="7" fill="#b5463a" transform={`rotate(${a})`} />)}<circle r="3" fill="#efe3c8" /></g>}
      {look.longSleeve && <path d="M-58 60 L-66 92 L-52 96 L-46 74Z" fill={g.color} stroke={g.shade} strokeWidth="2" />}
    </g>
  );
}

export function Wardrobe({ p, s }: { p: DressParams; s: GameState }) {
  return p.mode === 'pack' ? <Pack p={p} s={s} /> : <Dress p={p} s={s} />;
}

function Dress({ p, s }: { p: DressParams; s: GameState }) {
  const act = useGame((g) => g.act);
  const w0 = wardrobe(s);
  const [yellow, setYellow] = useState(w0.yellow);
  const [navy, setNavy] = useState(w0.navy);
  // Her own pick for the day: the uniform for school if it fits, otherwise the yellow dress.
  const herPick: 'yellow' | 'navy' = p.school && w0.navy === 'fitted' ? 'navy' : p.school ? 'navy' : 'yellow';
  const [dress, setDress] = useState<'yellow' | 'navy'>(herPick);
  const [layer, setLayer] = useState<'none' | 'cardigan'>('none');
  const [ribbon, setRibbon] = useState<'old' | 'red'>('old');
  const [mended, setMended] = useState<string[]>([]);
  const [insisted, setInsisted] = useState(false);
  const [mendMenu, setMendMenu] = useState<null | 'yellow' | 'navy'>(null);
  const [ribbonNo, setRibbonNo] = useState(0);
  const [cardiganNo, setCardiganNo] = useState(false);
  const [say, setSay] = useState<{ t: string; e: Expr }>(() => ({ t: herPick === 'navy' ? (w0.navy === 'loose' ? 'الكم طويل…' : 'المريلة!') : 'الأصفر!', e: herPick === 'navy' && w0.navy === 'loose' ? 'worried' : 'smile' }));
  const base = outfitOf(s);
  const look: Look = {
    ...base, dress,
    dust: dress === 'yellow' && yellow === 'dusty', tear: dress === 'yellow' && yellow === 'torn',
    patch: dress === 'yellow' ? (yellow === 'flower' ? 'flower' : yellow === 'mended' ? 'plain' : undefined) : undefined,
    longSleeve: dress === 'navy' && navy === 'loose', cardigan: layer === 'cardigan', ribbon,
  };

  const wear = (it: Item) => {
    play('fabric');
    if (it === 'yellow' || it === 'navy') {
      setDress(it);
      if (it !== herPick) setInsisted(true);
      if (it === 'navy') setSay(navy === 'loose' ? { t: 'الكم طويل…', e: 'worried' } : { t: 'زي البنات!', e: 'proud' });
      else if (p.school) setSay({ t: 'بالأصفر؟ هيقولوا…', e: 'worried' });
      else setSay(yellow === 'torn' ? { t: 'الشق باين', e: 'sad' } : yellow === 'flower' ? { t: 'بوردتي!', e: 'laugh' } : { t: 'ده بتاعي', e: 'smile' });
    }
    if (it === 'cardigan') {
      if (layer === 'cardigan') { setLayer('none'); setSay({ t: 'أحسن', e: 'smile' }); return; }
      setLayer('cardigan');
      if (!cardiganNo && !p.cold) { setCardiganNo(true); setSay({ t: 'بيشوّك! والجو مش برد', e: 'bored' }); }
      else setSay(p.cold ? { t: 'بيشوّك… بس دافي', e: 'neutral' } : { t: 'طيب…', e: 'bored' });
    }
    if (it === 'ribbon') {
      if (ribbon === 'red') { setRibbon('old'); setSay({ t: 'كده', e: 'smile' }); return; }
      if (!p.special && ribbonNo === 0) { setRibbonNo(1); setSay({ t: 'دي لما ماما تيجي', e: 'guarded' }); return; }
      setRibbon('red'); if (!p.special) setInsisted(true);
      setSay(p.special ? { t: 'النهارده ينفع', e: 'proud' } : { t: 'طيب… النهارده بس', e: 'neutral' });
    }
  };
  const mend = (it: 'yellow' | 'navy', how: 'plain' | 'flower' | 'sleeve') => {
    play('sewing'); setMendMenu(null);
    setMended((m) => [...new Set([...m, it])]);
    if (it === 'yellow') { setYellow(how === 'flower' ? 'flower' : 'mended'); setDress('yellow'); setSay(how === 'flower' ? { t: 'وردة! زي زوزو', e: 'laugh' } : { t: 'مش باين خالص', e: 'smile' }); }
    else { setNavy('fitted'); setDress('navy'); setSay({ t: 'على قدّي!', e: 'proud' }); }
  };
  const finish = () => {
    const r: DressResult = { outfit: dress, layer, ribbon, mended, insisted };
    // the flower patch needs the flag before resolving (the engine records which patch was used)
    act((ic, gs) => resolveDress(ic, mended.includes('yellow') && yellow === 'flower' ? { ...gs, flags: { ...gs.flags, patch_flower: true } } : gs, r));
  };

  const canYellow = canMend({ ...s, flags: { ...s.flags, cl_yellow: yellow } }, 'yellow');
  const canNavy = canMend({ ...s, flags: { ...s.flags, cl_navy: navy } }, 'navy');
  const rail: { it: Item; x: number; label: string; show: boolean }[] = [
    { it: 'yellow', x: 620, label: 'الأصفر', show: true },
    { it: 'navy', x: 740, label: 'المريلة', show: true },
    { it: 'cardigan', x: 660, label: 'الجاكتة', show: w0.cardigan },
  ];

  return (
    <>
      <RitualFrame s={s} label="لبس هدى" focusX={600}>
        <RoomShell s={s} slot={Math.min(s.slot, 3)} morning={s.slot === 0}>
          <rect x="590" y="120" width="260" height="10" rx="4" fill="#5a4636" />
          {rail.filter((r) => r.show).map((r) => (
            <g key={r.it} data-wear={r.it} style={{ cursor: 'pointer' }} opacity={(r.it === dress || (r.it === 'cardigan' && layer === 'cardigan')) ? 0.45 : 1}
              onPointerDown={(e) => { e.stopPropagation(); wear(r.it); }}>
              {r.it === 'cardigan'
                ? <g transform={`translate(${r.x} 430)`}><path d="M-34 -40 L-12 -46 L0 -20 L12 -46 L34 -40 L52 6 L40 12 L32 -6 L30 44 L-30 44 L-32 -6 L-40 12 L-52 6Z" fill="#8a6f5a" stroke="#5f4a3b" strokeWidth="3" />{[-10, 4, 18, 32].map((b) => <circle key={b} cx="4" cy={b} r="2.6" fill="#d8c8a8" />)}<path d="M-28 30 h56" stroke="#5f4a3b" strokeWidth="2" strokeDasharray="4 3" /></g>
                : <Garment look={r.it === 'yellow' ? { dress: 'yellow', dust: yellow === 'dusty', tear: yellow === 'torn', patch: yellow === 'flower' ? 'flower' : yellow === 'mended' ? 'plain' : undefined } : { dress: 'navy', longSleeve: navy === 'loose' }} x={r.x} y={132} s={0.72} />}
              <rect x={r.x - 56} y={r.it === 'cardigan' ? 506 : 268} width="112" height="34" rx="10" fill="#fff8ea" opacity=".92" />
              <text x={r.x} y={r.it === 'cardigan' ? 530 : 292} textAnchor="middle" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize="20" fill="#2b2118">{r.label}</text>
            </g>
          ))}
          <g data-wear="ribbon" style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); wear('ribbon'); }}>
            <rect x="600" y="560" width="200" height="60" rx="8" fill="#a07a48" stroke="#6b4a2f" strokeWidth="2" />
            <path d="M636 590 l-16 -10 v20z M636 590 l16 -10 v20z" fill="#c8392e" /><circle cx="636" cy="590" r="4" fill="#7e1f18" />
            <text x="720" y="598" textAnchor="middle" fontFamily="'Noto Naskh Arabic', serif" fontSize="20" fill="#fff8ea">الشريطة الحمرا</text>
          </g>
          {(canYellow || canNavy) && (
            <g data-mend style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); setMendMenu(canYellow && (dress === 'yellow' || !canNavy) ? 'yellow' : 'navy'); }}>
              <circle cx="790" cy="420" r="36" fill="#fff8ea" stroke="#9c4a33" strokeWidth="3" />
              <path d="M770 440 L812 398" stroke="#555" strokeWidth="4" strokeLinecap="round" /><ellipse cx="808" cy="402" rx="3" ry="6" fill="none" stroke="#555" strokeWidth="2" transform="rotate(45 808 402)" />
              <path d="M812 398 q20 10 10 30 q-10 20 10 30" stroke="#b5463a" strokeWidth="2" fill="none" />
              <rect x="745" y="462" width="90" height="32" rx="10" fill="#fff8ea" opacity=".92" />
              <text x="790" y="485" textAnchor="middle" fontFamily="'Noto Naskh Arabic', serif" fontSize="20" fill="#2b2118">تصليح</text>
            </g>
          )}
          <g transform="translate(350 170) scale(1.5)"><Hoda pose="stand" expr={say.e} outfit={look} /></g>
          <Bubble x={470} y={200} text={say.t} />
          {p.today && <g><rect x="420" y="740" width="360" height="42" rx="12" fill="#14181f" opacity=".62" /><text x="600" y="769" textAnchor="middle" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize="20" fill="#f3e7d1">{p.today}</text></g>}
        </RoomShell>
      </RitualFrame>
      <div className="px-2 sm:px-0 pb-4" data-panel>
        <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in" data-activity="dress">
          {mendMenu === 'yellow' && (
            <div className="flex flex-col sm:flex-row gap-2 mb-2" role="group" aria-label="تصليح الفستان">
              <button className="choice-btn !py-2" data-mend-plain onClick={() => mend('yellow', 'plain')}>رقعة من قماش قريب من لونه</button>
              <button className="choice-btn !py-2" data-mend-flower onClick={() => mend('yellow', 'flower')}>وردة من حتة الستان الأحمر</button>
            </div>
          )}
          {mendMenu === 'navy' && (
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <button className="choice-btn !py-2" data-mend-sleeve onClick={() => mend('navy', 'sleeve')}>تقصّري الكم الطويل على مقاسها</button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] text-ink/75 leading-7">المسي الهدوم عشان تلبّسيها. التصليح بإبرتك وخيطك.</p>
            <button data-dress-done onClick={finish} className="rounded-full px-5 py-2 bg-rust text-paper font-semibold shrink-0">{p.school ? 'يلا عالمدرسة' : 'كده تمام'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

const PACK_ITEMS = ['yellow', 'navy', 'cardigan', 'comb', 'notebook', 'doll', 'redButton', 'ribbon', 'ball'] as const;
type PackItem = typeof PACK_ITEMS[number];

function Pack({ p, s }: { p: DressParams; s: GameState }) {
  const act = useGame((g) => g.act);
  const w = wardrobe(s);
  const avail = PACK_ITEMS.filter((it) => (it === 'cardigan' ? w.cardigan : it === 'doll' ? !!s.flags.made_doll : it === 'redButton' ? s.flags.red_button === 'hoda' : it === 'ball' ? !!(s.flags.ball_games || s.flags.ball_stairs) : true));
  const [packed, setPacked] = useState<PackItem[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const capFor = (it: string) => p.captions?.find((c) => c.item === it && evaluate(c.if, s))?.text ?? null;
  const fold = (it: PackItem) => { if (packed.includes(it)) return; play('fabric'); setPacked((x) => [...x, it]); setCaption(capFor(it)); };
  const pos: Record<PackItem, [number, number]> = { yellow: [440, 260], navy: [600, 250], cardigan: [760, 250], comb: [430, 470], notebook: [590, 470], doll: [760, 450], redButton: [430, 380], ribbon: [770, 380], ball: [600, 380] };
  const all = packed.length === avail.length;
  return (
    <>
      <RitualFrame s={s} label="حاجات هدى">
        <g>
          <rect width="1200" height="800" fill="#b39a7a" /><rect width="1200" height="800" fill="url(#tiles)" opacity=".8" />
          <rect width="1200" height="800" fill="#2a2018" opacity=".12" />
          <g transform="translate(490 560) scale(2.4)"><Suitcase open={false} /></g>
          <path d="M490 584 h221 l-8 -60 h-205z" fill="#3e2414" opacity={packed.length ? 0.55 : 0.35} />
          {avail.filter((it) => !packed.includes(it)).map((it) => {
            const [x, y] = pos[it];
            return (
              <g key={it} data-pack={it} style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); fold(it); }}>
                <circle cx={x} cy={y} r="62" fill="transparent" />
                {it === 'yellow' && <Garment look={{ dress: 'yellow', tear: w.yellow === 'torn', patch: w.yellow === 'flower' ? 'flower' : w.yellow === 'mended' ? 'plain' : undefined }} x={x} y={y - 80} s={0.55} />}
                {it === 'navy' && <Garment look={{ dress: 'navy', longSleeve: w.navy === 'loose' }} x={x} y={y - 80} s={0.55} />}
                {it === 'cardigan' && <g transform={`translate(${x} ${y - 20})`}><path d="M-34 -40 L-12 -46 L0 -20 L12 -46 L34 -40 L52 6 L40 12 L32 -6 L30 44 L-30 44 L-32 -6 L-40 12 L-52 6Z" fill="#8a6f5a" stroke="#5f4a3b" strokeWidth="3" />{[-10, 4, 18, 32].map((b) => <circle key={b} cx="4" cy={b} r="2.6" fill="#d8c8a8" />)}<path d="M-28 30 h56" stroke="#5f4a3b" strokeWidth="2" strokeDasharray="4 3" /></g>}
                {it === 'comb' && <g transform={`translate(${x} ${y})`}><rect x="-50" y="-10" width="100" height="16" rx="4" fill="#3a2a22" />{Array.from({ length: 16 }, (_, i) => (i === 9 ? null : <rect key={i} x={-46 + i * 6} y="6" width="3" height="16" fill="#3a2a22" />))}</g>}
                {it === 'notebook' && <g transform={`translate(${x} ${y}) scale(.9)`}><rect x="-50" y="-36" width="100" height="72" rx="3" fill="#3f6a96" /><rect x="-46" y="-32" width="92" height="64" fill="none" stroke="#e9e1cf" strokeWidth="1.5" /></g>}
                {it === 'doll' && <Doll x={x - 18} y={y - 40} s={2.4} />}
                {it === 'redButton' && <circle cx={x} cy={y} r="18" fill="#c0352b" stroke="#7a1c16" strokeWidth="2" />}
                {it === 'ball' && <SockBall x={x} y={y} r={18} />}
                {it === 'ribbon' && <path d={`M${x} ${y} l-24 -14 v28z M${x} ${y} l24 -14 v28z`} fill="#c8392e" />}
              </g>
            );
          })}
          {caption && <g className="fade-in" key={caption}><rect x="370" y="118" width="460" height="64" rx="14" fill="#14181f" opacity=".72" /><text x="600" y="158" textAnchor="middle" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize={caption.length > 30 ? 18 : 22} fill="#f3e7d1">{caption}</text></g>}
          <rect width="1200" height="800" fill="url(#vignette)" pointerEvents="none" />
        </g>
      </RitualFrame>
      <div className="px-2 sm:px-0 pb-4" data-panel>
        <div className="paper paper-edge rounded-2xl p-3 sm:p-4 fade-in flex items-center justify-between gap-3" data-activity="pack">
          <p className="text-[15px] text-ink/75 leading-7">{all ? '' : 'المسي كل حاجة عشان تطبّقيها وتحطّيها في الشنطة.'}</p>
          <button data-pack-done disabled={!all} onClick={() => act((ic, gs) => resolveDress(ic, gs, { outfit: 'yellow', layer: 'none', ribbon: 'old', mended: [], packed }))}
            className="rounded-full px-5 py-2 bg-rust text-paper font-semibold disabled:opacity-40 shrink-0">اقفلي الشنطة</button>
        </div>
      </div>
    </>
  );
}
