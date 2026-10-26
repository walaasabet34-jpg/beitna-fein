// Original scenes, drawn in code (SVG). All coordinates use a 1200 × 800 canvas.
import type { GameState, Expr } from '../engine/types';
import { hodaSpot, wardrobe } from '../engine/core';
import { gameDate } from '../engine/calendar';
import { CHAPTERS } from '../content';
import { Hoda, HodaInBed, Suitcase, Doll, HODA, type Look } from './Hoda';
import { Naima, Mother, Teacher as TeacherFig, UmmNadia, Doctor, Doorman } from './people';

export type Rect = [number, number, number, number]; // x, y, w, h in the 1200×800 canvas

/** Hoda's clothes as this playthrough has left them: the dress she put on, its dust, tear or patch, the cardigan, her ribbon. */
export const outfitOf = (s: GameState): Look => {
  const w = wardrobe(s);
  const dress = s.flags.outfit === 'navy' || s.flags.outfit === 'yellow' ? (s.flags.outfit as 'navy' | 'yellow')
    : s.chapter !== 'ch1' && s.flags.c2_outfit === 'navy' ? 'navy' : 'yellow';
  return {
    dress,
    dust: dress === 'yellow' && w.yellow === 'dusty',
    tear: dress === 'yellow' && w.yellow === 'torn',
    patch: dress === 'yellow' ? (w.yellow === 'flower' ? 'flower' : w.yellow === 'mended' ? 'plain' : undefined) : undefined,
    longSleeve: dress === 'navy' && w.navy === 'loose',
    cardigan: s.flags.layer === 'cardigan' && w.cardigan,
    ribbon: s.flags.ribbon === 'red' ? 'red' : 'old',
    redButton: s.flags.red_button === 'hoda',
    rash: !!s.flags.hoda_rash,
  };
};
/** Is a character physically on stage? `cast` (set by story nodes) wins; without it Hoda is always home. */
export const onStage = (s: GameState, who: string) => (s.cast ? s.cast.includes(who) : who === 'hoda');

const P = {
  wall: '#d9bd92', wallDark: '#bf9b6c', wainscot: '#b88e5c', floorA: '#c7ae8c', floorB: '#a9906f',
  wood: '#6b4a2f', woodDark: '#4e3420', woodLight: '#8a6240', iron: '#2a2622', glass: '#5b7f9a',
  sofa: '#7d5a44', cushion: '#a5674a', night: '#1b2433', lamp: '#f0c27a',
};

export function ArtDefs() {
  return (
    <defs>
      <filter id="paint" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="5" />
      </filter>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.22" /></feComponentTransfer>
      </filter>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e3c99f" /><stop offset="1" stopColor={P.wall} />
      </linearGradient>
      <linearGradient id="rayGrad" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff1c9" stopOpacity=".55" /><stop offset="1" stopColor="#fff1c9" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a87a50" /><stop offset="1" stopColor="#3e2414" />
      </linearGradient>
      <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={P.lamp} stopOpacity=".7" /><stop offset="1" stopColor={P.lamp} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
        <stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" />
      </radialGradient>
      <pattern id="tiles" width="80" height="40" patternUnits="userSpaceOnUse">
        <rect width="80" height="40" fill={P.floorA} />
        <path d="M0 20 L40 0 L80 20 L40 40Z" fill={P.floorB} opacity=".55" />
        <path d="M40 12 l8 8 l-8 8 l-8 -8z" fill="#8f6f4f" opacity=".35" />
      </pattern>
    </defs>
  );
}

// Paper grain is a static CSS overlay (see .grain in index.css) — cheaper than an SVG filter on mobile.
function Grain() { return null; }

function Dust() {
  const motes = [[880, 180], [930, 260], [990, 210], [860, 330], [1010, 300], [950, 380], [900, 440], [1040, 250]];
  return (
    <g fill="#fff6dc" pointerEvents="none">
      {motes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.6} className="dust" style={{ animationDelay: `${i * -1.7}s` }} />
      ))}
    </g>
  );
}

// ── Furniture pieces ───────────────────────────────────────
function SewingMachine() {
  return (
    <g>
      {/* treadle table */}
      <rect x="70" y="420" width="230" height="22" rx="4" fill={P.wood} />
      <rect x="80" y="442" width="210" height="10" fill={P.woodDark} />
      <g stroke={P.iron} strokeWidth="7" fill="none">
        <path d="M100 452 L92 640 M270 452 L278 640" />
        <path d="M96 600 Q185 560 274 600" strokeWidth="5" />
        <path d="M120 470 Q185 520 250 470" strokeWidth="4" />
        <circle cx="185" cy="560" r="34" strokeWidth="5" />
      </g>
      <rect x="140" y="616" width="90" height="14" rx="3" fill={P.iron} />
      {/* machine head (generic, no brand) */}
      <path d="M118 420 L118 372 Q118 356 134 356 L252 356 Q268 356 268 372 L268 392 L236 392 L236 420Z" fill="#1f1c1a" />
      <path d="M130 366 L246 366" stroke="#c9a347" strokeWidth="2" opacity=".7" />
      <circle cx="258" cy="380" r="13" fill="#2c2825" stroke="#5a5048" strokeWidth="2" />
      <rect x="236" y="392" width="8" height="24" fill="#1f1c1a" />
      <line x1="240" y1="416" x2="240" y2="424" stroke="#ccc" strokeWidth="1.5" />
      {/* fabric under the needle */}
      <path d="M160 418 Q200 410 250 420 L262 434 Q200 428 150 434Z" fill="#7a8fa6" opacity=".9" />
    </g>
  );
}

function ScrapsBasket() {
  return (
    <g>
      <path d="M300 600 L372 600 L364 662 L308 662Z" fill="#a07a48" />
      {[612, 628, 644].map((y) => <path key={y} d={`M304 ${y} L368 ${y}`} stroke="#7d5a32" strokeWidth="2" />)}
      <path d="M306 600 q10 -18 22 -4 q8 -16 22 -2 q10 -12 18 4" fill="#b5463a" />
      <path d="M318 598 q8 -10 18 0" fill="#6a7a8a" />
      <path d="M340 597 q10 -8 20 2" fill="#efe3c8" />
    </g>
  );
}

