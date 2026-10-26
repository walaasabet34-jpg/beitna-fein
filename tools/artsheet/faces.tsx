// Close-up sheet of Hoda's expressions (visual review). Usage: npx vite-node tools/artsheet/faces.tsx > faces.svg
import { renderToStaticMarkup } from 'react-dom/server';
import { Hoda } from '../../src/art/Hoda';
import type { Expr } from '../../src/engine/types';
const exprs: Expr[] = ['neutral', 'guarded', 'sad', 'worried', 'smile', 'laugh', 'surprised', 'upset', 'sleepy', 'focused', 'bored', 'tired', 'proud', 'sick'];
process.stdout.write(renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="640" viewBox="0 0 1400 640" style={{ background: '#e9d9bb' }}>
    <style>{'.blink{transform:scaleY(0);transform-box:fill-box;transform-origin:50% 50%}'}</style>
    {exprs.map((e, i) => (
      <g key={e} transform={`translate(${(i % 7) * 200 - 220} ${Math.floor(i / 7) * 320 - 20}) scale(4)`}>
        <Hoda expr={e} pose="stand" animate={false} outfit={{ dress: 'yellow', rash: e === 'sick' }} />
        <text x="80" y="76" fontSize="5" textAnchor="middle">{e}</text>
      </g>
    ))}
  </svg>));
