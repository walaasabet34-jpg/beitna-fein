// Radio asset registry. The live copy is public/radio/registry.json, fetched at runtime so cleared
// archival recordings can be swapped in by editing JSON only. A bundled copy is the offline fallback.
import fallback from './registry.default.json';

export type Authenticity = 'authentic-archival' | 'unverified-archival' | 'modern-recreation' | 'placeholder';
export interface Cue { t: number; text: string }
export interface RadioSource {
  id: string; type: 'archival' | 'recreation' | 'placeholder'; title: string; sourceUrl: string | null;
  historicalDate: string | null; authenticity: Authenticity;
  license: { status: 'pending' | 'cleared' | 'rejected' | 'local-only'; label: string; holder: string | null; terms: string | null; verifiedBy: string | null; verifiedOn: string | null };
  attribution: string | null; file: string | null; transcript: Cue[];
}
export interface Broadcast { title: string; kind: string; airDate: string; window: 'same-day' | 'any-after'; sources: RadioSource[] }
export interface Registry { version: number; broadcasts: Record<string, Broadcast> }

let registry: Registry = fallback as Registry;
let loaded: Promise<Registry> | null = null;
const env = (import.meta as { env?: { BASE_URL?: string; VITE_LOCAL_ARCHIVE?: string } }).env ?? {};
const base = env.BASE_URL ?? '/';
/** True only in the local experimental build (`npm run dev:archive`). Never true on Vercel. */
export const LOCAL_ARCHIVE = env.VITE_LOCAL_ARCHIVE === '1';

type Overlay = { broadcasts: Record<string, Partial<Broadcast> & { sources: RadioSource[] }> };
/** Local overlay sources go in front of public ones; only 'local-only' or 'cleared' sources are accepted. */
export function mergeOverlay(pub: Registry, ov: Overlay): Registry {
  const out: Registry = { ...pub, broadcasts: { ...pub.broadcasts } };
  for (const [id, b] of Object.entries(ov.broadcasts ?? {})) {
    const srcs = (b.sources ?? []).filter((s) => s.license?.status === 'local-only' || s.license?.status === 'cleared');
    const existing = out.broadcasts[id];
    if (existing) out.broadcasts[id] = { ...existing, sources: [...srcs, ...existing.sources] };
    else if (b.airDate && b.window && b.title && b.kind) out.broadcasts[id] = { title: b.title, kind: b.kind, airDate: b.airDate, window: b.window, sources: srcs };
  }
  return out;
}

export function loadRegistry(): Promise<Registry> {
  if (!loaded) {
    loaded = fetch(base + 'radio/registry.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Registry) => { if (j && j.broadcasts) registry = j; return registry; })
      .catch(() => registry)
      .then(async (reg) => {
        if (!LOCAL_ARCHIVE) return reg;
        try {
          const r = await fetch(base + 'local-archive/registry.local.json', { cache: 'no-cache' });
          if (r.ok) registry = mergeOverlay(reg, await r.json());
        } catch { /* no local overlay */ }
        return registry;
      });
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
export function playableSource(id: string, reg: Registry = registry, local = LOCAL_ARCHIVE): RadioSource | null {
  const b = reg.broadcasts[id];
  return b?.sources.find((s) => !!s.file && (s.license.status === 'cleared' || (local && s.license.status === 'local-only'))) ?? null;
}
/** Archival sources still waiting for clearance (shown to the player as a note, never played). */
export function pendingArchival(id: string, reg: Registry = registry): RadioSource[] {
  return reg.broadcasts[id]?.sources.filter((s) => s.type === 'archival' && s.license.status === 'pending') ?? [];
}

export const AUTH_LABEL: Record<Authenticity, string> = {
  'authentic-archival': 'تسجيل أصلي من الأرشيف',
  'unverified-archival': 'تسجيل أرشيفي (لسه ماتأكدش)',
  'modern-recreation': 'إعادة تمثيل حديثة',
  placeholder: 'صوت مؤقت',
};