function Doorway() {
  return (
    <g>
      <rect x="380" y="186" width="122" height="414" fill={P.woodDark} />
      <rect x="392" y="198" width="98" height="402" fill="#2b2019" />
      {/* hint of the bedroom: bed edge and a blanket */}
      <path d="M392 470 L490 460 L490 600 L392 600Z" fill="#3d2c22" />
      <path d="M400 474 L486 466 L486 500 L400 506Z" fill="#7a5a4a" opacity=".8" />
      <rect x="394" y="200" width="94" height="10" fill="#000" opacity=".25" />
    </g>
  );
}

function Wardrobe() {
  return (
    <g>
      <rect x="518" y="168" width="166" height="432" rx="3" fill={P.wood} />
      <rect x="512" y="160" width="178" height="16" rx="2" fill={P.woodDark} />
      <rect x="532" y="186" width="64" height="300" rx="2" fill={P.woodLight} opacity=".55" />
      <rect x="606" y="186" width="64" height="300" rx="2" fill={P.woodLight} opacity=".55" />
      <rect x="532" y="500" width="138" height="80" rx="2" fill={P.woodLight} opacity=".45" />
      <circle cx="590" cy="340" r="4" fill="#c9a347" /><circle cx="612" cy="340" r="4" fill="#c9a347" />
      <rect x="520" y="598" width="12" height="14" fill={P.woodDark} /><rect x="670" y="598" width="12" height="14" fill={P.woodDark} />
    </g>
  );
}

function Radio() {
  return (
    <g>
      <rect x="700" y="470" width="102" height="14" rx="2" fill={P.wood} />
      <path d="M708 484 L702 612 M794 484 L800 612" stroke={P.woodDark} strokeWidth="7" />
      <path d="M708 470 L708 404 Q708 384 751 384 Q794 384 794 404 L794 470Z" fill="#7a4a2a" />
      <rect x="716" y="402" width="70" height="38" rx="6" fill="#d8c79c" />
      {[410, 418, 426, 434].map((y) => <line key={y} x1="720" x2="782" y1={y} y2={y} stroke="#a8946a" strokeWidth="2" />)}
      <rect x="720" y="446" width="62" height="10" rx="2" fill="#efe1b2" />
      <line x1="748" y1="446" x2="748" y2="456" stroke="#9c4a33" strokeWidth="2" />
      <circle cx="726" cy="463" r="5" fill="#3a2414" /><circle cx="776" cy="463" r="5" fill="#3a2414" />
    </g>
  );
}

function PhotoFrame({ withDrawing }: { withDrawing: boolean }) {
  return (
    <g>
      {/* a studio photograph of Fatma's late husband: sepia print in a cream oval mount */}
      <rect x="710" y="212" width="82" height="96" rx="2" fill="#4e3420" />
      <rect x="714" y="216" width="74" height="88" fill="#6b4a2f" />
      <rect x="718" y="220" width="66" height="80" fill="#e9dfc8" />
      <defs>
        <radialGradient id="sepiaPhoto" cx="50%" cy="38%" r="65%">
          <stop offset="0" stopColor="#d9c19a" /><stop offset="0.7" stopColor="#b8976a" /><stop offset="1" stopColor="#8e6f4a" />
        </radialGradient>
        <clipPath id="photoOval"><ellipse cx="751" cy="260" rx="26" ry="33" /></clipPath>
      </defs>
      <ellipse cx="751" cy="260" rx="27.5" ry="34.5" fill="#c8b48e" />
      <g clipPath="url(#photoOval)">
        <rect x="720" y="222" width="62" height="76" fill="url(#sepiaPhoto)" />
        {/* jacket, shirt and tie */}
        <path d="M722 296 Q726 276 742 272 L751 284 L760 272 Q776 276 780 296Z" fill="#4a3826" />
        <path d="M744 272 L751 284 L758 272 L755 269 L747 269Z" fill="#efe4cc" />
        <path d="M749.5 276 L752.5 276 L753.5 290 L751 293 L748.5 290Z" fill="#3a2b1d" />
        {/* neck and face */}
        <path d="M745 262 h12 v9 q-6 4 -12 0Z" fill="#a8835a" />
        <ellipse cx="751" cy="252" rx="10.5" ry="13" fill="#b58f63" />
        <ellipse cx="740.6" cy="253" rx="1.8" ry="3" fill="#a8835a" /><ellipse cx="761.4" cy="253" rx="1.8" ry="3" fill="#a8835a" />
        {/* revised portrait: softer wavy hair and a slightly older face */}
        <path d="M740 251 Q737 241 743 238 Q747 233 752 237 Q759 233 763 242 L762 251 Q760 245 757 244 Q753 246 750 242 Q746 245 743 244Z" fill="#34271e" />
        <path d="M743 257 Q745 259 747 258 M755 258 Q758 259 760 257" stroke="#8d6a45" strokeWidth="0.7" fill="none" opacity=".7" />
        <path d="M745 248.5 h4 M753 248.5 h4" stroke="#3a2d22" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="747" cy="251.3" r="1" fill="#2e241b" /><circle cx="755" cy="251.3" r="1" fill="#2e241b" />
        <path d="M751 252 l-1 4.5 h2" stroke="#8d6a45" strokeWidth="0.8" fill="none" />
        <path d="M745.5 259 Q751 257 756.5 259 Q751 261.8 745.5 259Z" fill="#34271e" />
        <path d="M748.5 262 Q751 263 753.5 262" stroke="#7a5638" strokeWidth="0.8" fill="none" />
      </g>
      {/* black mourning ribbon across the corner */}
      <path d="M776 212 L792 212 L792 228Z" fill="#1d1a17" />
      {withDrawing && (
        <g transform="rotate(3 836 262)">
          <rect x="800" y="220" width="74" height="86" fill="#f4ecd8" stroke="#b9a37f" />
          <path d="M814 286 v-30 h30 v30 M814 256 l15 -14 l15 14 M808 296 q10 -6 20 0 q10 6 20 0 q10 -6 20 0" stroke="#666" strokeWidth="1.6" fill="none" />
          <circle cx="860" cy="236" r="6" stroke="#666" fill="none" />
        </g>
      )}
    </g>
  );
}

