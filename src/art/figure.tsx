// A small 2D rig for every person in the game. One skeleton per body type, joint angles for poses,
// tapered limbs with directional shading and a face built from muscles (brows, lids, gaze, mouth),
// so Hoda looks like the same girl in every scene and every pose is something she can actually do.
import { useId, type ReactNode } from 'react';
import type { Expr } from '../engine/types';

type V = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const dirL = (deg: number, len: number): V => [-Math.sin(rad(deg)) * len, Math.cos(rad(deg)) * len];
const dirR = (deg: number, len: number): V => [Math.sin(rad(deg)) * len, Math.cos(rad(deg)) * len];
const f = (n: number) => Math.round(n * 10) / 10;

/** Tapered capsule between two points (limbs). */
export function capsule(a: V, b: V, r1: number, r2: number): string {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const p1: V = [a[0] + nx * r1, a[1] + ny * r1], p2: V = [b[0] + nx * r2, b[1] + ny * r2];
  const p3: V = [b[0] - nx * r2, b[1] - ny * r2], p4: V = [a[0] - nx * r1, a[1] - ny * r1];
  return `M${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])} A${r2} ${r2} 0 0 0 ${f(p3[0])} ${f(p3[1])} L${f(p4[0])} ${f(p4[1])} A${r1} ${r1} 0 0 0 ${f(p1[0])} ${f(p1[1])}Z`;
}

// ── Body types ─────────────────────────────────────────────
interface Build {
  head: V; headScale: number; neck: V; shL: V; shR: V; hipC: V; hipL: V; hipR: V;
  upper: number; fore: number; hand: number; thigh: number; shin: number;
  r: { sh: number; el: number; wr: number; hip: number; kn: number; an: number };
  waistY: number; hemY: number; chest: number; hips: number;
}
const CHILD: Build = {
  head: [80, 40], headScale: 1, neck: [80, 66], shL: [58, 84], shR: [102, 84], hipC: [80, 172], hipL: [71, 174], hipR: [89, 174],
  upper: 47, fore: 41, hand: 12, thigh: 60, shin: 56, r: { sh: 7.6, el: 6, wr: 4.8, hip: 9.4, kn: 6.8, an: 4.8 },
  waistY: 132, hemY: 246, chest: 22, hips: 22,
};
const WOMAN: Build = {
  head: [80, 34], headScale: 1.16, neck: [80, 66], shL: [53, 84], shR: [107, 84], hipC: [80, 210], hipL: [69, 212], hipR: [91, 212],
  upper: 64, fore: 56, hand: 16, thigh: 92, shin: 84, r: { sh: 9, el: 6.6, wr: 5, hip: 13, kn: 8.5, an: 5.5 },
  waistY: 158, hemY: 386, chest: 29, hips: 34,
};
const MAN: Build = { ...WOMAN, shL: [50, 86], shR: [110, 86], chest: 31, hips: 28, hemY: 300 };
export const BUILDS = { child: CHILD, woman: WOMAN, man: MAN };

// ── Poses ──────────────────────────────────────────────────
export interface Pose {
  /** Upper-arm angle from hanging (deg, + = away from the body / up) and elbow bend (+ = forearm swings in). */
  armL: [number, number]; armR: [number, number];
  legL: [number, number]; legR: [number, number];
  /** Upper-body tilt around the hips, head tilt, and gaze (-1..1). */
  lean: number; tilt: number; gaze?: V;
  /** How the legs are drawn: standing kinematics, cross-legged on the floor, on a chair, kneeling. */
  base?: 'stand' | 'floor' | 'chair' | 'kneel';
  /** Small lift of the whole body (jumps). */
  lift?: number;
}
export const POSES: Record<string, Pose> = {
  stand: { armL: [6, 6], armR: [6, 6], legL: [2, 0], legR: [2, 0], lean: 0, tilt: 0 },
  shy: { armL: [10, 70], armR: [12, 74], legL: [1, 0], legR: [3, 2], lean: -2, tilt: -6, gaze: [0.4, 0.6] },
  hold: { armL: [12, 58], armR: [12, 58], legL: [2, 0], legR: [2, 0], lean: 0, tilt: 2 },
  ready: { armL: [26, 70], armR: [26, 70], legL: [6, 6], legR: [6, 6], lean: 0, tilt: 0, gaze: [0, -0.2] },
  catch: { armL: [150, 20], armR: [150, 20], legL: [6, 0], legR: [6, 0], lean: 0, tilt: -8, gaze: [0, -1], lift: 8 },
  catchLow: { armL: [30, 80], armR: [30, 80], legL: [10, 14], legR: [10, 14], lean: 3, tilt: 6, gaze: [0, 0.8] },
  throw: { armL: [18, 10], armR: [158, 52], legL: [4, 0], legR: [8, 8], lean: -6, tilt: 4, gaze: [0, -0.3] },
  throwFollow: { armL: [16, 30], armR: [70, 10], legL: [8, 6], legR: [3, 0], lean: 6, tilt: 2 },
  cheer: { armL: [160, -10], armR: [160, -10], legL: [8, 0], legR: [8, 0], lean: 0, tilt: -4, lift: 14 },
  point: { armL: [6, 8], armR: [80, 4], legL: [2, 0], legR: [3, 0], lean: 2, tilt: 4 },
  reach: { armL: [8, 10], armR: [62, -6], legL: [2, 0], legR: [4, 0], lean: 5, tilt: 4 },
  handsHips: { armL: [40, 120], armR: [40, 120], legL: [5, 0], legR: [5, 0], lean: 0, tilt: -4 },
  sit: { armL: [10, 60], armR: [10, 60], legL: [0, 0], legR: [0, 0], lean: 0, tilt: 0, base: 'floor' },
  sitHug: { armL: [24, 104], armR: [24, 104], legL: [0, 0], legR: [0, 0], lean: 6, tilt: 10, base: 'floor', gaze: [0.2, 0.6] },
  sort: { armL: [30, 52], armR: [42, 34], legL: [0, 0], legR: [0, 0], lean: 10, tilt: 14, base: 'floor', gaze: [0, 1] },
  draw: { armL: [24, 70], armR: [34, 54], legL: [0, 0], legR: [0, 0], lean: 12, tilt: 16, base: 'floor', gaze: [0.1, 1] },
  sitChair: { armL: [14, 64], armR: [14, 64], legL: [0, 0], legR: [0, 0], lean: 0, tilt: 0, base: 'chair' },
  sewing: { armL: [26, 70], armR: [30, 66], legL: [0, 0], legR: [0, 0], lean: 8, tilt: 12, base: 'chair', gaze: [0, 1] },
  kneel: { armL: [16, 40], armR: [30, 60], legL: [0, 0], legR: [0, 0], lean: 4, tilt: 8, base: 'kneel' },
  carryBag: { armL: [8, 4], armR: [10, 2], legL: [2, 0], legR: [5, 2], lean: -3, tilt: 0 },
};
export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const m = (x: number, y: number) => x + (y - x) * t;
  const m2 = (x: [number, number], y: [number, number]): [number, number] => [m(x[0], y[0]), m(x[1], y[1])];
  return {
    armL: m2(a.armL, b.armL), armR: m2(a.armR, b.armR), legL: m2(a.legL, b.legL), legR: m2(a.legR, b.legR),
    lean: m(a.lean, b.lean), tilt: m(a.tilt, b.tilt), gaze: m2((a.gaze ?? [0, 0]) as [number, number], (b.gaze ?? [0, 0]) as [number, number]),
    base: t < 0.5 ? a.base : b.base, lift: m(a.lift ?? 0, b.lift ?? 0),
  };
}

