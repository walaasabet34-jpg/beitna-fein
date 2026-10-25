import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { GameState, HubNode } from '../../engine/types';
import { visibleHotspots, getNode, hodaSpot, useHotspot as pickHotspot, IndexedChapter } from '../../engine/core';
import { ArtDefs, HospitalScene, LivingRoom, DoorScene, NightScene, DrawingScene, SchoolScene, HomeworkScene, livingTargets, drawingTargets, homeworkTargets, Rect } from '../../art/scenes';
import { currentExpr, useGame } from '../../store/gameStore';
import { useUiSfx } from '../useUiSfx';

const W = 1200, H = 800;

/** Portrait phones get a taller, cropped window onto the 1200×800 canvas that the player can drag. */
function usePortrait() {
  const get = () => typeof window !== 'undefined' && window.innerWidth < 700 && window.innerHeight > window.innerWidth * 1.15;
  const [p, setP] = useState(get);
  useEffect(() => { const on = () => setP(get()); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  return p;
}

export function applyHotspot(ic: IndexedChapter, s: GameState, hub: HubNode, id: string) {
  if (s.node !== hub.id) return s;
  const h = visibleHotspots(hub, s).find((x) => x.id === id);
  return h ? pickHotspot(ic, s, hub, h) : s;
}

export function Stage({ ic, s, children }: { ic: IndexedChapter; s: GameState; children?: ReactNode }) {
  const act = useGame((g) => g.act);
  const tick = useUiSfx();
  const portrait = usePortrait();
  const node = getNode(ic, s.node);
  const expr = currentExpr(ic, s);
  const scene = s.scene;

  let art: ReactNode;
  let targets: Record<string, Rect> = {};
  if (scene === 'hospital') art = <HospitalScene s={s} />;
  else if (scene === 'door') art = <DoorScene s={s} expr={expr} />;
  else if (scene === 'night') art = <NightScene s={s} expr={expr} />;
  else if (scene === 'drawing') { art = <DrawingScene s={s} />; targets = drawingTargets(s); }
  else if (scene === 'school') art = <SchoolScene s={s} expr={expr} />;
  else if (scene === 'homework') { art = <HomeworkScene s={s} />; targets = homeworkTargets(); }
  else { art = <LivingRoom s={s} expr={expr} morning={scene === 'morning'} />; targets = livingTargets(s); }

  // ── viewport onto the canvas ──
  const aspect = portrait ? 0.95 : 1.5;
  const vw = Math.min(W, H * aspect);
  const spot = hodaSpot(s);
  const focus = scene === 'living' || scene === 'morning'
    ? (() => { const t = targets.hoda; return t ? t[0] + t[2] / 2 : 760; })()
    : scene === 'night' ? 700 : scene === 'homework' ? 650 : 600;
  const [pan, setPan] = useState(0);
  useLayoutEffect(() => setPan(0), [scene, spot, portrait]);
  const maxOx = W - vw;
  const ox = Math.max(0, Math.min(maxOx, focus - vw / 2 + pan));

  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; pan: number; moved: boolean } | null>(null);
  const canPan = portrait && maxOx > 0;
  const onDown = (e: React.PointerEvent) => { if (canPan) drag.current = { x: e.clientX, pan, moved: false }; };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !box.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 8) d.moved = true;
    if (d.moved) setPan(d.pan - (dx / box.current.clientWidth) * vw);
  };
  const onUp = () => { setTimeout(() => { drag.current = null; }, 0); };
  const [hinted, setHinted] = useState(false);
  useEffect(() => { if (pan !== 0) setHinted(true); }, [pan]);

  const hub = node.type === 'hub' ? (node as HubNode) : null;
  const spots = hub ? visibleHotspots(hub, s).filter((h) => h.target && targets[h.target]) : [];

  return (
    <div
      ref={box}
      className="relative w-full overflow-hidden rounded-none sm:rounded-2xl shadow-2xl ring-1 ring-black/40 select-none"
      style={{ aspectRatio: String(aspect), touchAction: canPan ? 'pan-y' : undefined }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}
      data-stage
    >
      <svg key={scene + (scene === 'drawing' ? String(!!s.flags.drawing_hid) : '')} viewBox={`${ox} 0 ${vw} ${H}`}
        className="absolute inset-0 w-full h-full scene-fade" role="img" aria-label={sceneLabel(scene)}>
        <ArtDefs />
        {art}
      </svg>
      <div className="mottle" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      {spots.map((h) => {
        const [x, y, w, hgt] = targets[h.target!];
        if (x + w < ox + 10 || x > ox + vw - 10) return null; // off-screen: still available in the list below
        return (
          <button
            key={h.id}
            className="hot"
            data-hotspot={h.id}
            aria-label={h.label + (h.takesTime ? ' (بياخد وقت)' : '')}
            style={{ left: `${((x - ox) / vw) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / vw) * 100}%`, height: `${(hgt / H) * 100}%` }}
            onClick={() => { if (drag.current?.moved) return; tick(); act((ic2, st) => applyHotspot(ic2, st, hub!, h.id)); }}
          >
            <span className="pip" aria-hidden="true" />
            <span className="tag" aria-hidden="true">{h.label}</span>
          </button>
        );
      })}
      {canPan && !hinted && (scene === 'living' || scene === 'morning') && (
        <div className="absolute bottom-9 inset-x-0 flex justify-center pointer-events-none fade-in">
          <span className="text-xs px-3 py-1 rounded-full bg-black/50 text-white/85">↔ اسحبي عشان تشوفي الأوضة كلها</span>
        </div>
      )}
      {children}
    </div>
  );
}

function sceneLabel(scene: string) {
  return ({ hospital: 'ممر المستشفى', door: 'باب الشقة', living: 'صالة شقة فاطمة', morning: 'الصالة الصبح', night: 'الأوضة بالليل', drawing: 'كراسة هدى', school: 'باب المدرسة', homework: 'كراسة الواجب' } as Record<string, string>)[scene] ?? '';
}