function Window({ night }: { night: boolean }) {
  return (
    <g>
      <rect x="850" y="100" width="260" height="300" fill={P.woodDark} />
      <rect x="866" y="116" width="228" height="268" fill={night ? '#22324a' : '#9fc0d6'} />
      {/* blue-painted panes (wartime) — see verify notes */}
      {[[866, 116], [982, 116], [866, 252], [982, 252]].map(([x, y], i) => (
        <rect key={i} x={x + 6} y={y + 6} width="100" height="120" fill={night ? '#1d2b42' : P.glass} opacity=".82" />
      ))}
      <rect x="976" y="116" width="8" height="268" fill={P.woodDark} />
      <rect x="866" y="246" width="228" height="8" fill={P.woodDark} />
      {/* shutters (شيش) half open */}
      <g fill="#5e6f4f">
        <path d="M850 100 L812 116 L812 392 L850 400Z" />
        <path d="M1110 100 L1148 116 L1148 392 L1110 400Z" />
      </g>
      <g stroke="#475637" strokeWidth="2">
        {Array.from({ length: 14 }, (_, i) => <line key={i} x1="814" x2="848" y1={130 + i * 18} y2={128 + i * 18} />)}
        {Array.from({ length: 14 }, (_, i) => <line key={'r' + i} x1="1112" x2="1146" y1={128 + i * 18} y2={130 + i * 18} />)}
      </g>
      <rect x="840" y="398" width="280" height="12" fill={P.woodLight} />
      {/* clay water jug (قلّة) on the sill */}
      <path d="M1066 398 q-14 -4 -12 -24 q2 -14 10 -16 l0 -8 h8 l0 8 q8 2 10 16 q2 20 -12 24z" fill="#b5764a" />
    </g>
  );
}

function Sofa() {
  return (
    <g>
      <rect x="826" y="452" width="344" height="40" rx="8" fill={P.sofa} />
      <rect x="826" y="488" width="344" height="74" rx="6" fill={P.cushion} />
      <path d="M940 492 v66 M1056 492 v66" stroke="#87503a" strokeWidth="3" />
      <rect x="814" y="460" width="24" height="120" rx="8" fill={P.wood} />
      <rect x="1158" y="460" width="24" height="120" rx="8" fill={P.wood} />
      <rect x="830" y="560" width="336" height="18" fill={P.wood} />
      <path d="M836 578 v32 M1160 578 v32" stroke={P.woodDark} strokeWidth="8" />
      {/* crocheted cover */}
      <path d="M870 452 q20 14 40 0 q20 14 40 0 q20 14 40 0" stroke="#efe3c8" strokeWidth="3" fill="none" opacity=".7" />
    </g>
  );
}

function Tabliya({ meal }: { meal: 'none' | 'dinner' | 'breakfast' }) {
  return (
    <g>
      <ellipse cx="600" cy="716" rx="150" ry="16" fill="#000" opacity=".18" />
      <path d="M470 690 L480 716 M730 690 L720 716 M560 696 L560 718 M640 696 L640 718" stroke={P.woodDark} strokeWidth="9" />
      <ellipse cx="600" cy="684" rx="150" ry="32" fill={P.woodLight} />
      <ellipse cx="600" cy="680" rx="150" ry="30" fill="#9b7350" />
      {meal !== 'none' && (
        <g>
          <ellipse cx="560" cy="676" rx="30" ry="9" fill="#efe9dc" />
          <ellipse cx="560" cy="674" rx="20" ry="5" fill={meal === 'dinner' ? '#d39a42' : '#c6a167'} />
          <ellipse cx="640" cy="680" rx="30" ry="9" fill="#efe9dc" />
          <ellipse cx="640" cy="678" rx="20" ry="5" fill={meal === 'dinner' ? '#e6c56e' : '#8a6a3a'} />
          <ellipse cx="600" cy="666" rx="26" ry="7" fill="#c9a26a" />
          {meal === 'breakfast' && <rect x="680" y="652" width="16" height="22" rx="3" fill="#e8d9b8" opacity=".9" />}
        </g>
      )}
    </g>
  );
}

// ── Living room (afternoon → night, and the next morning) ────
// 0 الصبح · 1 الضهر · 2 العصر · 3 المغرب · 4 بالليل
const TINTS: Record<number, [string, number]> = {
  0: ['#fff2d8', 0.06], 1: ['#ffe2a8', 0.04], 2: ['#ffb46a', 0.12], 3: ['#d9704a', 0.26], 4: ['#0e1626', 0.55],
};

/** Details that carry the household's means: the coin tin, the thread spools, the calendar, the patched cushion. */
function HouseholdThings({ s, slot }: { s: GameState; slot: number }) {
  const coins = Math.max(0, Math.min(7, Math.ceil(s.money / 6)));
  const spools = typeof s.flags.thread === 'number' ? Math.max(0, Math.min(4, s.flags.thread as number)) : 2;
  const date = CHAPTERS[s.chapter] ? gameDate(CHAPTERS[s.chapter], s.day) : null;
  const day = date ? Number(date.slice(8, 10)) : null;
  return (
    <g>
      {/* cracked plaster by the doorway, bricks showing */}
      <path d="M318 150 q18 -10 34 4 q12 18 -4 34 q-20 10 -34 -6 q-8 -18 4 -32z" fill="#b48a62" opacity=".75" />
      <g stroke="#8d5b3a" strokeWidth="2" opacity=".6"><path d="M320 166 h30 M326 178 h22 M334 166 v12" /></g>
      <path d="M352 150 l18 -26 l6 10 l14 -18" stroke="#9a7650" strokeWidth="1.5" fill="none" opacity=".7" />
      {/* tear-off wall calendar (نتيجة) */}
      <g transform="translate(232 196)">
        <rect width="54" height="66" rx="2" fill="#efe6d0" stroke="#7a5a3a" strokeWidth="1.5" />
        <rect width="54" height="14" fill="#9c4a33" />
        <text x="27" y="52" textAnchor="middle" fontFamily="'Noto Naskh Arabic', serif" fontSize="30" fontWeight="700" fill="#2b2118">{day ? arDigits(day) : ''}</text>
        <line x1="27" y1="-12" x2="27" y2="0" stroke="#5a4636" strokeWidth="1.5" />
      </g>
      {/* thread spools on the machine table */}
      {Array.from({ length: spools }, (_, i) => (
        <g key={i} transform={`translate(${86 + i * 18} 404)`} data-spool>
          <rect x="-6" y="0" width="12" height="16" rx="2" fill={['#7a8fa6', '#efe3c8', '#b5463a', '#3a3a3a'][i]} />
          <rect x="-7" y="-2" width="14" height="3" fill="#8a6240" /><rect x="-7" y="15" width="14" height="3" fill="#8a6240" />
        </g>
      ))}
      {/* the coin tin (علبة الصفيح): how full it looks is how the week is going */}
      <g transform="translate(262 398)" data-coins={coins}>
        <rect x="-18" y="2" width="36" height="20" rx="3" fill="#8d8f86" stroke="#5f615a" strokeWidth="1.5" />
        <path d="M-18 6 h36" stroke="#b9bbb1" strokeWidth="1.5" />
        {Array.from({ length: coins }, (_, i) => <ellipse key={i} cx={-10 + (i % 4) * 7} cy={2 - Math.floor(i / 4) * 3} rx="4.2" ry="2" fill="#c7a24a" stroke="#8a6d2c" strokeWidth=".6" />)}
      </g>
      {/* button tin */}
      <g transform="translate(206 400)"><ellipse cx="0" cy="14" rx="15" ry="5" fill="#5f615a" /><rect x="-15" y="2" width="30" height="12" fill="#7c7e74" /><ellipse cx="0" cy="2" rx="15" ry="5" fill="#a2a497" />
        {[[-6, 1, '#efe3c8'], [3, 0, '#7a4a2a'], [8, 3, '#2b2b2b']].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="2.6" fill={c as string} />)}</g>
      {/* patched sofa cushion */}
      <rect x="1080" y="500" width="40" height="30" rx="3" fill="#8a5a42" stroke="#efe3c8" strokeWidth="1.4" strokeDasharray="3 3" transform="rotate(4 1100 515)" />
      {/* the sock ball lives on the floor once it exists */}
      {(s.flags.ball_games || s.flags.ball_stairs) && !s.node.startsWith('ball') && slot < 5 && <SockBall x={s.flags.hoda_died ? 150 : 790} y={s.flags.hoda_died ? 650 : 700} r={15} />}
    </g>
  );
}
const arDigits = (n: number) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);

