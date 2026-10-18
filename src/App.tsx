import { useEffect } from 'react';
import { unlock } from './audio/engine';
import { LOCAL_ARCHIVE } from './radio/registry';
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
  useEffect(() => { document.documentElement.classList.toggle('local-archive', LOCAL_ARCHIVE); }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('rm', rm === true);
    el.classList.toggle('rm-off', rm === false);
  }, [rm]);
  return (
    <>
      {LOCAL_ARCHIVE && (
        <div className="fixed top-0 inset-x-0 z-50 bg-[#a33] text-white text-center text-xs py-1 px-3" role="status" data-local-archive>
          نسخة محلية تجريبية: فيها تسجيلات أرشيفية حقوقها مش مؤكدة. للاستماع على جهازك بس، ماتتنشرش.
        </div>
      )}
      {screen === 'game' && hasState ? <GameScreen /> : <TitleScreen />}
    </>
  );
}
