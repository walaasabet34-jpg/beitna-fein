import type { ReactNode } from 'react';
import type { GameState } from '../../engine/types';
import { ArtDefs } from '../../art/scenes';
import { CHAPTERS } from '../../content';
import { Hud } from '../hud/Hud';
import { usePortrait, stageAspect } from '../scene/Stage';

const W = 1200, H = 800;

/** Stage box for the shared rituals (ball, buttons, clothes). Same size and crop rules as the story stage. */
export function RitualFrame({ s, children, overlay, onTap, focusX = 600, label }:
  { s: GameState; children: ReactNode; overlay?: ReactNode; onTap?: (e: React.PointerEvent) => void; focusX?: number; label: string }) {
  const portrait = usePortrait();
  const aspect = stageAspect(portrait, 170);
  // Upright phones: crop the top of the room so the people fill the window.
  const vh = portrait ? 700 : H;
  const oy = H - vh;
  const vw = Math.min(W, vh * aspect);
  const ox = Math.max(0, Math.min(W - vw, focusX - vw / 2));
  return (
    <div className="relative w-full overflow-hidden rounded-none sm:rounded-2xl shadow-2xl ring-1 ring-black/40 select-none"
      style={{ aspectRatio: String(aspect), touchAction: 'manipulation' }} data-stage data-ritual onPointerDown={onTap}>
      <svg viewBox={`${ox} ${oy} ${vw} ${vh}`} className="absolute inset-0 w-full h-full" role="img" aria-label={label}>
        <ArtDefs />
        {children}
      </svg>
      <div className="grain" aria-hidden="true" />
      {overlay && <div className="absolute inset-0" style={{ ['--ox' as string]: ox, ['--vw' as string]: vw }}>{overlay}</div>}
      <div onPointerDown={(e) => e.stopPropagation()}><Hud s={s} chapter={CHAPTERS[s.chapter]} /></div>
    </div>
  );
}

/** A speech bubble drawn in the SVG, anchored above a point. Short words only — she reacts, she doesn't narrate. */
export function Bubble({ x, y, text, tone = 'hoda' }: { x: number; y: number; text: string; tone?: 'hoda' | 'quiet' }) {
  // Long lines wrap at about 18 letters so a bubble stays inside the phone crop of the stage.
  const lines: string[] = [];
  for (const w of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + ' ' + w).length <= 18) lines[lines.length - 1] = last + ' ' + w; else lines.push(w);
  }
  const w = Math.max(70, Math.max(...lines.map((l) => l.length)) * 17 + 36);
  const h = 14 + lines.length * 34;
  return (
    <g className="bubble-pop" pointerEvents="none" key={text}>
      <rect x={x - w / 2} y={y - 8 - h} width={w} height={h} rx="22" fill={tone === 'hoda' ? '#fff8ea' : '#e9e1d2'} stroke="#3a2418" strokeWidth="2" strokeOpacity=".6" />
      <path d={`M${x - 10} ${y - 9} L${x} ${y + 8} L${x + 8} ${y - 9}Z`} fill={tone === 'hoda' ? '#fff8ea' : '#e9e1d2'} />
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - 8 - h + 38 + i * 34} textAnchor="middle" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize="26" fontWeight="700" fill="#2b2118">{l}</text>
      ))}
    </g>
  );
}

export const COUNT_WORDS = ['صفر', 'واحد', 'اتنين', 'تلاتة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة', 'حداشر', 'اتناشر', 'تلتاشر', 'أربعتاشر', 'خمستاشر', 'ستاشر', 'سبعتاشر', 'تمنتاشر', 'تسعتاشر', 'عشرين', 'واحد وعشرين', 'اتنين وعشرين', 'تلاتة وعشرين', 'أربعة وعشرين'];
export const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);
export const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