export function SockBall({ x, y, r = 16, rot = 0 }: { x: number; y: number; r?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} data-sockball>
      <circle r={r} fill="#d8cdb5" stroke="#6b5a44" strokeWidth={r / 10} />
      <path d={`M${-r} 0 Q0 ${-r * 0.5} ${r} 0`} stroke="#9c4a33" strokeWidth={r / 5} fill="none" />
      <path d={`M${-r * 0.7} ${r * 0.55} Q0 ${r * 0.2} ${r * 0.7} ${r * 0.55}`} stroke="#9c4a33" strokeWidth={r / 7} fill="none" />
      <path d={`M${-r * 0.3} ${-r * 0.9} q${r * 0.3} ${r * 0.4} ${r * 0.1} ${r * 0.8}`} stroke="#6b5a44" strokeWidth={r / 12} fill="none" />
    </g>
  );
}

/** The flat itself, without Hoda: walls, furniture, light for the hour, and what the household owns. */
export function RoomShell({ s, slot, morning = false, children, hidden = false }: { s: GameState; slot: number; morning?: boolean; children?: React.ReactNode; hidden?: boolean }) {
  if (hidden) return <g>{children}</g>;
  const night = slot >= 4;
  const [tint, op] = TINTS[slot] ?? TINTS[2];
  const meal = morning ? 'breakfast' : s.flags.cooked && slot >= 3 && slot < 4 ? 'dinner' : 'none';
  return (
    <g>
      <g>
        <rect width="1200" height="610" fill="url(#wallGrad)" />
        <rect y="540" width="1200" height="70" fill={P.wainscot} opacity=".55" />
        <rect y="604" width="1200" height="8" fill={P.woodDark} />
        <rect y="610" width="1200" height="190" fill="url(#tiles)" />
        <path d="M80 700 l60 -6 l18 12 M940 760 l40 -20 l14 8" stroke="#7d6248" strokeWidth="2" fill="none" opacity=".6" />
        <ellipse cx="300" cy="120" rx="120" ry="40" fill={P.wallDark} opacity=".25" />
        <ellipse cx="720" cy="80" rx="80" ry="22" fill={P.wallDark} opacity=".2" />
        <path d="M0 560 Q300 548 600 562 T1200 556" stroke="#8d6a45" strokeWidth="6" opacity=".18" fill="none" />
        <Window night={night} />
        <Doorway />
        <Wardrobe />
        <PhotoFrame withDrawing={!!s.flags.drawing_on_wall && (morning || s.day > 1 || s.chapter !== 'ch1')} />
        <Radio />
        <Sofa />
        <SewingMachine />
        <ScrapsBasket />
        <HouseholdThings s={s} slot={slot} />
      </g>
      {!night && (
        <g className="rays" pointerEvents="none">
          <path d="M870 120 L1090 120 L760 790 L330 790Z" fill="url(#rayGrad)" opacity=".5" />
        </g>
      )}
      {!night && <Dust />}
      {children}
      <Tabliya meal={meal as 'none' | 'dinner' | 'breakfast'} />
      <rect width="1200" height="800" fill={tint} opacity={op} style={{ mixBlendMode: 'multiply' }} pointerEvents="none" />
      {night && <circle cx="751" cy="300" r="260" fill="url(#lampGlow)" opacity=".5" className="flicker" pointerEvents="none" />}
      <rect width="1200" height="800" fill="url(#vignette)" pointerEvents="none" />
    </g>
  );
}

export function LivingRoom({ s, expr, morning = false }: { s: GameState; expr: Expr; morning?: boolean }) {
  const slot = morning ? 0 : s.slot;
  const spot = hodaSpot(s);
  const doll = !!s.flags.made_doll;
  const bagOnTop = !!s.flags.bag_on_closet && !s.flags.bag_returned && !morning && s.chapter === 'ch1' && s.day === 1;
  const outfit = outfitOf(s);
  const bagGone = ['mother', 'messenger'].includes(String(s.flags.belongings_delivery));
  return (
    <RoomShell s={s} slot={slot} morning={morning}>
      {onStage(s, 'mother') && <g transform="translate(700 236)"><Mother expr={s.flags.mother_met ? 'sad' : 'tired'} pose="hold" /></g>}
      {onStage(s, 'naima') && <g transform="translate(950 240)"><Naima pose="shy" expr="sad" /></g>}
      {bagOnTop && <Suitcase x={556} y={92} s={0.85} />}
      {!bagOnTop && !onStage(s, 'hoda') && !bagGone && <Suitcase x={930} y={700} s={0.9} />}
      {onStage(s, 'hoda') && spot === 'underCloset' && (
        <g transform="translate(528 548)"><Hoda pose="sit" expr={expr} doll={doll} outfit={outfit} /></g>
      )}
      {onStage(s, 'hoda') && spot === 'corner' && (
        <g>
          <Suitcase x={930} y={700} s={0.9} />
          <g transform="translate(1015 560)"><Hoda pose="sit" expr={expr} doll={doll} outfit={outfit} /></g>
        </g>
      )}
      {onStage(s, 'hoda') && spot === 'sofa' && (
        <g>
          <Suitcase x={1060} y={556} s={0.8} />
          <g transform="translate(910 330)"><Hoda pose="sit" expr={expr} doll={doll} outfit={outfit} /></g>
        </g>
      )}
      {onStage(s, 'hoda') && spot === 'sewing' && (
        <g>
          <Suitcase x={1060} y={556} s={0.8} />
          <g transform="translate(360 470) scale(0.95)"><Hoda pose={s.flags.sewing_together ? 'point' : 'stand'} expr={expr} doll={doll} outfit={outfit} /></g>
        </g>
      )}
    </RoomShell>
  );
}

