import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { getNode, resolveLine, visibleOptions, advance, choose, moodExpr } from '../../engine/core';
import type { ActivityNode, BallParams, BedParams, ButtonsParams, DressParams, KitchenParams } from '../../engine/types';
import { BallGame } from '../activities/BallGame';
import { ButtonTin } from '../activities/ButtonTin';
import { Wardrobe } from '../activities/Wardrobe';
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
import { outfitOf } from '../../art/scenes';
import { setLoop, stopLongSfx } from '../../audio/engine';
import { ambienceFor } from '../../audio/sceneAudio';
import { RadioPlayer } from '../RadioPlayer';
import { useRadio } from '../../radio/player';
import { aired, loadRegistry } from '../../radio/registry';
import { gameDate } from '../../engine/calendar';
import { costBadge } from '../../util/ar';

export function GameScreen() {
  const s = useGame((g) => g.state)!;
  const icFn = useGame((g) => g.ic);
  const act = useGame((g) => g.act);
  const menuOpen = useGame((g) => g.menuOpen);
  const setMenu = useGame((g) => g.setMenu);
  const ic = icFn();
  const node = getNode(ic, s.node);
  const next = useCallback(() => act((i, st) => advance(i, st)), [act]);

  // Music follows the story (content sets it); ambience follows the place and the hour.
  useEffect(() => { setLoop('music', s.music ?? null); }, [s.music]);
  const amb = ambienceFor(s);
  useEffect(() => { setLoop('ambience', amb); }, [amb]);
  useEffect(() => { stopLongSfx(0.5); }, [s.scene, s.day]);

  // Radio: a node can tune in (broadcast id) or switch off (null). Leaving the scene switches it off.
  const date = gameDate(CHAPTERS[s.chapter], s.day);
  const tune = useRadio((r) => r.tune);
  const stopRadioUi = useRadio((r) => r.stop);
  const [, setRegReady] = useState(0);
  useEffect(() => { void loadRegistry().then(() => setRegReady((n) => n + 1)); }, []);
  useEffect(() => {
    if (node.broadcast === null) stopRadioUi();
    else if (typeof node.broadcast === 'string') tune(node.broadcast, date);
  }, [node.id]);
  useEffect(() => () => stopRadioUi(), [s.scene, stopRadioUi]);
  const isAired = (b: string) => aired(b, date);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(!useGame.getState().menuOpen); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setMenu]);

  let panel: React.ReactNode = null;
  if (node.type === 'line') {
    const r = resolveLine(node, s);
    panel = <DialogueBox nodeId={node.id} lead={node.lead} speaker={r.speaker} text={r.text} expr={r.expr ?? moodExpr(s.vars)} onNext={next} outfit={outfitOf(s)} />;
  } else if (node.type === 'choice') {
    const opts = visibleOptions(node, s, isAired);
    panel = (
      <ChoiceList nodeId={node.id} prompt={node.prompt} context={s.lastLine} items={opts.map((o, i) => ({ key: node.id + i, text: o.text, badge: costBadge(o.effects) }))}
        onPick={(i) => act((icx, st) => { const o = visibleOptions(getNode(icx, st.node), st, isAired)[i]; return o ? choose(icx, st, o) : st; })} />
    );
  } else if (node.type === 'hub') {
    panel = <HubPanel node={node} s={s} />;
  } else if (node.type === 'activity') {
    const a = node as ActivityNode;
    panel = a.activity === 'kitchen' ? <Kitchen key={a.id} p={a.params as KitchenParams} s={s} /> : <Bed key={a.id} p={a.params as BedParams} />;
  }
  // Shared rituals own the stage: they are played on it, not read under it.
  let ritual: React.ReactNode = null;
  if (node.type === 'activity' && ['ball', 'buttons', 'dress'].includes(node.activity)) {
    const a = node as ActivityNode;
    ritual = a.activity === 'ball' ? <BallGame key={a.id + s.day} p={a.params as BallParams} s={s} />
      : a.activity === 'buttons' ? <ButtonTin key={a.id + s.day} p={a.params as ButtonsParams} s={s} />
      : <Wardrobe key={a.id + s.day} p={a.params as DressParams} s={s} />;
  }

  return (
    <div className="h-full flex flex-col items-center sm:py-4" data-screen="game" data-node-id={s.node} data-node-type={node.type}>
      <div className="stage-col flex flex-col gap-3 flex-1 min-h-0">
        {ritual ?? (
          <>
            <Stage ic={ic} s={s}>
              <Hud s={s} chapter={CHAPTERS[s.chapter]} />
              <RadioPlayer gameDate={date} />
            </Stage>
            <div className="px-2 sm:px-0 pb-4 flex-1 min-h-0 overflow-y-auto scroll-soft" key={node.type === 'line' ? 'line' : node.id} data-panel>{panel}</div>
          </>
        )}
      </div>
      {node.type === 'card' && <CardScreen nodeId={node.id} title={node.title} subtitle={node.subtitle} onNext={next} />}
      {node.type === 'end' && <EndScreen node={node} s={s} />}
      {menuOpen && <PauseMenu />}
    </div>
  );
}