// ── Faces ──────────────────────────────────────────────────
interface Face { browIn: number; browOut: number; browY: number; lid: number; low: number; gaze: V; mw: number; mc: number; mo: number; blush: number; shadow?: number; tongue?: boolean; side?: number; pale?: number }
const FACES: Record<Expr, Face> = {
  neutral: { browIn: 0, browOut: 0, browY: 0, lid: 0.82, low: 0.1, gaze: [0, 0], mw: 1, mc: 0.12, mo: 0, blush: 0.25 },
  guarded: { browIn: -0.5, browOut: -0.1, browY: 1.2, lid: 0.6, low: 0.25, gaze: [0.6, 0.6], mw: 0.8, mc: -0.08, mo: 0, blush: 0.15, side: 0.6 },
  sad: { browIn: 1.1, browOut: -0.7, browY: 0, lid: 0.62, low: 0.15, gaze: [0, 0.9], mw: 0.9, mc: -0.5, mo: 0, blush: 0.35 },
  worried: { browIn: 1.2, browOut: -0.2, browY: -1, lid: 0.95, low: 0, gaze: [0, 0.1], mw: 0.8, mc: -0.25, mo: 0.18, blush: 0.2 },
  smile: { browIn: 0.15, browOut: 0.2, browY: -0.5, lid: 0.7, low: 0.45, gaze: [0, 0], mw: 1.2, mc: 0.75, mo: 0.05, blush: 0.45 },
  laugh: { browIn: 0.3, browOut: 0.5, browY: -1.4, lid: 0, low: 0.6, gaze: [0, 0], mw: 1.3, mc: 0.9, mo: 0.75, blush: 0.6 },
  surprised: { browIn: 1, browOut: 1, browY: -2.6, lid: 1.12, low: 0, gaze: [0, 0], mw: 0.7, mc: 0, mo: 0.6, blush: 0.25 },
  upset: { browIn: -1.3, browOut: 0.3, browY: 0.6, lid: 0.72, low: 0.3, gaze: [0, 0], mw: 0.9, mc: -0.55, mo: 0.08, blush: 0.55 },
  sleepy: { browIn: 0.2, browOut: -0.2, browY: 0.5, lid: 0.12, low: 0.1, gaze: [0, 0.5], mw: 0.7, mc: 0.05, mo: 0, blush: 0.3 },
  focused: { browIn: -0.4, browOut: 0, browY: 0.8, lid: 0.58, low: 0.2, gaze: [0, 1], mw: 0.8, mc: 0, mo: 0, blush: 0.25, tongue: true },
  bored: { browIn: -0.1, browOut: -0.3, browY: 0.6, lid: 0.5, low: 0.1, gaze: [-0.8, -0.5], mw: 0.85, mc: -0.15, mo: 0, blush: 0.15, side: -0.8 },
  tired: { browIn: 0.5, browOut: -0.3, browY: 0.4, lid: 0.45, low: 0.05, gaze: [0, 0.4], mw: 0.8, mc: -0.15, mo: 0.12, blush: 0.1, shadow: 0.5 },
  proud: { browIn: 0.1, browOut: 0.3, browY: -0.6, lid: 0.66, low: 0.4, gaze: [0, -0.2], mw: 1.1, mc: 0.6, mo: 0, blush: 0.45 },
  sick: { browIn: 0.7, browOut: -0.4, browY: 0.2, lid: 0.42, low: 0.05, gaze: [0, 0.3], mw: 0.8, mc: -0.2, mo: 0.18, blush: 0.75, shadow: 0.7, pale: 0.25 },
};

export interface Palette { skin: string; skinShade: string; skinLight: string; hair: string; hairHi: string; lip: string; iris: string; line: string }
export const SKIN_HODA: Palette = { skin: '#c99068', skinShade: '#9e6844', skinLight: '#dcab84', hair: '#24160f', hairHi: '#4d3324', lip: '#a65a4c', iris: '#3a2416', line: '#3a2418' };