export function livingTargets(s: GameState): Record<string, Rect> {
  const spot = hodaSpot(s);
  const bagOnTop = !!s.flags.bag_on_closet && !s.flags.bag_returned && s.chapter === 'ch1' && s.day === 1;
  const hoda: Rect = spot === 'underCloset' ? [540, 560, 140, 220] : spot === 'corner' ? [1030, 570, 150, 220]
    : spot === 'sofa' ? [920, 340, 140, 220] : [370, 470, 150, 300];
  const suitcase: Rect = bagOnTop ? [550, 80, 90, 72] : spot === 'corner' ? [924, 686, 90, 70] : [1052, 540, 84, 64];
  const present = onStage(s, 'hoda');
  return {
    ...(present ? { hoda } : {}),
    suitcase: present ? suitcase : [924, 686, 90, 70],
    table: [450, 640, 300, 90],
    doorway: [384, 190, 116, 270],
    radio: [700, 380, 104, 110],
    sewing: [80, 350, 200, 110],
    scraps: [296, 586, 80, 84],
    window: [860, 110, 240, 240],
    ball: [740, 650, 100, 100],
    wardrobe: [518, 168, 166, 432],
  };
}

// ── Entrance ───────────────────────────────────────────────
export function DoorScene({ s, expr }: { s: GameState; expr: Expr }) {
  const castMode = !!s.cast;
  const open = castMode || !!s.flags.door_open;
  const naimaGone = castMode ? !onStage(s, 'naima') : !!s.flags.naima_left;
  const showHoda = castMode ? onStage(s, 'hoda') : open;
  const outfit = outfitOf(s);
  return (
    <g>
      <g>
        <rect width="1200" height="800" fill="url(#wallGrad)" />
        <rect y="610" width="1200" height="190" fill="url(#tiles)" />
        <rect x="360" y="60" width="480" height="560" fill={P.woodDark} />
        {open ? (
          <g>
            {/* landing outside: dim, a bulb, the banister */}
            <rect x="380" y="78" width="440" height="542" fill="#3b3128" />
            <rect x="380" y="78" width="440" height="542" fill="#1b2433" opacity=".35" />
            <line x1="600" y1="78" x2="600" y2="120" stroke="#222" strokeWidth="2" />
            <circle cx="600" cy="128" r="10" fill="#f0d79a" />
            <circle cx="600" cy="128" r="90" fill="url(#lampGlow)" opacity=".7" />
            <path d="M380 470 L820 430" stroke="#2a211a" strokeWidth="10" />
            {Array.from({ length: 10 }, (_, i) => <line key={i} x1={392 + i * 44} y1={468 - i * 4} x2={392 + i * 44} y2="620" stroke="#2a211a" strokeWidth="4" />)}
            {/* open door leaf */}
            <path d="M380 78 L300 100 L300 640 L380 620Z" fill={P.wood} />
            <circle cx="318" cy="380" r="7" fill="#c9a347" />
          </g>
        ) : (
          <g>
            <rect x="380" y="78" width="440" height="542" fill={P.wood} />
            {[[400, 100], [610, 100], [400, 360], [610, 360]].map(([x, y], i) => <rect key={i} x={x} y={y} width="190" height="240" rx="4" fill={P.woodLight} opacity=".5" />)}
            <circle cx="790" cy="380" r="8" fill="#c9a347" />
            <rect x="380" y="612" width="440" height="8" fill="#ffe2a0" opacity=".55" />
          </g>
        )}
      </g>
      {open && !naimaGone && <g transform="translate(640 236)"><Naima expr={s.flags.hoda_died ? 'sad' : 'neutral'} pose={s.chapter === 'ch1' ? 'handsHips' : 'stand'} /></g>}
      {open && onStage(s, 'ummnadia') && <g transform="translate(600 230)"><UmmNadia pose="handsHips" expr={s.flags.c2_un === 'fight' ? 'upset' : 'guarded'} /></g>}
      {onStage(s, 'doorman') && <g transform="translate(860 230)"><Doorman pose="point" /></g>}
      {showHoda && (
        <g transform="translate(470 330) scale(0.95)">{castMode ? <Hoda pose="stand" expr={expr} outfit={outfit} schoolbag /> : <Hoda pose="stand" bag expr={expr} />}</g>
      )}
      <rect width="1200" height="800" fill="#ffb46a" opacity=".08" style={{ mixBlendMode: 'multiply' }} />
      <rect width="1200" height="800" fill="url(#vignette)" />
      <Grain />
    </g>
  );
}

