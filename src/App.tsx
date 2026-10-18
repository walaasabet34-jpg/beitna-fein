import { useEffect } from 'react';
import { unlock } from './audio/engine';
import { useGame } from './store/gameStore';
import { TitleScreen } from './ui/screens/TitleScreen';
import { GameScreen } from './ui/screens/GameScreen';

export default function App() {
  const screen = useGame((g) => g.screen);
  const hasState = useGame((g) => !!g.state);
  const rm = useGame((g) => g.settings.reducedMotion);
  // Audio may only start inside a user gesture (Chrome, Safari, iOS autoplay rules).
  useEffect(() => {
    const go = () => unlock();
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
    window.addEventListener('touchend', go, true);
    return () => { window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true); window.removeEventListener('touchend', go, true); };
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('rm', rm === true);
    el.classList.toggle('rm-off', rm === false);
  }, [rm]);
  return screen === 'game' && hasState ? <GameScreen /> : <TitleScreen />;
}
