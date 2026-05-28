import type { TodayJson } from '@/types/astrology';

interface Props {
  voidOfCourse: TodayJson['voidOfCourse'];
}

export function VoidIndicator({ voidOfCourse }: Props) {
  if (!voidOfCourse.isVoidNow) return null;

  const until = voidOfCourse.nextVoidEnd
    ? new Date(voidOfCourse.nextVoidEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-amber-400/80">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span>Moon void</span>
      {until && <span className="text-amber-400/50 text-xs">until {until}</span>}
    </div>
  );
}
