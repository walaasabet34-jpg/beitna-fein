// Hoda (9). One rigged model (see figure.tsx) reused in every pose, so she is recognisably the same girl:
// two dark braids with red ribbons, a mustard dress with a cream collar (or the navy school pinafore),
// and whatever history her clothes have picked up in this playthrough — dust, a tear, a patch, a cardigan.
import type { Expr } from '../engine/types';
import { useId } from 'react';
import { Person, POSES, SKIN_HODA, HeadArt, type Pose, type Garment } from './figure';

export const HODA = {
  skin: SKIN_HODA.skin, skinShade: SKIN_HODA.skinShade, hair: SKIN_HODA.hair, hairHi: SKIN_HODA.hairHi,
  ribbon: '#b04a3a', dress: '#c49a3c', dressShade: '#9c7a2c', collar: '#efe3c8', sandal: '#6b3f24', ink: '#2b1d14',
};

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

export type HodaPose = 'stand' | 'sit' | 'draw' | 'bust' | keyof typeof POSES;

/** What she is wearing, with the visible history of each piece. */
export interface Look {
  dress: 'yellow' | 'navy';
  dust?: boolean; tear?: boolean; patch?: 'plain' | 'flower'; longSleeve?: boolean;
  cardigan?: boolean; ribbon?: 'old' | 'red'; redButton?: boolean; rash?: boolean;
}
export type Outfit = Look | 'mustard' | 'navy';
const toLook = (o: Outfit): Look => (typeof o === 'string' ? { dress: o === 'navy' ? 'navy' : 'yellow' } : o);

export function hodaGarment(look: Look): Garment {
  const navy = look.dress === 'navy';
  return {
    kind: 'dress', sleeve: 'short',
    color: navy ? '#34436b' : '#c79c3e', shade: navy ? '#222c48' : '#97732a', collar: '#efe3c8',
    dust: look.dust, tear: look.tear, patch: look.patch, longSleeve: navy && look.longSleeve,
    layer: look.cardigan ? { color: '#8a6f5a', shade: '#5f4a3b' } : undefined,
    shoes: navy ? '#2c2522' : '#6b3f24',
  };
}

export function Hoda({ expr = 'neutral', pose = 'stand', bag = false, doll = false, animate = true, outfit = 'mustard', schoolbag = false, poseOverride, gaze, holdR, holdL }:
  { expr?: Expr; pose?: HodaPose; bag?: boolean; doll?: boolean; animate?: boolean; outfit?: Outfit; schoolbag?: boolean; poseOverride?: Pose; gaze?: [number, number]; holdR?: React.ReactNode; holdL?: React.ReactNode }) {
  const look = toLook(outfit);
  const key = pose === 'bust' ? 'stand' : pose === 'sit' ? (doll ? 'sitHug' : 'sit') : bag && pose === 'stand' ? 'hold' : pose;
  const P = poseOverride ?? POSES[key] ?? POSES.stand;
  const ribbon = look.ribbon === 'red' ? { ribbon: '#c8392e', ribbonShade: '#7e1f18' } : { ribbon: '#a95a4c', ribbonShade: '#6e3a30' };
  const sitting = P.base === 'floor';
  return (
    <g transform={sitting ? 'translate(0 -62)' : P.base === 'chair' ? 'translate(0 -30)' : undefined}>
      {schoolbag && <path d="M60 96 L118 196" stroke="#8a6a44" strokeWidth="4" />}
      <Person build="child" pose={P} expr={expr} palette={SKIN_HODA} breathe={animate}
        head={{ style: 'braids', rash: look.rash, button: look.redButton, gaze }} braids={ribbon} garment={hodaGarment(look)}
        holdR={holdR} holdL={holdL} />
      {bag && pose === 'stand' && <Suitcase x={36} y={190} s={0.95} />}
      {doll && !bag && !sitting && <Doll x={104} y={172} s={1.1} />}
      {doll && sitting && <Doll x={70} y={236} s={1.15} />}
      {schoolbag && (
        <g>
          <path d="M104 186 h40 l-4 46 h-32 z" fill="#b9a27a" stroke="#8a6a44" strokeWidth="2" />
          <path d="M108 196 h32" stroke="#8a6a44" strokeWidth="1.5" opacity=".7" />
          <circle cx="124" cy="214" r="3" fill="#b5463a" />
        </g>
      )}
    </g>
  );
}

/** Dialogue portrait (head and shoulders in its own svg). */
export function HodaPortrait({ expr, outfit = 'mustard' }: { expr: Expr; outfit?: Outfit }) {
  return (
    <svg viewBox="44 4 72 82" className="w-full h-full" aria-hidden="true">
      <defs><radialGradient id="pbg" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#f0dcb4" /><stop offset="1" stopColor="#c9a57a" /></radialGradient></defs>
      <rect x="30" y="0" width="100" height="120" fill="url(#pbg)" />
      <Hoda expr={expr} pose="stand" outfit={outfit} animate={false} />
    </svg>
  );
}

/** Hoda lying down (asleep, or ill in bed): head on the pillow, braids on the sheet, blanket to the shoulder. */
export function HodaInBed({ expr = 'sleepy', cover = '#a56a5a', look, width = 420, hand = true }: { expr?: Expr; cover?: string; look?: Look; width?: number; hand?: boolean }) {
  const uid = 'b' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = hodaGarment(look ?? { dress: 'yellow' });
  return (
    <g>
      <ellipse cx="62" cy="62" rx="54" ry="24" fill="#efe6d4" stroke="#b9ac92" strokeWidth="2" />
      <path d="M30 40 Q4 52 10 84 Q30 76 44 84Z" fill={SKIN_HODA.hair} />
      {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={20 - i * 9} cy={86 + i * 3} rx="6" ry="5" fill={SKIN_HODA.hair} stroke={SKIN_HODA.hairHi} strokeWidth=".7" />)}
      <g transform="translate(64 50) rotate(-78) scale(1.05)">
        <HeadArt expr={expr} p={SKIN_HODA} style="braids" uid={uid} rash={look?.rash} button={look?.redButton} />
      </g>
      <path d={`M80 52 Q${width * 0.45} 30 ${width} 64 L${width} 150 L84 150 Q66 120 86 88Z`} fill={cover} stroke="#5a3a30" strokeWidth="2" />
      <path d={`M120 84 Q${width * 0.5} 66 ${width - 30} 96`} stroke="#000" strokeOpacity=".14" strokeWidth="8" fill="none" />
      <path d="M84 60 q24 -6 40 4 l-6 16 q-16 -6 -34 -2z" fill={g.color} />
      {hand && <ellipse cx="128" cy="78" rx="12" ry="8" fill={SKIN_HODA.skin} stroke="#3a2418" strokeOpacity=".4" />}
    </g>
  );
}
