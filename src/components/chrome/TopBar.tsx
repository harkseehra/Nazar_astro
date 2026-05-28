'use client';
import Link from 'next/link';
import { ViewToggle } from '@/components/ViewToggle';
import type { ViewMode } from '@/components/ViewToggle';

interface Props {
  viewMode: ViewMode;
  onViewChange: (v: ViewMode) => void;
  locationLabel: string;
}

export function TopBar({ viewMode, onViewChange, locationLabel }: Props) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3"
      style={{ background: 'linear-gradient(to bottom, #0A0E14ee, transparent)' }}>
      <Link href="/" className="text-xl font-bold tracking-tight text-white select-none"
        style={{ fontFamily: 'Gentium Plus, Georgia, serif', letterSpacing: '0.04em' }}>
        نظر
      </Link>

      <div className="flex flex-col items-center">
        <span className="text-xs text-white/70 hidden sm:block">{today}</span>
        {locationLabel && (
          <span className="text-[10px] text-white/40 hidden sm:block">{locationLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ViewToggle value={viewMode} onChange={onViewChange} />
        <Link href="/method" className="text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:block">
          method
        </Link>
      </div>
    </header>
  );
}
