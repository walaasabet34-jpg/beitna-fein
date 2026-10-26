// The adults, drawn with the same rig as Hoda so the cast stays in one visual world.
// Local box for an adult: centre x = 80, feet at y ≈ 394.
import type { Expr } from '../engine/types';
import { Person, POSES, type Palette, type Pose } from './figure';

const SKIN = {
  naima: { skin: '#b98260', skinShade: '#8c5a3e', skinLight: '#cf9a76', hair: '#d9d2c4', hairHi: '#fff', lip: '#8e5446', iris: '#2c1d14', line: '#3a2418' },
  mother: { skin: '#c48b63', skinShade: '#94603f', skinLight: '#d9a47d', hair: '#20140e', hairHi: '#47301f', lip: '#9b5446', iris: '#3a2416', line: '#3a2418' },
  fatma: { skin: '#bf8862', skinShade: '#8f5c3e', skinLight: '#d39f7a', hair: '#2a1c14', hairHi: '#4a3324', lip: '#94554a', iris: '#33200f', line: '#3a2418' },
  teacher: { skin: '#cc9a74', skinShade: '#9b6a4a', skinLight: '#deb28c', hair: '#2e2018', hairHi: '#53392a', lip: '#a25a50', iris: '#2c1d14', line: '#3a2418' },
  ummnadia: { skin: '#b67f58', skinShade: '#86583a', skinLight: '#cc9670', hair: '#20140e', hairHi: '#47301f', lip: '#8e5446', iris: '#2c1d14', line: '#3a2418' },
  doctor: { skin: '#c2906a', skinShade: '#925f42', skinLight: '#d6a682', hair: '#3a3430', hairHi: '#6d635b', lip: '#8e5446', iris: '#2c1d14', line: '#3a2418' },
  doorman: { skin: '#9e6c4a', skinShade: '#6f4a30', skinLight: '#b88360', hair: '#2a2420', hairHi: '#555', lip: '#7a4636', iris: '#2c1d14', line: '#3a2418' },
} satisfies Record<string, Palette>;

type P = { pose?: keyof typeof POSES; expr?: Expr; poseOverride?: Pose };
const pz = (p: P) => p.poseOverride ?? POSES[p.pose ?? 'stand'];

/** الحاجة نعيمة: older neighbour, black galabeya, black tarha over her shoulders. */
export function Naima(p: P) {
  return <g data-adult data-who="naima"><Person build="woman" pose={pz(p)} expr={p.expr ?? 'neutral'} palette={SKIN.naima}
    head={{ style: 'tarha', scarf: '#1f1b1a', scarfShade: '#0f0d0c', age: 1 }}
    garment={{ kind: 'galabeya', sleeve: 'long', color: '#2a2524', shade: '#141110', shoes: '#2a1d14' }} /></g>;
}
/** أم هدى: came by train from Alexandria; a dark travelling coat over a print dress, a plain headscarf. */
export function Mother(p: P) {
  return <g data-adult data-who="mother"><Person build="woman" pose={pz(p)} expr={p.expr ?? 'tired'} palette={SKIN.mother}
    head={{ style: 'scarf', scarf: '#4b4258', scarfShade: '#302a3a' }}
    garment={{ kind: 'coat', sleeve: 'long', color: '#4a3f3a', shade: '#2e2724', shoes: '#231a14' }} /></g>;
}
/** فاطمة: only seen in a few places (doorway, hospital). House galabeya, scarf tied at the nape. */
export function Fatma(p: P) {
  return <g data-adult data-who="fatma"><Person build="woman" pose={pz(p)} expr={p.expr ?? 'neutral'} palette={SKIN.fatma}
    head={{ style: 'scarf', scarf: '#7a3f2e', scarfShade: '#542a1e' }}
    garment={{ kind: 'galabeya', sleeve: 'long', color: '#6e7f8c', shade: '#4b5761', pattern: 'dots', shoes: '#3a2a20' }} /></g>;
}
export function Teacher(p: P) {
  return <g data-adult data-who="teacher"><Person build="woman" pose={pz(p)} expr={p.expr ?? 'neutral'} palette={SKIN.teacher}
    head={{ style: 'bun', glasses: true }}
    garment={{ kind: 'dress', sleeve: 'long', color: '#5d6f7f', shade: '#3e4c58', collar: '#e9e1cf', shoes: '#2a2018', legs: '#b5876a' }} /></g>;
}
export function UmmNadia(p: P) {
  return <g data-adult data-who="ummnadia"><Person build="woman" pose={pz(p)} expr={p.expr ?? 'guarded'} palette={SKIN.ummnadia}
    head={{ style: 'scarf', scarf: '#c9a65a', scarfShade: '#8a6d2c' }}
    garment={{ kind: 'galabeya', sleeve: 'long', color: '#8a4f62', shade: '#5f3242', pattern: 'stripe', shoes: '#3a2a20' }} /></g>;
}
export function Doctor(p: P) {
  return <g data-adult data-who="doctor"><Person build="man" pose={pz(p)} expr={p.expr ?? 'sad'} palette={SKIN.doctor}
    head={{ style: 'shortHair', mustache: true, age: 0.6 }}
    garment={{ kind: 'coat', sleeve: 'long', color: '#ecebe4', shade: '#bdbcb2', legs: '#3d3d44', shoes: '#1f1c1a' }} /></g>;
}
export function Doorman(p: P) {
  return <g data-adult data-who="doorman"><Person build="man" pose={pz(p)} expr={p.expr ?? 'neutral'} palette={SKIN.doorman}
    head={{ style: 'scarf', scarf: '#e8e2d2', scarfShade: '#b9b2a2', mustache: true, age: 0.8 }}
    garment={{ kind: 'galabeya', sleeve: 'long', color: '#6b5a44', shade: '#4a3d2e', shoes: '#2a1d14' }} /></g>;
}

/** Fatma's own hands in first person (activities): sleeves of her galabeya coming in from the bottom edge. */
export function FatmaHands({ lx, ly, rx, ry }: { lx: number; ly: number; rx: number; ry: number }) {
  const s = SKIN.fatma;
  const arm = (x0: number, x: number, y: number) => (
    <g>
      <path d={`M${x0 - 46} 830 Q${x0 - 20} ${y + 120} ${x - 16} ${y + 18} L${x + 18} ${y + 22} Q${x0 + 40} ${y + 140} ${x0 + 56} 830Z`} fill="#6e7f8c" stroke="#3a2418" strokeWidth="1.5" strokeOpacity=".5" />
      <ellipse cx={x} cy={y} rx="21" ry="17" fill={s.skin} stroke="#3a2418" strokeWidth="1.2" strokeOpacity=".5" />
      <path d={`M${x - 14} ${y - 8} q6 -10 12 -2 M${x - 2} ${y - 12} q6 -8 11 0 M${x + 9} ${y - 9} q6 -5 9 3`} stroke={s.skinShade} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
  return <g pointerEvents="none">{arm(380, lx, ly)}{arm(820, rx, ry)}</g>;
}

export function Cast() {
  return (
    <g>
      {[Naima, Mother, Fatma, Teacher, UmmNadia, Doctor, Doorman].map((C, i) => (
        <g key={i} transform={`translate(${i * 190} 0)`}><C /></g>
      ))}
    </g>
  );
}