// ── Night (where she sleeps depends on the bed choices) ─────
export function NightScene({ s, expr }: { s: GameState; expr: Expr }) {
  const place = String(s.flags.bed_place ?? 'sofa');
  const lightOn = s.flags.bed_light === 'on';
  const asleep = !!s.flags.hoda_asleep;
  const bagSpot = String(s.flags.bed_bag ?? 'pillow');
  const isSofa = place === 'sofa' || place === 'sofa_unmade';
  return (
    <g>
      <g>
        <rect width="1200" height="610" fill="#2a2f3c" />
        <rect y="610" width="1200" height="190" fill="url(#tiles)" />
        <rect y="610" width="1200" height="190" fill="#0b1220" opacity=".55" />
        {/* moonlit shutter */}
        <rect x="120" y="110" width="220" height="280" fill="#16202e" />
        {Array.from({ length: 13 }, (_, i) => <line key={i} x1="126" x2="334" y1={124 + i * 20} y2={124 + i * 20} stroke="#93a8c4" strokeWidth="3" opacity=".35" />)}
        <path d="M150 390 L560 800 L120 800Z" fill="#9fb4d4" opacity=".08" />
        {isSofa ? (
          <g>
            <rect x="500" y="430" width="560" height="50" rx="10" fill="#4a3428" />
            <rect x="500" y="476" width="560" height="96" rx="8" fill="#5a3a30" />
            <rect x="488" y="440" width="28" height="150" rx="8" fill="#3a281e" />
            <rect x="1044" y="440" width="28" height="150" rx="8" fill="#3a281e" />
          </g>
        ) : place === 'sewing_room' ? (
          <g>
            <path d="M880 330 L880 290 Q880 276 896 276 L1010 276 Q1026 276 1026 290 L1026 330Z" fill="#141210" />
            <rect x="860" y="330" width="190" height="16" fill="#3a281e" />
            <rect x="480" y="560" width="440" height="70" rx="10" fill="#cfc2a6" />
          </g>
        ) : (
          <g>
            {/* Fatma's bed edge + a floor mattress beside it */}
            <rect x="760" y="380" width="420" height="160" rx="6" fill="#3a2a22" />
            <rect x="760" y="380" width="420" height="40" fill="#cfc2a6" opacity=".8" />
            <rect x="420" y="560" width="440" height="70" rx="10" fill="#cfc2a6" />
          </g>
        )}
      </g>

      {/* Hoda */}
      {asleep ? (
        <g>
          <g transform={isSofa ? 'translate(530 360)' : 'translate(440 480)'}>
            <HodaInBed cover={s.flags.bed_cover === 'wool' ? '#7a5a3e' : '#a56a5a'} look={outfitOf(s)} width={isSofa ? 500 : 440} />
            {s.flags.made_doll ? <Doll x={140} y={44} s={1.1} /> : null}
          </g>
        </g>
      ) : (
        <g transform={isSofa ? 'translate(620 286)' : 'translate(520 380)'}>
          <Hoda pose="draw" expr={expr} />
        </g>
      )}
      {bagSpot !== 'closet' && bagSpot !== 'under' && (
        <Suitcase x={isSofa ? 1070 : 900} y={isSofa ? 540 : 590} s={0.85} open={['c1_peek1', 'c1_peek2', 'c1_peek3', 'c1_peek4', 'c2_cert1', 'c2_cert2', 'c2_cert3', 'c2_cert4', 'c2_cert_seen', 'c2_cert_seen2'].includes(s.node)} />
      )}
      {bagSpot === 'under' && <Suitcase x={isSofa ? 760 : 640} y={isSofa ? 600 : 640} s={0.7} />}

      {!asleep && (
        <g transform={isSofa ? 'translate(440 470)' : 'translate(360 520)'}>
          <rect x="0" y="40" width="70" height="80" fill="#3a281e" />
          <path d="M22 40 L48 40 L44 10 L26 10Z" fill="#c9a347" opacity=".85" />
          <ellipse cx="35" cy="8" rx="16" ry="6" fill="#f0c27a" opacity=".9" />
        </g>
      )}
      {lightOn && <path d="M1200 0 L1120 0 L700 800 L1200 800Z" fill="#f0c27a" opacity=".16" />}
      <circle cx={isSofa ? 760 : 660} cy={isSofa ? 380 : 470} r="300" fill="url(#lampGlow)" opacity={asleep ? 0.12 : 0.42} className="flicker" />
      <rect width="1200" height="800" fill="url(#vignette)" />
      <Grain />
    </g>
  );
}

// ── Hoda's drawing (close-up of a school notebook page) ─────
export function DrawingScene({ s }: { s: GameState }) {
  const hid = !!s.flags.drawing_hid;
  const stroke = { stroke: '#4a4a4a', strokeWidth: 4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const d = (delay: number, len = 1400) => ({ className: 'draw-stroke', style: { ['--delay' as string]: `${delay}s`, ['--len' as string]: len } });
  return (
    <g>
      <rect width="1200" height="800" fill="#2a2018" />
      <g transform="rotate(-1.5 600 400)">
        <rect x="70" y="40" width="1060" height="720" rx="6" fill="#f4ecd8" />
        {Array.from({ length: 22 }, (_, i) => <line key={i} x1="90" x2="1110" y1={86 + i * 31} y2={86 + i * 31} stroke="#a9c0d3" strokeWidth="1.4" />)}
        <line x1="1040" x2="1040" y1="40" y2="760" stroke="#d48a8a" strokeWidth="1.8" />
        {/* the drawing */}
        <g {...stroke}>
          {/* sun */}
          <circle cx="210" cy="150" r="46" {...d(0, 300)} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={210 + Math.cos(a) * 60} y1={150 + Math.sin(a) * 60} x2={210 + Math.cos(a) * 84} y2={150 + Math.sin(a) * 84} {...d(0.3 + i * 0.05, 40)} />;
          })}
          {/* house – page-turned version is simpler */}
          <path d="M420 560 L418 250 L760 246 L764 562" {...d(0.6, 1100)} />
          <path d="M400 256 L590 130 L782 252" {...d(1.2, 500)} />
          <path d="M560 562 L560 452 L630 450 L632 562" {...d(1.5, 300)} />
          {!hid && (
            <>
              {/* second-floor window with plants */}
              <rect x="460" y="290" width="80" height="70" {...d(1.7, 300)} />
              <path d="M466 290 q6 -24 14 0 q8 -26 16 0 q8 -22 16 0" {...d(1.9, 200)} />
              {/* balcony with mum hanging washing */}
              <path d="M600 380 L740 380 L740 420 L600 420Z M620 380 v40 M650 380 v40 M680 380 v40 M710 380 v40" {...d(2.0, 700)} />
              <circle cx="672" cy="296" r="14" {...d(2.3, 100)} />
              <path d="M672 310 L660 372 L686 372Z M640 300 L760 296" {...d(2.4, 300)} />
              <path d="M700 298 v18 h14 v-18 M728 297 v22" {...d(2.6, 120)} />
              {/* sea */}
              <path d="M90 650 q40 -24 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" {...d(2.8, 1400)} />
              <path d="M110 700 q40 -24 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" {...d(3.1, 1300)} />
              {/* cat */}
              <path d="M860 560 q-6 -46 30 -50 q36 4 30 50 Z M868 516 l6 -18 l10 14 M904 512 l10 -14 l4 18 M920 548 q30 -10 20 -40" {...d(3.4, 500)} />
              <circle cx="880" cy="530" r="2.5" fill="#4a4a4a" /><circle cx="902" cy="530" r="2.5" fill="#4a4a4a" />
            </>
          )}
        </g>
        {!hid && (
          <text x="820" y="230" fontFamily="'Aref Ruqaa', serif" fontSize="38" fill="#4a4a4a" opacity=".85">بيتنا</text>
        )}
        {hid && (
          <text x="240" y="700" fontFamily="'Noto Naskh Arabic', serif" fontSize="26" fill="#8a7a68">(الصفحة اللي قبلها اتقلبت)</text>
        )}
      </g>
      <Grain />
    </g>
  );
}

