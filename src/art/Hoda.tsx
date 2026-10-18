// TEMP ART — original placeholder illustration of Hoda (9). One model, reused in every pose,
// so her look stays consistent: two dark braids with faded red ribbons, mustard dress with a
// cream collar, dusty hem, brown sandals.
import type { Expr } from '../engine/types';

export const HODA = {
  skin: '#c48d64', skinShade: '#a8714c', hair: '#2a1a12', hairHi: '#4a3020',
  ribbon: '#b04a3a', dress: '#c49a3c', dressShade: '#a47e2e', collar: '#efe3c8',
  sandal: '#6b3f24', blush: '#d9826a', ink: '#2b1d14',
};

export function Face({ expr }: { expr: Expr }) {
  const c = HODA;
  const ex = expr;
  // eye geometry
  const eyeY = ex === 'guarded' || ex === 'focused' ? 64 : ex === 'surprised' ? 61 : 62;
  const eyeR = ex === 'surprised' ? 4.2 : 3.4;
  const closed = ex === 'laugh' || ex === 'sleepy';
  const brow = {
    neutral: ['M62 52 Q69 49 76 52', 'M84 52 Q91 49 98 52'],
    guarded: ['M62 54 Q69 52 76 54', 'M84 54 Q91 52 98 54'],
    sad: ['M62 53 Q69 52 76 49', 'M84 49 Q91 52 98 53'],
    worried: ['M62 54 Q69 51 76 47', 'M84 47 Q91 51 98 54'],
    smile: ['M62 51 Q69 48 76 51', 'M84 51 Q91 48 98 51'],
    laugh: ['M62 50 Q69 47 76 50', 'M84 50 Q91 47 98 50'],
    surprised: ['M62 48 Q69 44 76 48', 'M84 48 Q91 44 98 48'],
    upset: ['M62 50 Q69 52 76 55', 'M84 55 Q91 52 98 50'],
    sleepy: ['M62 54 Q69 53 76 54', 'M84 54 Q91 53 98 54'],
    focused: ['M62 53 Q69 51 76 53', 'M84 53 Q91 51 98 53'],
  }[ex];
  const mouth = {
    neutral: <path d="M73 83 Q80 85 87 83" stroke={c.ink} strokeWidth="2" fill="none" strokeLinecap="round" />,
    guarded: <path d="M74 84 L86 84" stroke={c.ink} strokeWidth="2" fill="none" strokeLinecap="round" />,
    sad: <path d="M73 86 Q80 81 87 86" stroke={c.ink} strokeWidth="2" fill="none" strokeLinecap="round" />,
    worried: <ellipse cx="80" cy="85" rx="3.5" ry="2.6" fill="#5a2a22" />,
    smile: <path d="M71 81 Q80 89 89 81" stroke={c.ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />,
    laugh: <path d="M70 80 Q80 94 90 80 Z" fill="#6a2a24" stroke={c.ink} strokeWidth="1.5" strokeLinejoin="round" />,
    surprised: <ellipse cx="80" cy="85" rx="4" ry="5" fill="#5a2a22" />,
    upset: <path d="M72 86 Q80 81 88 86" stroke={c.ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />,
    sleepy: <path d="M76 84 Q80 86 84 84" stroke={c.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" />,
    focused: (
      <g>
        <path d="M74 84 Q80 85 86 84" stroke={c.ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="86.5" cy="86" rx="2.6" ry="2" fill="#d77c74" />
      </g>
    ),
  }[ex];
  return (
    <g>
      {brow.map((d, i) => <path key={i} d={d} stroke={c.hair} strokeWidth="2.6" fill="none" strokeLinecap="round" />)}
      {closed ? (
        <g stroke={c.ink} strokeWidth="2.2" fill="none" strokeLinecap="round">
          {ex === 'laugh'
            ? <><path d="M64 63 Q69 58 74 63" /><path d="M86 63 Q91 58 96 63" /></>
            : <><path d="M64 63 Q69 66 74 63" /><path d="M86 63 Q91 66 96 63" /></>}
        </g>
      ) : (
        <g>
          <ellipse cx="69" cy={eyeY} rx={eyeR + 1.6} ry={eyeR + 0.8} fill="#f6efe2" />
          <ellipse cx="91" cy={eyeY} rx={eyeR + 1.6} ry={eyeR + 0.8} fill="#f6efe2" />
          <circle cx={ex === 'guarded' ? 68 : 69} cy={eyeY + (ex === 'guarded' || ex === 'focused' ? 1.4 : 0)} r={eyeR} fill={c.ink} />
          <circle cx={ex === 'guarded' ? 90 : 91} cy={eyeY + (ex === 'guarded' || ex === 'focused' ? 1.4 : 0)} r={eyeR} fill={c.ink} />
          <circle cx="70.3" cy={eyeY - 1.2} r="1" fill="#fff" opacity=".8" />
          <circle cx="92.3" cy={eyeY - 1.2} r="1" fill="#fff" opacity=".8" />
          {(ex === 'guarded' || ex === 'focused') && (
            <g fill={c.skin}><rect x="62" y={eyeY - 7} width="15" height="5.2" rx="2" /><rect x="84" y={eyeY - 7} width="15" height="5.2" rx="2" /></g>
          )}
          {/* eyelids for blinking */}
          <g className="blink" fill={c.skin}>
            <ellipse cx="69" cy={eyeY} rx={eyeR + 2.2} ry={eyeR + 1.4} />
            <ellipse cx="91" cy={eyeY} rx={eyeR + 2.2} ry={eyeR + 1.4} />
          </g>
        </g>
      )}
      <ellipse cx="62" cy="74" rx="6" ry="3.5" fill={c.blush} opacity={ex === 'upset' || ex === 'laugh' ? 0.55 : 0.28} />
      <ellipse cx="98" cy="74" rx="6" ry="3.5" fill={c.blush} opacity={ex === 'upset' || ex === 'laugh' ? 0.55 : 0.28} />
      <path d="M79 66 Q77 74 80 76" stroke={c.skinShade} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {mouth}
    </g>
  );
}

/** Head + braids (back hair drawn first, braids last). Local coords: head centre ≈ (80,64). */
export function Head({ expr }: { expr: Expr }) {
  const c = HODA;
  return (
    <g>
      {/* back hair */}
      <path d="M44 66 Q42 22 80 20 Q118 22 116 66 Q114 84 108 92 L52 92 Q46 84 44 66Z" fill={c.hair} />
      {/* ears */}
      <ellipse cx="48" cy="68" rx="5" ry="8" fill={c.skinShade} />
      <ellipse cx="112" cy="68" rx="5" ry="8" fill={c.skinShade} />
      {/* face */}
      <path d="M50 62 Q50 30 80 30 Q110 30 110 62 Q110 98 80 101 Q50 98 50 62Z" fill={c.skin} />
      {/* fringe with middle parting */}
      <path d="M48 58 Q50 26 80 24 Q110 26 112 58 Q104 40 82 36 L80 46 L78 36 Q56 40 48 58Z" fill={c.hair} />
      <path d="M80 25 L80 44" stroke={c.hairHi} strokeWidth="1.2" opacity=".6" />
      <Face expr={expr} />
    </g>
  );
}

function Braids({ long = true }: { long?: boolean }) {
  const c = HODA;
  const len = long ? 70 : 52;
  const braid = (x: number, dir: number) => (
    <g>
      <path d={`M${x} 84 q${dir * 6} ${len / 2} ${dir * 2} ${len}`} stroke={c.hair} strokeWidth="11" fill="none" strokeLinecap="round" />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${x + dir * (1 + i * 0.6) - 5} ${92 + i * (len / 6)} q5 4 10 0`} stroke={c.hairHi} strokeWidth="1.2" fill="none" opacity=".7" />
      ))}
      <g transform={`translate(${x + dir * 2} ${84 + len})`}>
        <path d="M0 0 l-9 -6 l0 12 Z M0 0 l9 -6 l0 12 Z" fill={c.ribbon} opacity=".9" />
        <circle r="2.6" fill="#8e3a2e" />
      </g>
    </g>
  );
  return <g>{braid(51, -1)}{braid(109, 1)}</g>;
}

export function Suitcase({ x = 0, y = 0, s = 1, open = false }: { x?: number; y?: number; s?: number; open?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M26 6 Q26 -8 40 -8 L52 -8 Q66 -8 66 6" stroke="#4a2c18" strokeWidth="5" fill="none" />
      <rect x="0" y="4" width="92" height="62" rx="7" fill="#7b4a2a" />
      <rect x="0" y="4" width="92" height="62" rx="7" fill="url(#leather)" opacity=".5" />
      <rect x="0" y="20" width="92" height="4" fill="#5d3620" opacity=".7" />
      {[18, 70].map((sx) => <rect key={sx} x={sx} y="4" width="6" height="62" fill="#5a3420" />)}
      {[[2, 6], [84, 6], [2, 58], [84, 58]].map(([cx, cy], i) => <rect key={i} x={cx} y={cy} width="6" height="6" rx="1.5" fill="#b08d4a" />)}
      <rect x="40" y="16" width="12" height="9" rx="2" fill={open ? '#8f7339' : '#b08d4a'} />
      <path d="M6 60 Q40 64 86 58" stroke="#a87a50" strokeWidth="1" opacity=".4" fill="none" />
    </g>
  );
}

export function Doll({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M2 18 Q10 6 18 18 L22 40 L-2 40Z" fill="#b5463a" />
      <circle cx="10" cy="10" r="8" fill="#efe3c8" />
      <path d="M2 8 Q10 -2 18 8" stroke="#6a7a8a" strokeWidth="4" fill="none" strokeDasharray="2 2" />
      <circle cx="7" cy="10" r="1.3" fill="#2b1d14" /><circle cx="13" cy="9.4" r="0.9" fill="#2b1d14" />
      <path d="M7 14 Q10 15 13 13" stroke="#2b1d14" strokeWidth=".9" fill="none" />
    </g>
  );
}

export type HodaPose = 'stand' | 'sit' | 'draw' | 'bust';

/** Full Hoda. Local box: 160 × 320 (stand) – callers translate/scale. */
export type Outfit = 'mustard' | 'navy';
const NAVY = { dress: '#33426a', dressShade: '#26314f' };

export function Hoda({ expr = 'neutral', pose = 'stand', bag = false, doll = false, animate = true, outfit = 'mustard', schoolbag = false }:
  { expr?: Expr; pose?: HodaPose; bag?: boolean; doll?: boolean; animate?: boolean; outfit?: Outfit; schoolbag?: boolean }) {
  const c = outfit === 'navy' ? { ...HODA, ...NAVY } : HODA;
  const body = (
    <g className={animate ? 'breathe' : undefined}>
      <Braids long={pose !== 'bust'} />
      {/* neck */}
      <rect x="72" y="92" width="16" height="14" fill={c.skinShade} />
      {/* dress top */}
      {pose === 'stand' || pose === 'bust' ? (
        <path d="M52 104 Q80 98 108 104 L124 232 Q80 240 36 232Z" fill={c.dress} />
      ) : (
        <path d="M52 104 Q80 98 108 104 L118 186 Q80 192 42 186Z" fill={c.dress} />
      )}
      <path d="M52 104 Q60 160 50 228" stroke={c.dressShade} strokeWidth="5" fill="none" opacity=".45" />
      {/* collar */}
      <path d="M68 103 Q74 114 80 106 Q86 114 92 103 Q86 99 80 100 Q74 99 68 103Z" fill={c.collar} />
      {/* sleeves */}
      <path d="M52 104 Q40 108 40 132 L56 134Z" fill={c.dressShade} />
      <path d="M108 104 Q120 108 120 132 L104 134Z" fill={c.dressShade} />
      {/* buttons */}
      {[122, 138, 154].map((by) => <circle key={by} cx="80" cy={by} r="2" fill={c.collar} opacity=".8" />)}
      {/* dust on the hem */}
      {pose === 'stand' && outfit === 'mustard' && <g fill="#8a7458" opacity=".28"><ellipse cx="58" cy="222" rx="14" ry="5" /><ellipse cx="104" cy="226" rx="10" ry="4" /></g>}
    </g>
  );

  if (pose === 'bust') {
    return (
      <g>
        {body}
        <path d="M42 130 L40 150 M118 130 L120 150" stroke={c.skin} strokeWidth="11" strokeLinecap="round" />
        <Head expr={expr} />
      </g>
    );
  }

  if (pose === 'stand') {
    return (
      <g className={animate ? 'sway' : undefined}>
        {/* legs */}
        <rect x="62" y="228" width="13" height="64" rx="5" fill={c.skin} />
        <rect x="86" y="228" width="13" height="64" rx="5" fill={c.skin} />
        <rect x="62" y="270" width="13" height="16" fill="#efe3c8" />
        <rect x="86" y="270" width="13" height="16" fill="#efe3c8" />
        <path d="M56 288 h24 v10 h-24z M82 288 h24 v10 h-24z" fill={c.sandal} />
        {body}
        {/* arms – both hands come to the front when holding the suitcase */}
        {bag ? (
          <>
            <path d="M46 130 Q44 180 70 214" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M114 130 Q116 180 90 214" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
            <Suitcase x={36} y={214} s={0.95} />
          </>
        ) : (
          <>
            <path d="M46 130 Q40 178 46 210" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M114 130 Q120 178 114 210" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
          </>
        )}
        {doll && !bag && <Doll x={100} y={180} s={1.1} />}
        {schoolbag && (
          <g>
            <path d="M60 104 L118 196" stroke="#8a6a44" strokeWidth="5" />
            <path d="M104 186 h40 l-4 46 h-32 z" fill="#b9a27a" stroke="#8a6a44" strokeWidth="2" />
            <path d="M108 196 h32" stroke="#8a6a44" strokeWidth="1.5" opacity=".7" />
          </g>
        )}
        <Head expr={expr} />
      </g>
    );
  }

  // sitting (on floor / sofa) and drawing
  return (
    <g>
      {/* folded legs */}
      <path d="M40 184 Q30 214 66 220 L130 222 Q146 220 140 206 L116 186Z" fill={c.dress} />
      <path d="M56 216 L136 220" stroke={c.dressShade} strokeWidth="4" opacity=".5" />
      <ellipse cx="140" cy="222" rx="13" ry="7" fill={c.sandal} />
      <ellipse cx="128" cy="226" rx="12" ry="6" fill={c.sandal} />
      {body}
      {pose === 'draw' ? (
        <>
          <g transform="rotate(-8 80 200)">
            <rect x="46" y="168" width="70" height="46" rx="2" fill="#f4ecd8" stroke="#b9a37f" />
            {[178, 186, 194, 202].map((ly) => <line key={ly} x1="50" x2="112" y1={ly} y2={ly} stroke="#9fb6c9" strokeWidth=".8" />)}
            <path d="M58 200 l10 -14 l10 14 z M88 196 q6 -6 12 0" stroke="#555" strokeWidth="1.2" fill="none" />
          </g>
          <path d="M46 130 Q40 170 62 192" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M114 130 Q122 168 98 190" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
          <line x1="96" y1="190" x2="108" y2="172" stroke="#c9a347" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M46 130 Q38 170 58 196" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M114 130 Q124 170 104 196" stroke={c.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
        </>
      )}
      {doll && pose !== 'draw' && <Doll x={70} y={160} s={1.2} />}
      <g transform={pose === 'draw' ? 'rotate(6 80 92) translate(0 4)' : undefined}><Head expr={expr} /></g>
    </g>
  );
}

/** Dialogue portrait (bust in its own svg). */
export function HodaPortrait({ expr, outfit = 'mustard' }: { expr: Expr; outfit?: Outfit }) {
  return (
    <svg viewBox="30 12 100 120" className="w-full h-full" aria-hidden="true">
      <defs><radialGradient id="pbg" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#f0dcb4" /><stop offset="1" stopColor="#c9a57a" /></radialGradient></defs>
      <rect x="30" y="12" width="100" height="120" fill="url(#pbg)" />
      <Hoda expr={expr} pose="bust" outfit={outfit} />
    </svg>
  );
}