function FaceFeatures({ e, p, uid, gaze }: { e: Face; p: Palette; uid: string; gaze?: V }) {
  const g: V = gaze ?? e.gaze;
  const eye = (x: number, side: 1 | -1) => {
    const o = e.lid;
    const top = -4.4 * o, bot = 2.7 * (1 - e.low * 0.6);
    const w = 5.2;
    const shape = `M${x - w} 0 Q${x - 1} ${top - 0.6} ${x + w} ${-0.3 * side} Q${x + 1} ${bot} ${x - w} 0Z`;
    const clip = `${uid}-eye${side}`;
    if (o < 0.16) {
      const up = e.mc > 0.5; // laughing eyes curve up, sleepy eyes droop
      return <path d={up ? `M${x - w} 0.8 Q${x} -3.4 ${x + w} 0.8` : `M${x - w} -0.6 Q${x} 2.2 ${x + w} -0.6`} stroke={p.line} strokeWidth="1.5" fill="none" strokeLinecap="round" />;
    }
    return (
      <g>
        <clipPath id={clip}><path d={shape} /></clipPath>
        <path d={shape} fill="#f3ebe0" />
        <g clipPath={`url(#${clip})`}>
          <circle cx={x + g[0] * 1.7 + (e.side ?? 0) * 1.2} cy={g[1] * 1.3 - 0.3} r="2.9" fill={p.iris} />
          <circle cx={x + g[0] * 1.7 + (e.side ?? 0) * 1.2} cy={g[1] * 1.3 - 0.3} r="1.35" fill="#120a06" />
          <circle cx={x + g[0] * 1.7 + (e.side ?? 0) * 1.2 + 0.9} cy={g[1] * 1.3 - 1.4} r="0.75" fill="#fff" opacity=".9" />
          <path d={`M${x - w} ${top * 0.2} Q${x} ${top - 1} ${x + w} ${top * 0.2} L${x + w} -8 L${x - w} -8Z`} fill={p.skinShade} opacity=".35" />
        </g>
        <path d={`M${x - w - 0.4} 0.2 Q${x - 1} ${top - 0.7} ${x + w + 0.3} ${-0.3 * side}`} stroke={p.line} strokeWidth="1.45" fill="none" strokeLinecap="round" />
        <path d={`M${x + side * w} ${-0.6} l${side * 1.2} -1`} stroke={p.line} strokeWidth=".8" strokeLinecap="round" opacity=".8" />
        <path d={`M${x - w + 1} 0.6 Q${x} ${bot + 0.4} ${x + w - 1} 0.2`} stroke={p.skinShade} strokeWidth=".7" fill="none" opacity=".7" />
        <g className="blink" fill={p.skin}><path d={`M${x - w - 0.6} 0.3 Q${x - 1} ${top - 1.6} ${x + w + 0.6} -0.3 Q${x + 1} ${bot + 1} ${x - w - 0.6} 0.3Z`} /><path d={`M${x - w} 0.4 Q${x} 1.4 ${x + w} 0.1`} stroke={p.line} strokeWidth="1.3" fill="none" /></g>
      </g>
    );
  };
  const brow = (x: number, side: 1 | -1) => {
    const inner: V = [x - side * 4.2, -8.2 + e.browY - e.browIn * 1.9];
    const outer: V = [x + side * 5.6, -7.6 + e.browY - e.browOut * 1.3];
    const mid: V = [x + side * 0.6, -9.6 + e.browY - (e.browIn + e.browOut) * 0.7];
    return <path d={`M${f(inner[0])} ${f(inner[1])} Q${f(mid[0])} ${f(mid[1])} ${f(outer[0])} ${f(outer[1])}`} stroke={p.hair} strokeWidth="1.9" fill="none" strokeLinecap="round" opacity=".92" />;
  };
  const my = 17.5, w = 5.2 * e.mw, cy = my - e.mc * 2.4, sideShift = (e.side ?? 0) * 0.8;
  const open = e.mo * 5.5;
  const mouth = open > 0.6 ? (
    <g>
      <path d={`M${-w + sideShift} ${cy} Q${sideShift} ${my - 1 - e.mc * 0.6} ${w + sideShift} ${cy} Q${sideShift} ${my + open + e.mc * 2} ${-w + sideShift} ${cy}Z`} fill="#5c2420" stroke={p.lip} strokeWidth="1.1" strokeLinejoin="round" />
      {e.mo > 0.45 && <path d={`M${-w * 0.7 + sideShift} ${cy + 0.4} Q${sideShift} ${my - 0.2} ${w * 0.7 + sideShift} ${cy + 0.4} L${w * 0.6 + sideShift} ${cy + 1.6} Q${sideShift} ${my + 1} ${-w * 0.6 + sideShift} ${cy + 1.6}Z`} fill="#f2ebe2" />}
      {e.mo > 0.45 && <ellipse cx={sideShift} cy={my + open * 0.62} rx={w * 0.45} ry={open * 0.22} fill="#b8524c" />}
    </g>
  ) : (
    <g>
      <path d={`M${-w + sideShift} ${cy} Q${sideShift} ${my + 1.1 + e.mc * 1.2} ${w + sideShift} ${cy}`} stroke={p.lip} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d={`M${-w * 0.55 + sideShift} ${my + 2.6 + e.mc * 0.6} Q${sideShift} ${my + 4 + e.mc * 0.8} ${w * 0.55 + sideShift} ${my + 2.6 + e.mc * 0.6}`} stroke={p.skinShade} strokeWidth="1" fill="none" opacity=".55" />
      {e.tongue && <ellipse cx={w * 0.7 + sideShift} cy={cy + 1.6} rx="1.8" ry="1.3" fill="#c96a66" />}
    </g>
  );
  return (
    <g>
      <ellipse cx="-12" cy="8.5" rx="5.4" ry="3.4" fill="#d9705c" opacity={e.blush * 0.55} />
      <ellipse cx="12" cy="8.5" rx="5.4" ry="3.4" fill="#d9705c" opacity={e.blush * 0.55} />
      {e.shadow ? <g stroke="#6d4a52" strokeWidth="1.6" fill="none" opacity={e.shadow * 0.45}><path d="M-13 3.6 Q-8.5 6 -4 3.8" /><path d="M4 3.8 Q8.5 6 13 3.6" /></g> : null}
      {eye(-8.6, -1)}{eye(8.6, 1)}
      {brow(-8.6, -1)}{brow(8.6, 1)}
      <path d="M1.8 5.5 Q3.4 9.4 2.4 11.4" stroke={p.skinShade} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".6" />
      <path d="M-3 11.8 Q-1.8 13.2 -0.3 12.4 M0.8 12.4 Q2.4 13.2 3.4 11.6" stroke={p.skinShade} strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy="9" rx="1.4" ry="2.6" fill={p.skinLight} opacity=".55" />
      {mouth}
    </g>
  );
}

