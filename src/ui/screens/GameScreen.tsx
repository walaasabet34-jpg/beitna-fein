import { useCallback, useEffect } from 'react';
import { useGame } from '../../store/gameStore';
import { getNode, resolveLine, visibleOptions, advance, choose, moodExpr } from '../../engine/core';
import type { ActivityNode, BedParams, KitchenParams } from '../../engine/types';
import { Stage } from '../scene/Stage';
import { Hud } from '../hud/Hud';
import { DialogueBox } from '../dialogue/DialogueBox';
import { ChoiceList } from '../dialogue/ChoiceList';
import { HubPanel } from '../HubPanel';
import { Kitchen } from '../activities/Kitchen';
import { Bed } from '../activities/Bed';
import { CardScreen } from './CardScreen';
import { EndScreen } from './EndScreen';
import { PauseMenu } from './PauseMenu';
import { CHAPTERS } from '../../content';

export function GameScreen() {
  const s = useGame((g) => g.state)!;
  const icFn = useGame((g) => g.ic);
  const act = useGame((g) => g.act);
  const menuOpen = useGame((g) => g.menuOpen);
  const setMenu = useGame((g) => g.setMenu);
  const ic = icFn();
  const node = getNode(ic, s.node);
  const next = useCallback(() => act((i, st) => advance(i, st)), [act]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(!useGame.getState().menuOpen); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setMenu]);

  let panel: React.ReactNode = null;
  if (node.type === 'line') {
    const r = resolveLine(node, s);
    panel = <DialogueBox nodeId={node.id} speaker={r.speaker} text={r.text} expr={r.expr ?? moodExpr(s.vars)} onNext={next} />;
  } else if (node.type === 'choice') {
    const opts = visibleOptions(node, s);
    panel = (
      <ChoiceList nodeId={node.id} prompt={node.prompt} context={s.lastLine} items={opts.map((o, i) => ({ key: node.id + i, text: o.text }))}
        onPick={(i) => act((icx, st) => { const o = visibleOptions(getNode(icx, st.node), st)[i]; return o ? choose(icx, st, o) : st; })} />
    );
  } else if (node.type === 'hub') {
    panel = <HubPanel node={node} s={s} />;
  } else if (node.type === 'activity') {
    const a = node as ActivityNode;
    panel = a.activity === 'kitchen' ? <Kitchen key={a.id} p={a.params as KitchenParams} s={s} /> : <Bed key={a.id} p={a.params as BedParams} />;
  }

  return (
    <div className="h-full flex flex-col items-center sm:py-4" data-screen="game" data-node-id={s.node} data-node-type={node.type}>
      <div className="stage-col flex flex-col gap-3 flex-1 min-h-0">
        <Stage ic={ic} s={s}>
          <Hud s={s} chapter={CHAPTERS[s.chapter]} />
        </Stage>
        <div className="px-2 sm:px-0 pb-4 flex-1 min-h-0 overflow-y-auto scroll-soft" key={node.type === 'line' ? 'line' : node.id} data-panel>{panel}</div>
      </div>
      {node.type === 'card' && <CardScreen nodeId={node.id} title={node.title} subtitle={node.subtitle} onNext={next} />}
      {node.type === 'end' && <EndScreen node={node} s={s} />}
      {menuOpen && <PauseMenu />}
    </div>
  );
}
