import type { TodayJson, PlanetName, ZodiacSign } from '@/types/astrology';

export interface SavedMoment {
  id: string;
  savedAt: string;
  chartDate: string;
  location: { lat: number; lon: number; label: string };
  note?: string;
  snapshot: TodayJson;
  houses: Partial<Record<PlanetName, number>>;
  ascendantSign?: ZodiacSign;
}

const KEY = 'nazar.savedMoments';

export function loadSavedMoments(): SavedMoment[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveMoment(moment: Omit<SavedMoment, 'id' | 'savedAt'>): SavedMoment {
  const saved: SavedMoment = {
    ...moment,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
  };
  const all = loadSavedMoments();
  all.unshift(saved);
  localStorage.setItem(KEY, JSON.stringify(all));
  return saved;
}

export function loadMoment(id: string): SavedMoment | null {
  return loadSavedMoments().find((m) => m.id === id) ?? null;
}

export function deleteMoment(id: string): void {
  const all = loadSavedMoments().filter((m) => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
