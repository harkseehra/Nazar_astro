import { PLANET_LABELS } from '@/lib/theme';
import type { PlanetName } from '@/types/astrology';

interface Props {
  retrogrades: PlanetName[];
}

export function RetrogradeList({ retrogrades }: Props) {
  if (retrogrades.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-white/60">
      <span className="font-bold text-white/40">℞</span>
      <span>{retrogrades.map((p) => PLANET_LABELS[p]).join(', ')}</span>
    </div>
  );
}
