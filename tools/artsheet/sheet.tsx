// Renders a contact sheet of every pose and expression to SVG (visual review of the character rig).
// Usage: npx vite-node tools/artsheet/sheet.tsx > sheet.svg
import { renderToStaticMarkup } from 'react-dom/server';
import { Hoda } from '../../src/art/Hoda';
import { POSES } from '../../src/art/figure';
import type { Expr } from '../../src/engine/types';
import { ArtDefs } from '../../src/art/scenes';
import { Cast } from '../../src/art/people';

const exprs: Expr[] = ['neutral', 'guarded', 'sad', 'worried', 'smile', 'laugh', 'surprised', 'upset', 'sleepy', 'focused', 'bored', 'tired', 'proud', 'sick'];
const poses = Object.keys(POSES);
const cell = 170;
const el = (
  <svg xmlns="http://www.w3.org/2000/svg" width={cell * 8} height={cell * 2 * 3 + 520 + 340} viewBox={`0 0 ${cell * 8} ${cell * 2 * 3 + 520 + 340}`} style={{ background: '#e9d9bb' }}>
    <style>{'.blink{transform:scaleY(0);transform-box:fill-box;transform-origin:50% 50%}'}</style>
    <ArtDefs />
    {exprs.map((e, i) => (
      <g key={e} transform={`translate(${(i % 7) * cell * 1.14 - 40} ${Math.floor(i / 7) * 200 + 20}) scale(1.9)`}>
        <Hoda expr={e} pose="stand" animate={false} outfit={i % 2 ? { dress: 'navy', cardigan: i === 11, ribbon: 'red' } : { dress: 'yellow', dust: i === 0, patch: i === 4 ? 'flower' : undefined, rash: e === 'sick' }} />
        <text x="80" y="104" fontSize="8" textAnchor="middle">{e}</text>
      </g>
    ))}
    {poses.map((p, i) => (
      <g key={p} transform={`translate(${(i % 8) * cell} ${420 + Math.floor(i / 8) * 330})`}>
        <Hoda expr="smile" pose={p as never} animate={false} outfit={{ dress: 'yellow', tear: true }} />
        <text x="80" y="320" fontSize="14" textAnchor="middle">{p}</text>
      </g>
    ))}
    <g transform={`translate(0 ${420 + 3 * 330})`}><Cast /></g>
  </svg>
);
process.stdout.write(renderToStaticMarkup(el));
