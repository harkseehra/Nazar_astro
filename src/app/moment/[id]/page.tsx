'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { loadMoment, type SavedMoment } from '@/lib/savedMoments';
import { CompactView } from '@/components/views/CompactView';
import { WheelView } from '@/components/views/WheelView';
import { PlanetPanel } from '@/components/PlanetPanel';
import { MoonPhaseIndicator } from '@/components/chrome/MoonPhaseIndicator';
import { RetrogradeList } from '@/components/chrome/RetrogradeList';
import type { PlanetName, ZodiacSign } from '@/types/astrology';

type ViewMode = 'wheel' | 'compact';

export default function MomentPage() {
  const { id } = useParams<{ id: string }>();
  const [moment, setMoment] = useState<SavedMoment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetName | null>(null);

  useEffect(() => {
    const m = loadMoment(id);
    if (m) setMoment(m);
    else setNotFound(true);
  }, [id]);

  if (notFound) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#0A0E14' }}>
        <p className="text-white/40 text-sm">Moment not found.</p>
        <Link href="/saved" className="text-xs text-[#2196D4]">← saved moments</Link>
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0A0E14' }}>
        <p className="text-white/20 text-sm">Loading…</p>
      </div>
    );
  }

  const chartDate = new Date(moment.chartDate);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  return (
    <div className="min-h-screen" style={{ background: '#0A0E14' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3"
        style={{ background: 'linear-gradient(to bottom, #0A0E14ee, transparent)' }}>
        <div>
          <Link href="/saved" className="text-xs text-[#2196D4] hover:text-white transition-colors">
            ← saved
          </Link>
          <p className="text-white/70 text-sm mt-0.5">
            {chartDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {moment.location.label && (
            <p className="text-white/30 text-xs">{moment.location.label}</p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-full p-0.5"
          style={{ background: '#ffffff0d', border: '1px solid #ffffff12' }}>
          {(['compact', 'wheel'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setViewMode(v)}
              className="px-3 py-1 text-xs rounded-full transition-all capitalize"
              style={{
                background: viewMode === v ? '#2196D4' : 'transparent',
                color: viewMode === v ? '#fff' : '#ffffff60',
              }}>
              {v === 'compact' ? 'List' : 'Wheel'}
            </button>
          ))}
        </div>
      </header>

      {/* Chrome overlays */}
      {viewMode === 'wheel' && (
        <div className="fixed top-20 right-4 flex flex-col items-end gap-1.5 z-30">
          <MoonPhaseIndicator moonPhase={moment.snapshot.moonPhase} />
          <RetrogradeList retrogrades={moment.snapshot.retrogrades} />
        </div>
      )}

      {/* Note */}
      {moment.note && (
        <div className="fixed bottom-12 left-0 right-0 flex justify-center z-30 px-4 pointer-events-none">
          <p className="text-white/30 text-sm italic max-w-sm text-center"
            style={{ fontFamily: 'Gentium Plus, Georgia, serif' }}>
            &ldquo;{moment.note}&rdquo;
          </p>
        </div>
      )}

      {/* Views */}
      {viewMode === 'compact' && (
        <CompactView
          data={moment.snapshot}
          houses={moment.houses}
          onSelectPlanet={setSelectedPlanet}
          selectedPlanet={selectedPlanet}
        />
      )}

      {viewMode === 'wheel' && (
        <div className="fixed inset-0 flex items-center justify-center pt-12">
          <WheelView
            data={moment.snapshot}
            houses={moment.houses}
            ascendantSign={moment.ascendantSign as ZodiacSign | undefined}
            onSelectPlanet={setSelectedPlanet}
            selectedPlanet={selectedPlanet}
          />
        </div>
      )}

      {/* Planet panel */}
      {selectedPlanet && (
        <PlanetPanel
          planet={selectedPlanet}
          data={moment.snapshot}
          houses={moment.houses}
          onClose={() => setSelectedPlanet(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
