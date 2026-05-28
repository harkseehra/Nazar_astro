import { MOON_PHASE_ICONS, MOON_PHASE_LABELS } from '@/lib/theme';
import type { TodayJson } from '@/types/astrology';

interface Props {
  moonPhase: TodayJson['moonPhase'];
}

export function MoonPhaseIndicator({ moonPhase }: Props) {
  const icon = MOON_PHASE_ICONS[moonPhase.phaseName] ?? '🌑';
  const label = MOON_PHASE_LABELS[moonPhase.phaseName] ?? moonPhase.phaseName;
  const pct = Math.round(moonPhase.illumination * 100);

  return (
    <div className="flex items-center gap-1.5 text-sm text-white/70">
      <span className="text-base">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="text-white/40 text-xs">{pct}%</span>
    </div>
  );
}