// ── Head styles ────────────────────────────────────────────
export type HeadStyle = 'braids' | 'scarf' | 'tarha' | 'bun' | 'shortHair';
interface HeadProps { expr: Expr; p: Palette; style: HeadStyle; uid: string; scarf?: string; scarfShade?: string; gaze?: V; ribbon?: string; age?: number; glasses?: boolean; mustache?: boolean; rash?: boolean; button?: boolean }
const FACE_SHAPE = 'M-20.5 -4 C-21.5 -21 -11.5 -28.5 0 -28.5 C11.5 -28.5 21.5 -21 20.5 -4 C20.5 9 15 21.5 0 25.5 C-15 21.5 -20.5 9 -20.5 -4Z';
const ADULT_FACE = 'M-19.5 -6 C-20.5 -22 -11 -29 0 -29 C11 -29 20.5 -22 19.5 -6 C19.5 10 14 24 0 28 C-14 24 -19.5 10 -19.5 -6Z';

export function HeadArt(h: HeadProps) {
  const { p, uid } = h;
  const e = FACES[h.expr] ?? FACES.neutral;
  const face = h.style === 'braids' ? FACE_SHAPE : ADULT_FACE;
  const shade = `${uid}-face`;
  const fs = (
    <g>
      <defs>
        <radialGradient id={shade} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor={p.skinLight} /><stop offset=".55" stopColor={p.skin} /><stop offset="1" stopColor={p.skinShade} />
        </radialGradient>
      </defs>
      <ellipse cx="-20" cy="2" rx="3.8" ry="6.2" fill={p.skinShade} />
      <ellipse cx="20" cy="2" rx="3.8" ry="6.2" fill={p.skinShade} />
      <path d={face} fill={`url(#${shade})`} stroke={p.line} strokeWidth=".9" strokeOpacity=".55" />
      {e.pale ? <path d={face} fill="#e8e0d0" opacity={e.pale} /> : null}
      {h.rash && <g fill="#b2453e" opacity=".55">{[[-11, 4], [-7, 12], [10, 6], [13, 13], [-14, -6], [6, -10], [-3, 20], [15, -2], [-9, -9], [3, 16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1 + (i % 3) * 0.3} />)}</g>}
      {h.age ? <g stroke={p.skinShade} strokeWidth=".9" fill="none" opacity={0.35 + h.age * 0.3}><path d="M-15 1 q-1.5 2 -0.8 4 M15 1 q1.5 2 .8 4" /><path d="M-7 21 q-2 -4 -1 -8 M7 21 q2 -4 1 -8" /><path d="M-6 -14 h12" /></g> : null}
      <FaceFeatures e={e} p={p} uid={uid} gaze={h.gaze} />
      {h.mustache && <path d="M-7 15.6 Q-3.5 13 0 14.6 Q3.5 13 7 15.6 Q3.5 17 0 15.8 Q-3.5 17 -7 15.6Z" fill={p.hair} />}
      {h.glasses && <g fill="none" stroke="#2c2622" strokeWidth="1.3"><circle cx="-8.6" cy="0" r="6.4" /><circle cx="8.6" cy="0" r="6.4" /><path d="M-2.2 -0.6 h4.4 M-15 -1 l-5 -1.6 M15 -1 l5 -1.6" /></g>}
    </g>
  );
  if (h.style === 'braids') {
    return (
      <g>
        <path d="M-23 -2 C-25 -26 -12 -34 0 -33 C12 -34 25 -26 23 -2 C22 10 19 14 16 16 L-16 16 C-19 14 -22 10 -23 -2Z" fill={p.hair} />
        {fs}
        <path d="M-22 -1 C-24 -23 -12 -32.5 0 -31.5 C12 -32.5 24 -23 22 -1 C19.5 -12 12 -19.5 2 -20.5 L0 -29 L-2 -20.5 C-12 -19.5 -19.5 -12 -22 -1Z" fill={p.hair} />
        <path d="M-6 -29 C-12 -26 -16 -20 -18.5 -12 M7 -29 C13 -26 17 -20 19 -12" stroke={p.hairHi} strokeWidth="1.2" fill="none" opacity=".75" />
        <path d="M-1.2 -30 L-0.6 -21" stroke={p.hairHi} strokeWidth="1" opacity=".6" />
        {h.button && <circle cx="-17" cy="-15" r="2.6" fill="#b3322b" stroke="#6e1a16" strokeWidth=".6" />}
      </g>
    );
  }
  if (h.style === 'scarf' || h.style === 'tarha') {
    const c = h.scarf ?? '#3b2f35', cs = h.scarfShade ?? '#241c20';
    return (
      <g>
        <path d={h.style === 'tarha' ? 'M-30 -6 C-33 -36 -14 -42 0 -42 C14 -42 33 -36 30 -6 C34 22 38 46 46 64 L-46 64 C-38 46 -34 22 -30 -6Z' : 'M-28 -6 C-30 -34 -14 -40 0 -40 C14 -40 30 -34 28 -6 C30 14 30 28 24 38 L-24 38 C-30 28 -30 14 -28 -6Z'} fill={c} />
        {fs}
        <path d="M-24.5 8 C-27 -26 -12 -35 0 -35 C12 -35 27 -26 24.5 8 C22 -6 18 -18 0 -21.5 C-18 -18 -22 -6 -24.5 8Z" fill={c} />
        <path d="M-24.5 8 C-27 -26 -12 -35 0 -35 C12 -35 27 -26 24.5 8" stroke={cs} strokeWidth="1.4" fill="none" opacity=".7" />
        <path d="M-19 -20 Q0 -27 19 -20" stroke={cs} strokeWidth="1.2" fill="none" opacity=".5" />
        {h.style === 'scarf' && <path d="M-22 24 Q0 40 22 24 L24 38 Q0 50 -24 38Z" fill={cs} opacity=".85" />}
      </g>
    );
  }
  if (h.style === 'bun') {
    return (
      <g>
        <circle cx="0" cy="-30" r="10" fill={p.hair} />
        <path d="M-22 -2 C-24 -26 -12 -33 0 -33 C12 -33 24 -26 22 -2 L18 -4 L-18 -4Z" fill={p.hair} />
        {fs}
        <path d="M-21 -2 C-22 -22 -11 -30 0 -30 C11 -30 22 -22 21 -2 C18 -14 10 -20 0 -21 C-10 -20 -18 -14 -21 -2Z" fill={p.hair} />
      </g>
    );
  }
  return (
    <g>
      <path d="M-21 -2 C-23 -26 -11 -33 0 -33 C11 -33 23 -26 21 -2Z" fill={p.hair} />
      {fs}
      <path d="M-20.5 -6 C-21 -24 -10 -31 0 -31 C10 -31 21 -24 20.5 -6 C17 -16 10 -21 0 -21.5 C-10 -21 -17 -16 -20.5 -6Z" fill={p.hair} />
    </g>
  );
}