export function drawingTargets(s: GameState): Record<string, Rect> {
  if (s.flags.drawing_hid) return { house: [400, 120, 400, 450] };
  return {
    woman: [628, 270, 120, 110],
    house: [400, 120, 220, 450],
    sea: [90, 620, 900, 110],
    cat: [840, 490, 120, 90],
  };
}

// ── Chapter 2 additions ─────────────────────────
export function SchoolScene({ s, expr }: { s: GameState; expr: Expr }) {
  return (
    <g>
      <rect width="1200" height="800" fill="#cfe0ea" />
      <rect y="560" width="1200" height="240" fill="#bfae8f" />
      {/* school wall, gate, sign */}
      <rect x="0" y="230" width="1200" height="340" fill="#d8b98a" />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 100} y="230" width="98" height="16" fill="#c4a274" />)}
      <rect x="420" y="250" width="360" height="320" fill="#4a4a46" />
      <g stroke="#2b2b28" strokeWidth="8">{Array.from({ length: 10 }, (_, i) => <line key={i} x1={440 + i * 36} y1="260" x2={440 + i * 36} y2="570" />)}</g>
      <rect x="430" y="190" width="340" height="56" rx="6" fill="#f3ead6" stroke="#6b4a2f" strokeWidth="4" />
      <text x="600" y="228" textAnchor="middle" fontFamily="'Noto Naskh Arabic', serif" fontSize="28" fill="#2b2118">مدرسة البنات الابتدائية</text>
      {/* tree + girls in the yard beyond the gate */}
      <circle cx="1040" cy="200" r="120" fill="#7f9a62" /><rect x="1028" y="250" width="24" height="320" fill="#6b4a2f" />
      {[480, 560, 690].map((gx, i) => <g key={i} opacity=".55"><circle cx={gx} cy="430" r="16" fill="#2a1a12" /><path d={`M${gx - 18} 448 h36 l8 70 h-52z`} fill={i === 1 ? '#c49a3c' : '#33426a'} /></g>)}
      <rect width="1200" height="800" fill="#ffe2a8" opacity=".08" />
      <g transform="translate(820 236)"><TeacherFig expr={s.flags.c2_teacher === 'firm' ? 'guarded' : 'smile'} /></g>
      {onStage(s, 'hoda') && <g transform="translate(250 330) scale(0.95)"><Hoda pose="stand" expr={expr} outfit={outfitOf(s)} schoolbag /></g>}
      <rect width="1200" height="800" fill="url(#vignette)" />
    </g>
  );
}

const pencil = { fontFamily: "'Aref Ruqaa', 'Noto Naskh Arabic', serif", fill: '#3d3d3d' };
function wrap(text: string, max = 34): string[] {
  const out: string[] = []; let line = '';
  for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w; }
  if (line.trim()) out.push(line.trim());
  return out;
}
export function HomeworkScene({ s }: { s: GameState }) {
  const word = (flag: string, wrong: string, right: string) => (s.flags[flag] === 'fixed' ? right : wrong);
  const fam = typeof s.flags.c2_fam_line === 'string' ? (s.flags.c2_fam_line as string) : '';
  return (
    <g>
      <rect width="1200" height="800" fill="#2a2018" />
      <g transform="rotate(1 600 400)">
        <rect x="70" y="40" width="1060" height="720" rx="6" fill="#f6efdc" />
        {Array.from({ length: 22 }, (_, i) => <line key={i} x1="90" x2="1110" y1={86 + i * 31} y2={86 + i * 31} stroke="#a9c0d3" strokeWidth="1.4" />)}
        <line x1="1040" x2="1040" y1="40" y2="760" stroke="#d48a8a" strokeWidth="1.8" />
        <text x="1010" y="140" textAnchor="start" direction="rtl" {...pencil} fontSize="40">إملاء</text>
        <text x="1000" y="234" textAnchor="start" direction="rtl" {...pencil} fontSize="46">{word('c2_w_tree', 'شجره', 'شجرة')}</text>
        <text x="760" y="234" textAnchor="start" direction="rtl" {...pencil} fontSize="46">{word('c2_w_school', 'مدرسه', 'مدرسة')}</text>
        <text x="480" y="234" textAnchor="start" direction="rtl" {...pencil} fontSize="46">بحر</text>
        {s.flags.c2_w_tree === 'fixed' && <circle cx="918" cy="214" r="6" fill="#c0392b" opacity=".8" />}
        {s.flags.c2_w_school === 'fixed' && <circle cx="678" cy="214" r="6" fill="#c0392b" opacity=".8" />}
        <text x="1010" y="360" textAnchor="start" direction="rtl" {...pencil} fontSize="40">عيلتي:</text>
        {fam ? wrap(fam).map((l, i) => <text key={i} x="1000" y={430 + i * 62} textAnchor="start" direction="rtl" {...pencil} fontSize="38" className="fade-in">{l}</text>)
             : <text x="1000" y="430" textAnchor="start" direction="rtl" fontFamily="'Noto Naskh Arabic', serif" fontSize="26" fill="#9a8a76">(لسه ماكتبتش)</text>}
      </g>
    </g>
  );
}
export function homeworkTargets(): Record<string, Rect> {
  return { tree: [850, 180, 170, 80], school: [600, 180, 180, 80], sea: [370, 180, 130, 80], family: [140, 320, 900, 260] };
}

/** Ill at home: her bedding moved into the living room, near Fatma's machine, curtain half drawn. */
export function SickRoomScene({ s }: { s: GameState }) {
  const look = { ...outfitOf(s), rash: !!s.flags.hoda_rash };
  return (
    <RoomShell s={s} slot={Math.min(s.slot, 3)}>
      <g data-sickroom>
        <rect x="380" y="560" width="520" height="90" rx="12" fill="#d8ccb2" stroke="#9c8a6a" strokeWidth="3" />
        {onStage(s, 'hoda') && <g transform="translate(400 470)" data-patient><HodaInBed expr={s.flags.hoda_rash ? 'sick' : 'tired'} cover={s.flags.layer === 'cardigan' ? '#8a6f5a' : '#a56a5a'} look={look} width={480} /></g>}
        <rect x="910" y="590" width="60" height="50" rx="6" fill="#6b4a2f" />
        <path d="M925 590 v-24 h30 v24" fill="#e8e0cc" stroke="#9c8a6a" strokeWidth="2" />
        {s.flags.ball_games ? <SockBall x={880} y={680} r={15} /> : null}
        {onStage(s, 'doctor') && <g transform="translate(160 236)"><Doctor expr="worried" pose="hold" /></g>}
      </g>
    </RoomShell>
  );
}

