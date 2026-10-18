// Radio asset registry. The live copy is public/radio/registry.json, fetched at runtime so cleared
// archival recordings can be swapped in by editing JSON only. A bundled copy is the offline fallback.
import fallback from './registry.default.json';

export type Authenticity = 'authentic-archival' | 'unverified-archival' | 'modern-recreation' | 'placeholder';
export interface Cue { t: number; text: string }
export interface RadioSource {
  id: string; type: 'archival' | 'recreation' | 'placeholder'; title: string; sourceUrl: string | null;
  historicalDate: string | null; authenticity: Authenticity;
  license: { status: 'pending' | 'cleared' | 'rejected'; label: string; holder: string | null; terms: string | null; verifiedBy: string | null; verifiedOn: string | null };
  attribution: string | null; file: string | null; transcript: Cue[];
}
export interface Broadcast { title: string; kind: string; airDate: string; window: 'same-day' | 'any-after'; sources: RadioSource[] }
export interface Registry { version: number; broadcasts: Record<string, Broadcast> }

let registry: Registry = fallback as Registry;
let loaded: Promise<Registry> | null = null;
const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

export function loadRegistry(): Promise<Registry> {
  if (!loaded) {
    loaded = fetch(base + 'radio/registry.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Registry) => { if (j && j.broadcasts) registry = j; return registry; })
      .catch(() => registry);
  }
  return loaded;
}
export const getRegistry = () => registry;

/** Has this broadcast aired by the given in-game date (ISO yyyy-mm-dd)? Never true before airDate. */
export function aired(id: string, gameDate: string | null, reg: Registry = registry): boolean {
  const b = reg.broadcasts[id];
  if (!b || !gameDate) return false;
  return b.window === 'same-day' ? gameDate === b.airDate : gameDate >= b.airDate;
}

/** The source the game will actually play: first one with cleared rights AND a file. */
export function playableSource(id: string, reg: Registry = registry): RadioSource | null {
  const b = reg.broadcasts[id];
  return b?.sources.find((s) => s.license.status === 'cleared' && !!s.file) ?? null;
}
/** Archival sources still waiting for clearance (shown to the player as a note, never played). */
export function pendingArchival(id: string, reg: Registry = registry): RadioSource[] {
  return reg.broadcasts[id]?.sources.filter((s) => s.type === 'archival' && s.license.status !== 'cleared') ?? [];
}

export const AUTH_LABEL: Record<Authenticity, string> = {
  'authentic-archival': 'تسجيل أصلي من الأرشيف',
  'unverified-archival': 'تسجيل أرشيفي (لسه ماتأكدش)',
  'modern-recreation': 'إعادة تمثيل حديثة',
  placeholder: 'صوت مؤقت',
};
