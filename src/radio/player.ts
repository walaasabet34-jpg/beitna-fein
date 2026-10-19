import { create } from 'zustand';
import { aired, playableSource, getRegistry, loadRegistry, type RadioSource } from './registry';
import { playRadio, stopRadio, unlock } from '../audio/engine';

type Status = 'idle' | 'loading' | 'playing' | 'unavailable';
interface RadioStore {
  broadcast: string | null;
  source: RadioSource | null;
  status: Status;
  tune: (id: string, gameDate: string | null) => void;
  stop: () => void;
}

/** Tunes the in-game radio. Refuses broadcasts that haven't aired by the in-game date. */
export const useRadio = create<RadioStore>((set, get) => ({
  broadcast: null, source: null, status: 'idle',
  tune: (id, gameDate) => {
    if (get().broadcast === id && get().status !== 'idle') return;
    unlock();                                   // inside the user gesture
    set({ broadcast: id, source: null, status: 'loading' });
    // wait for the registry (and, in the local build, the local-archive overlay) before choosing a source
    void loadRegistry().then(() => { if (get().broadcast === id) startTune(id, gameDate); });
  },
  stop: () => { stopRadio(0.6); set({ broadcast: null, source: null, status: 'idle' }); },
}));

function startTune(id: string, gameDate: string | null) {
  const set = useRadio.setState, get = useRadio.getState;
  {
    if (!aired(id, gameDate)) { stopRadio(0.3); set({ broadcast: null, source: null, status: 'idle' }); return; }
    const src = playableSource(id);
    if (!src?.file) { stopRadio(0.3); set({ broadcast: id, source: null, status: 'unavailable' }); return; }
    unlock();
    set({ broadcast: id, source: src, status: 'loading' });
    void playRadio(src.file).then((ok) => { if (get().broadcast === id) set({ status: ok ? 'playing' : 'unavailable' }); });
  }
}

export const broadcastTitle = (id: string) => getRegistry().broadcasts[id]?.title ?? '';