/** Hospital corridor: Hoda is being treated off stage, not shown as a healthy living-room sprite. */
export function HospitalScene({ s }: { s: GameState }) {
  const night = s.slot >= 4;
  return <g data-hospital>
    <rect width="1200" height="800" fill={night ? '#59615f' : '#c4ccc5'} />
    <rect y="460" width="1200" height="340" fill="#7d8d84" />
    <rect y="610" width="1200" height="190" fill="#a79d8c" />
    <path d="M0 610 H1200 M300 610 L100 800 M600 610 V800 M900 610 L1100 800" stroke="#716e65" strokeWidth="3" />
    <rect x="660" y="120" width="240" height="490" fill="#5b665e" />
    <rect x="680" y="140" width="200" height="450" fill="#a39c82" />
    <rect x="725" y="180" width="110" height="130" fill={night ? '#3a494d' : '#ccd7cd'} />
    <circle cx="850" cy="385" r="6" fill="#534e40" />
    <path d="M170 520 H530 V555 H170Z M195 555 V650 M500 555 V650" fill="#6c4d39" stroke="#453b31" strokeWidth="8" />
    <rect x="270" y="185" width="190" height="130" fill="#e4dcc4" stroke="#6f766d" strokeWidth="5" />
    <path d="M300 220 H430 M300 250 H410 M300 280 H425" stroke="#959b88" strokeWidth="7" />
    {onStage(s, 'hoda') && <g data-patient>
      <rect x="145" y="370" width="460" height="240" rx="15" fill="#ddd8c4" stroke="#68756f" strokeWidth="10" />
      <path d="M160 610 V685 M590 610 V685" stroke="#68756f" strokeWidth="12" />
      <g transform="translate(150 360)"><HodaInBed expr="sick" cover="#afbeb2" look={{ ...outfitOf(s), rash: true }} width={440} /></g>
    </g>}
    {onStage(s, 'doctor') && <g transform="translate(720 220)"><Doctor expr="sad" /></g>}
    {onStage(s, 'naima') && <g transform="translate(900 236)"><Naima expr="sad" pose="shy" /></g>}
    <rect x="0" y="0" width="1200" height="800" fill="url(#vignette)" />
  </g>;
}

/** The stair landing outside Fatma's door: worn steps, a bare bulb, the banister. */
export function LandingBackdrop() {
  return <g>
    <rect width="1200" height="800" fill="#c2a47d" />
    <path d="M0 0 H1200 V90 H0Z" fill="#b39168" opacity=".6" />
    <rect x="640" y="80" width="300" height="480" fill="#64452f" stroke="#4b3427" strokeWidth="15" />
    {[[660, 100], [800, 100], [660, 330], [800, 330]].map(([x, y], i) => <rect key={i} x={x} y={y} width="125" height="210" rx="4" fill="#7a5638" opacity=".6" />)}
    <circle cx="905" cy="330" r="7" fill="#c9a347" />
    <rect x="730" y="40" width="120" height="26" rx="3" fill="#e9dfc8" stroke="#6b4a2f" strokeWidth="2" />
    <text x="790" y="60" textAnchor="middle" fontFamily="'Noto Naskh Arabic', serif" fontSize="18" fill="#3a2a1e">٤</text>
    <line x1="460" y1="0" x2="460" y2="60" stroke="#222" strokeWidth="2" /><circle cx="460" cy="68" r="9" fill="#f0d79a" /><circle cx="460" cy="68" r="80" fill="url(#lampGlow)" opacity=".6" />
    <path d="M0 800 V700 H200 V650 H400 V600 H600 V550 H1200 V800Z" fill="#99836a" stroke="#6d5b49" strokeWidth="5" />
    <path d="M200 650 h200 M400 600 h200 M0 700 h200" stroke="#7d6a55" strokeWidth="6" opacity=".6" />
    <path d="M60 702 q30 -6 60 0 M250 652 q24 -5 48 0 M450 602 q30 -5 60 0" stroke="#b9a587" strokeWidth="4" fill="none" opacity=".7" />
    <path d="M0 585 L530 440 L530 575 M40 580 V685 M190 540 V640 M350 495 V600" stroke="#50453c" strokeWidth="12" fill="none" />
    <path d="M980 300 q20 -30 60 -20 l10 40 q-40 0 -70 -20z" fill="#9c8467" opacity=".45" />
  </g>;
}

export function LandingScene({ s, expr }: { s: GameState; expr: Expr }) {
  return <g data-landing>
    <LandingBackdrop />
    <Suitcase x={790} y={550} s={1.2} />
    <g transform="translate(800 310) scale(.95)"><Hoda pose="sit" expr={expr} outfit={{ dress: 'yellow', dust: true }} /></g>
    {s.flags.ball_stairs && <SockBall x={770} y={548} r={14} />}
    {onStage(s, 'naima') && <g transform="translate(420 230)"><Naima pose="handsHips" /></g>}
    <rect width="1200" height="800" fill="url(#vignette)" />
  </g>;
}

export function PaperScene({ s }: { s: GameState }) {
  return <g data-paper-scene>
    <rect width="1200" height="800" fill="#76563e" />
    <rect x="180" y="105" width="360" height="540" rx="6" fill="#e6d4af" transform="rotate(-6 360 370)" />
    <rect x="620" y="160" width="340" height="500" rx="6" fill="#f1e2c4" transform="rotate(5 790 410)" />
    {[0,1,2,3,4,5].map(i=><g key={i} stroke="#97836a" strokeWidth="7" opacity=".65"><path d={`M230 ${220+i*55} h235 M675 ${245+i*55} h210`} /></g>)}
    <path d="M220 230 L505 205" stroke="#514536" strokeWidth="6" />
    <path d="M1020 180 L990 570" stroke="#384d58" strokeWidth="18" />
    <rect width="1200" height="800" fill="url(#vignette)" />
  </g>;
}