// ── Whole person ───────────────────────────────────────────
export interface Garment {
  kind: 'dress' | 'galabeya' | 'coat' | 'blouseSkirt';
  color: string; shade: string; collar?: string; sleeve?: 'short' | 'long'; pattern?: 'stripe' | 'dots' | 'none';
  /** Visible history on the cloth: dust, a tear, a patch (plain or a red satin flower), a long sleeve. */
  dust?: boolean; tear?: boolean; patch?: 'plain' | 'flower'; longSleeve?: boolean; layer?: { color: string; shade: string };
  legs?: string; shoes?: string;
}
export interface PersonProps {
  build: keyof typeof BUILDS; pose: Pose; expr: Expr; palette: Palette; head: Omit<HeadProps, 'expr' | 'p' | 'uid'>;
  garment: Garment; breathe?: boolean; holdL?: ReactNode; holdR?: ReactNode; braids?: { ribbon: string; ribbonShade: string };
}

export function Person(props: PersonProps) {
  const uid = 'f' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const { pose, palette: p, garment: g } = props;
  const B = BUILDS[props.build];
  const lift = -(pose.lift ?? 0);
  const base = pose.base ?? 'stand';
  const child = props.build === 'child';

  // Hip height drops when sitting.
  const drop = base === 'floor' ? (child ? 80 : 120) : base === 'chair' ? (child ? 50 : 80) : base === 'kneel' ? (child ? 52 : 80) : 0;
  const T = (v: V): V => [v[0], v[1] + drop + lift];
  const hipC = T(B.hipC);
  // Upper body rotates around the hip centre by `lean`.
  const rot = (v: V): V => {
    const a = rad(pose.lean), dx = v[0] - hipC[0], dy = v[1] - hipC[1];
    return [hipC[0] + dx * Math.cos(a) - dy * Math.sin(a), hipC[1] + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  const shL = rot(T(B.shL)), shR = rot(T(B.shR)), neck = rot(T(B.neck)), head = rot(T(B.head));
  const elL = add(shL, dirL(pose.armL[0], B.upper)), wrL = add(elL, dirL(pose.armL[0] - pose.armL[1], B.fore));
  const elR = add(shR, dirR(pose.armR[0], B.upper)), wrR = add(elR, dirR(pose.armR[0] - pose.armR[1], B.fore));
  const hdL = add(wrL, dirL(pose.armL[0] - pose.armL[1], B.hand * 0.35)), hdR = add(wrR, dirR(pose.armR[0] - pose.armR[1], B.hand * 0.35));

  const hipL = T(B.hipL), hipR = T(B.hipR);
  const knL = add(hipL, dirL(pose.legL[0], B.thigh)), anL = add(knL, dirL(pose.legL[0] - pose.legL[1], B.shin));
  const knR = add(hipR, dirR(pose.legR[0], B.thigh)), anR = add(knR, dirR(pose.legR[0] - pose.legR[1], B.shin));

  const grad = (id: string, a: V, b: V, light: string, mid: string, dark: string) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
    return (
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f(cx - nx * 10)} y1={f(cy - ny * 10)} x2={f(cx + nx * 10)} y2={f(cy + ny * 10)}>
        <stop offset="0" stopColor={dark} /><stop offset=".45" stopColor={mid} /><stop offset="1" stopColor={light} />
      </linearGradient>
    );
  };
  const limb = (id: string, a: V, b: V, r1: number, r2: number, fill: [string, string, string], line = p.line) => (
    <g>
      <defs>{grad(id, a, b, fill[0], fill[1], fill[2])}</defs>
      <path d={capsule(a, b, r1, r2)} fill={`url(#${id})`} stroke={line} strokeWidth=".8" strokeOpacity=".45" />
    </g>
  );
  const skin: [string, string, string] = [p.skinLight, p.skin, p.skinShade];
  const cloth: [string, string, string] = [g.color, g.color, g.shade];
  const longSleeves = g.sleeve === 'long' || !!g.layer;
  const sleeveCol: [string, string, string] = g.layer ? [g.layer.color, g.layer.color, g.layer.shade] : cloth;
  // A hand: palm elongated along the forearm, a thumb on the inner side.
  const hand = (w: V, r: number, from: V, side: 1 | -1) => {
    const a = (Math.atan2(w[1] - from[1], w[0] - from[0]) * 180) / Math.PI - 90;
    return (
      <g transform={`translate(${f(w[0])} ${f(w[1])}) rotate(${f(a)})`}>
        <ellipse cx="0" cy={f(r * 0.35)} rx={f(r * 0.92)} ry={f(r * 1.3)} fill={p.skin} stroke={p.line} strokeWidth=".8" strokeOpacity=".45" />
        <ellipse cx={f(-side * r * 0.85)} cy={f(-r * 0.1)} rx={f(r * 0.38)} ry={f(r * 0.7)} transform={`rotate(${side * 28} ${f(-side * r * 0.85)} ${f(-r * 0.1)})`} fill={p.skin} stroke={p.line} strokeWidth=".6" strokeOpacity=".4" />
        <path d={`M${f(-r * 0.45)} ${f(r * 1.1)} v${f(r * 0.4)} M0 ${f(r * 1.25)} v${f(r * 0.4)} M${f(r * 0.45)} ${f(r * 1.1)} v${f(r * 0.4)}`} stroke={p.skinShade} strokeWidth=".6" opacity=".6" />
      </g>
    );
  };
  const arm = (side: 'L' | 'R', sh: V, el: V, wr: V, hd: V) => {
    const sleeveEnd: V = longSleeves ? [wr[0] + (el[0] - wr[0]) * (g.longSleeve && side === 'L' ? -0.05 : 0.12), wr[1] + (el[1] - wr[1]) * (g.longSleeve && side === 'L' ? -0.05 : 0.12)] : [sh[0] + (el[0] - sh[0]) * 0.55, sh[1] + (el[1] - sh[1]) * 0.55];
    return (
      <g>
        {limb(`${uid}${side}u`, sh, el, B.r.sh, B.r.el, skin)}
        {limb(`${uid}${side}f`, el, wr, B.r.el, B.r.wr, skin)}
        {longSleeves
          ? <path d={capsule(sh, el, B.r.sh + 2.2, B.r.el + 1.8) + capsule(el, sleeveEnd, B.r.el + 1.8, B.r.wr + 2)} fill={sleeveCol[1]} stroke={p.line} strokeWidth=".8" strokeOpacity=".5" />
          : <path d={capsule(sh, sleeveEnd, B.r.sh + 2.6, B.r.el + 2.4)} fill={sleeveCol[1]} stroke={p.line} strokeWidth=".8" strokeOpacity=".5" />}
        {hand(hd, B.r.wr + 1.2, wr === hd ? el : wr, side === 'L' ? -1 : 1)}
      </g>
    );
  };

  // Torso + skirt outline
  const wL = rot(T([B.hipC[0] - B.chest + 4, B.waistY])), wR = rot(T([B.hipC[0] + B.chest - 4, B.waistY]));
  const bodice = `M${f(shL[0] - 2)} ${f(shL[1] - 3)} Q${f(neck[0])} ${f(neck[1] + 6)} ${f(shR[0] + 2)} ${f(shR[1] - 3)} L${f(wR[0] + 1)} ${f(wR[1])} L${f(wL[0] - 1)} ${f(wL[1])}Z`;
  const hemY = B.hemY + drop + lift;
  let skirt: string;
  let legs: ReactNode = null;
  if (base === 'stand') {
    const flare = g.kind === 'galabeya' ? B.hips + 12 : B.hips + 22;
    const sway = (pose.legR[0] - pose.legL[0]) * 0.6;
    skirt = `M${f(wL[0] - 1)} ${f(wL[1])} C${f(hipC[0] - B.hips - 4)} ${f(hipC[1])} ${f(hipC[0] - flare + sway)} ${f(hemY - 30)} ${f(hipC[0] - flare + sway)} ${f(hemY)} Q${f(hipC[0] + sway)} ${f(hemY + 7)} ${f(hipC[0] + flare + sway)} ${f(hemY)} C${f(hipC[0] + flare + sway)} ${f(hemY - 30)} ${f(hipC[0] + B.hips + 4)} ${f(hipC[1])} ${f(wR[0] + 1)} ${f(wR[1])}Z`;
    legs = (
      <g>
        {limb(`${uid}Lt`, hipL, knL, B.r.hip, B.r.kn, [g.legs ?? p.skinLight, g.legs ?? p.skin, g.legs ? g.legs : p.skinShade])}
        {limb(`${uid}Ls`, knL, anL, B.r.kn, B.r.an, [p.skinLight, p.skin, p.skinShade])}
        {limb(`${uid}Rt`, hipR, knR, B.r.hip, B.r.kn, [p.skinLight, p.skin, p.skinShade])}
        {limb(`${uid}Rs`, knR, anR, B.r.kn, B.r.an, [p.skinLight, p.skin, p.skinShade])}
        {child && <g fill="#efe6d2" stroke={p.line} strokeWidth=".6" strokeOpacity=".4"><path d={capsule([anL[0], anL[1] - 12], anL, B.r.an + 0.8, B.r.an + 0.8)} /><path d={capsule([anR[0], anR[1] - 12], anR, B.r.an + 0.8, B.r.an + 0.8)} /></g>}
        <path d={`M${f(anL[0] + 6)} ${f(anL[1] - 2)} Q${f(anL[0] - 14)} ${f(anL[1] - 3)} ${f(anL[0] - 15)} ${f(anL[1] + 6)} L${f(anL[0] + 7)} ${f(anL[1] + 6)}Z`} fill={g.shoes ?? '#5e3a22'} stroke={p.line} strokeWidth=".8" />
        <path d={`M${f(anR[0] - 6)} ${f(anR[1] - 2)} Q${f(anR[0] + 14)} ${f(anR[1] - 3)} ${f(anR[0] + 15)} ${f(anR[1] + 6)} L${f(anR[0] - 7)} ${f(anR[1] + 6)}Z`} fill={g.shoes ?? '#5e3a22'} stroke={p.line} strokeWidth=".8" />
      </g>
    );
  } else if (base === 'chair') {
    const y = hipC[1];
    skirt = `M${f(wL[0] - 1)} ${f(wL[1])} C${f(hipC[0] - B.hips - 6)} ${f(y - 4)} ${f(hipC[0] - B.hips - 10)} ${f(y + 14)} ${f(hipC[0] - B.hips - 8)} ${f(y + 22)} L${f(hipC[0] + B.hips + 8)} ${f(y + 22)} C${f(hipC[0] + B.hips + 10)} ${f(y + 14)} ${f(hipC[0] + B.hips + 6)} ${f(y - 4)} ${f(wR[0] + 1)} ${f(wR[1])}Z`;
    const kL: V = [hipC[0] - 12, y + 24], kR: V = [hipC[0] + 12, y + 24];
    const aL: V = [kL[0] - 2, kL[1] + B.shin], aR: V = [kR[0] + 2, kR[1] + B.shin];
    legs = (
      <g>
        {g.kind === 'galabeya'
          ? <path d={`M${f(hipC[0] - B.hips - 8)} ${f(y + 18)} L${f(aL[0] - 14)} ${f(aL[1] - 4)} L${f(aR[0] + 14)} ${f(aR[1] - 4)} L${f(hipC[0] + B.hips + 8)} ${f(y + 18)}Z`} fill={g.color} stroke={p.line} strokeWidth=".8" strokeOpacity=".5" />
          : <>{limb(`${uid}Ls`, kL, aL, B.r.kn, B.r.an, skin)}{limb(`${uid}Rs`, kR, aR, B.r.kn, B.r.an, skin)}</>}
        <ellipse cx={aL[0] - 6} cy={aL[1] + 3} rx="10" ry="4.5" fill={g.shoes ?? '#5e3a22'} />
        <ellipse cx={aR[0] + 6} cy={aR[1] + 3} rx="10" ry="4.5" fill={g.shoes ?? '#5e3a22'} />
      </g>
    );
  } else if (base === 'kneel') {
    const y = hipC[1];
    skirt = `M${f(wL[0] - 1)} ${f(wL[1])} C${f(hipC[0] - B.hips - 8)} ${f(y)} ${f(hipC[0] - B.hips - 14)} ${f(y + 40)} ${f(hipC[0] - B.hips - 12)} ${f(y + 52)} Q${f(hipC[0])} ${f(y + 60)} ${f(hipC[0] + B.hips + 12)} ${f(y + 52)} C${f(hipC[0] + B.hips + 14)} ${f(y + 40)} ${f(hipC[0] + B.hips + 8)} ${f(y)} ${f(wR[0] + 1)} ${f(wR[1])}Z`;
    legs = <g><ellipse cx={hipC[0] + B.hips + 10} cy={y + 56} rx="12" ry="5" fill={g.shoes ?? '#5e3a22'} /><ellipse cx={hipC[0] - B.hips - 6} cy={y + 57} rx="11" ry="5" fill={g.shoes ?? '#5e3a22'} /></g>;
  } else {
    // cross-legged on the floor: the skirt covers folded legs, two feet peek out
    const y = hipC[1];
    const wide = B.hips + (child ? 36 : 50);
    skirt = `M${f(wL[0] - 1)} ${f(wL[1])} C${f(hipC[0] - B.hips - 6)} ${f(y - 10)} ${f(hipC[0] - wide)} ${f(y + 8)} ${f(hipC[0] - wide)} ${f(y + 26)} Q${f(hipC[0] - wide + 6)} ${f(y + 42)} ${f(hipC[0])} ${f(y + 40)} Q${f(hipC[0] + wide - 6)} ${f(y + 42)} ${f(hipC[0] + wide)} ${f(y + 26)} C${f(hipC[0] + wide)} ${f(y + 8)} ${f(hipC[0] + B.hips + 6)} ${f(y - 10)} ${f(wR[0] + 1)} ${f(wR[1])}Z`;
    legs = (
      <g>
        <path d={`M${f(hipC[0] - 30)} ${f(y + 36)} q-10 6 -4 10 l18 -2 q4 -6 -2 -10z`} fill={g.shoes ?? '#5e3a22'} />
        <path d={`M${f(hipC[0] + 30)} ${f(y + 36)} q10 6 4 10 l-18 -2 q-4 -6 2 -10z`} fill={g.shoes ?? '#5e3a22'} />
      </g>
    );
  }

  const dressGrad = `${uid}-dress`;
  const pattern = g.pattern === 'stripe'
    ? <g stroke={g.shade} strokeWidth="2" opacity=".35">{Array.from({ length: 14 }, (_, i) => <line key={i} x1={hipC[0] - 60 + i * 9} y1={wL[1] - 60} x2={hipC[0] - 60 + i * 9} y2={hemY + 10} />)}</g>
    : g.pattern === 'dots' ? <g fill={g.shade} opacity=".4">{Array.from({ length: 40 }, (_, i) => <circle key={i} cx={hipC[0] - 50 + (i % 8) * 14 + ((i / 8) | 0) % 2 * 7} cy={wL[1] - 50 + ((i / 8) | 0) * 26} r="1.8" />)}</g> : null;
  const clip = `${uid}-cloth`;
  const skirtMidY = (wL[1] + hemY) / 2;

  const headTr = `translate(${f(head[0])} ${f(head[1])}) rotate(${f(pose.tilt + pose.lean * 0.4)}) scale(${B.headScale})`;
  const braids = props.braids && (
    <g>
      {[-1, 1].map((side) => {
        const top = rot([head[0] + side * 17 * B.headScale, head[1] + 10]);
        const sw = pose.tilt * 0.6 * side;
        const end: V = [top[0] + side * 6 + sw, top[1] + 58];
        const seg = 7;
        return (
          <g key={side}>
            {Array.from({ length: seg }, (_, i) => {
              const t = i / seg; const x = top[0] + (end[0] - top[0]) * t + side * Math.sin(t * 3) * 2; const y = top[1] + (end[1] - top[1]) * t;
              return <ellipse key={i} cx={f(x)} cy={f(y + 4)} rx={5.4 - t * 1.4} ry="5.2" fill={p.hair} stroke={p.hairHi} strokeWidth=".7" />;
            })}
            <g transform={`translate(${f(end[0])} ${f(end[1] + 4)})`}>
              <path d="M0 0 l-8 -5 q-2 5 0 10 Z M0 0 l8 -5 q2 5 0 10 Z" fill={props.braids!.ribbon} stroke={props.braids!.ribbonShade} strokeWidth=".7" />
              <circle r="2.4" fill={props.braids!.ribbonShade} />
              <path d="M0 2 q-3 6 -1 10 M0 2 q3 6 1 10" stroke={p.hair} strokeWidth="2.4" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
    </g>
  );

  return (
    <g className={props.breathe === false ? undefined : 'breathe'}>
      <ellipse cx={f(hipC[0])} cy={f(base === 'stand' ? Math.max(anL[1], anR[1]) + 6 - lift : hipC[1] + (base === 'floor' ? 44 : base === 'kneel' ? 60 : B.shin + 30))} rx={base === 'floor' ? 70 : 46} ry="7" fill="#000" opacity={base === 'stand' && lift ? 0.1 : 0.18} />
      {legs}
      <defs>
        <linearGradient id={dressGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={g.shade} /><stop offset=".35" stopColor={g.color} /><stop offset=".7" stopColor={g.color} /><stop offset="1" stopColor={g.shade} />
        </linearGradient>
        <clipPath id={clip}><path d={bodice + skirt} /></clipPath>
      </defs>
      <path d={skirt} fill={`url(#${dressGrad})`} stroke={p.line} strokeWidth=".9" strokeOpacity=".55" />
      <path d={bodice} fill={`url(#${dressGrad})`} stroke={p.line} strokeWidth=".9" strokeOpacity=".55" />
      <g clipPath={`url(#${clip})`}>
        {pattern}
        {/* folds */}
        <path d={`M${f(hipC[0] - 10)} ${f(wL[1] + 6)} Q${f(hipC[0] - 16)} ${f(skirtMidY)} ${f(hipC[0] - 22)} ${f(hemY)} M${f(hipC[0] + 12)} ${f(wL[1] + 6)} Q${f(hipC[0] + 18)} ${f(skirtMidY)} ${f(hipC[0] + 26)} ${f(hemY)}`} stroke={g.shade} strokeWidth="2.4" fill="none" opacity=".45" />
        <rect x={f(hipC[0] - 80)} y={f(wL[1] - 3)} width="160" height="5" fill={g.shade} opacity=".5" />
        {g.dust && <g fill="#8d7656" opacity=".32"><ellipse cx={f(hipC[0] - 22)} cy={f(hemY - 6)} rx="16" ry="7" /><ellipse cx={f(hipC[0] + 26)} cy={f(hemY - 4)} rx="12" ry="5" /><ellipse cx={f(hipC[0] + 4)} cy={f(skirtMidY + 12)} rx="7" ry="4" /></g>}
        {g.tear && !g.patch && <path d={`M${f(hipC[0] + 18)} ${f(hemY - 2)} l4 -14 l3 8 l3 -10`} stroke="#3a2418" strokeWidth="1.4" fill="none" />}
        {g.patch === 'plain' && <g><rect x={f(hipC[0] + 12)} y={f(hemY - 22)} width="20" height="18" rx="2" fill={g.shade} stroke="#efe3c8" strokeWidth="1" strokeDasharray="2 2" transform={`rotate(-6 ${f(hipC[0] + 22)} ${f(hemY - 13)})`} /></g>}
        {g.patch === 'flower' && (
          <g transform={`translate(${f(hipC[0] + 22)} ${f(hemY - 14)})`}>
            {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-6" rx="4" ry="6" fill="#b5463a" stroke="#7e2a22" strokeWidth=".6" transform={`rotate(${a})`} />)}
            <circle r="2.8" fill="#efe3c8" />
          </g>
        )}
      </g>
      {g.collar && <path d={`M${f(neck[0] - 12)} ${f(neck[1] + 13)} Q${f(neck[0] - 6)} ${f(neck[1] + 24)} ${f(neck[0])} ${f(neck[1] + 15)} Q${f(neck[0] + 6)} ${f(neck[1] + 24)} ${f(neck[0] + 12)} ${f(neck[1] + 13)} Q${f(neck[0])} ${f(neck[1] + 8)} ${f(neck[0] - 12)} ${f(neck[1] + 13)}Z`} fill={g.collar} stroke={p.line} strokeWidth=".6" strokeOpacity=".5" />}
      {g.kind === 'dress' && [0, 1, 2].map((i) => <circle key={i} cx={f((neck[0] + (wL[0] + wR[0]) / 2) / 2)} cy={f(neck[1] + 28 + i * 13)} r="1.7" fill={g.collar ?? '#efe3c8'} opacity=".85" />)}
      {g.layer && <path d={`M${f(shL[0] - 4)} ${f(shL[1] - 2)} L${f(neck[0] - 8)} ${f(neck[1] + 16)} L${f(neck[0] - 6)} ${f(wL[1] + 12)} L${f(wL[0] - 6)} ${f(wL[1] + 14)}Z M${f(shR[0] + 4)} ${f(shR[1] - 2)} L${f(neck[0] + 8)} ${f(neck[1] + 16)} L${f(neck[0] + 6)} ${f(wR[1] + 12)} L${f(wR[0] + 6)} ${f(wR[1] + 14)}Z`} fill={g.layer.color} stroke={g.layer.shade} strokeWidth="1.2" />}
      {g.kind === 'coat' && <path d={`M${f(neck[0])} ${f(neck[1] + 14)} L${f(neck[0])} ${f(hemY)}`} stroke={g.shade} strokeWidth="2" />}
      {/* neck */}
      <path d={capsule(neck, [neck[0], neck[1] + 14], 6.2 * B.headScale, 6.8 * B.headScale)} fill={p.skinShade} />
      {braids && <g opacity=".98">{braids}</g>}
      <g transform={headTr}>
        <HeadArt {...props.head} expr={props.expr} p={p} uid={uid} />
      </g>
      {arm('L', shL, elL, wrL, hdL)}
      {arm('R', shR, elR, wrR, hdR)}
      {props.holdL && <g transform={`translate(${f(hdL[0])} ${f(hdL[1])})`}>{props.holdL}</g>}
      {props.holdR && <g transform={`translate(${f(hdR[0])} ${f(hdR[1])})`}>{props.holdR}</g>}
    </g>
  );
}

/** Where the hands end up for a pose (used to place a ball or a button exactly in her hand). */
export function handPoints(build: keyof typeof BUILDS, pose: Pose): { L: V; R: V } {
  const B = BUILDS[build];
  const base = pose.base ?? 'stand';
  const child = build === 'child';
  const drop = base === 'floor' ? (child ? 80 : 120) : base === 'chair' ? (child ? 50 : 80) : base === 'kneel' ? (child ? 52 : 80) : 0;
  const lift = -(pose.lift ?? 0);
  const T = (v: V): V => [v[0], v[1] + drop + lift];
  const hipC = T(B.hipC);
  const rot = (v: V): V => {
    const a = rad(pose.lean), dx = v[0] - hipC[0], dy = v[1] - hipC[1];
    return [hipC[0] + dx * Math.cos(a) - dy * Math.sin(a), hipC[1] + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  const shL = rot(T(B.shL)), shR = rot(T(B.shR));
  const wrL = add(add(shL, dirL(pose.armL[0], B.upper)), dirL(pose.armL[0] - pose.armL[1], B.fore + B.hand * 0.6));
  const wrR = add(add(shR, dirR(pose.armR[0], B.upper)), dirR(pose.armR[0] - pose.armR[1], B.fore + B.hand * 0.6));
  return { L: wrL, R: wrR };
}
