import { useEffect } from 'react';
import { useGame } from './store/gameStore';
import { TitleScreen } from './ui/screens/TitleScreen';
import { GameScreen } from './ui/screens/GameScreen';

export default function App() {
  const screen = useGame((g) => g.screen);
  const hasState = useGame((g) => !!g.state);
  const rm = useGame((g) => g.settings.reducedMotion);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('rm', rm === true);
    el.classList.toggle('rm-off', rm === false);
  }, [rm]);
  return screen === 'game' && hasState ? <GameScreen /> : <TitleScreen />;
}
