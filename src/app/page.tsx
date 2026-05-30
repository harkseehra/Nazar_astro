'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TopBar } from '@/components/chrome/TopBar';
import { MoonPhaseIndicator } from '@/components/chrome/MoonPhaseIndicator';
import { VoidIndicator } from '@/components/chrome/VoidIndicator';
import { RetrogradeList } from '@/components/chrome/RetrogradeList';
import { CompactView } from '@/components/views/CompactView';
import { WheelView } from '@/components/views/WheelView';
import { PlanetPanel } from '@/components/PlanetPanel';
import { SaveButton } from '@/components/SaveButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ViewMode } from '@/components/ViewToggle';
import type { PlanetName, TodayJson, ZodiacSign } from '@/types/astrology';

// Three.js scene must be client-only (no SSR)
const CosmosView = dynamic(
  () => import('@/components/views/CosmosView').then((m) => m.CosmosView),
  { ssr: false, loading: () => <div className="fixed inset-0 flex items-center justify-center text-white/20 text-sm">Loading 3D…</div> },
);

function isMobileScreen() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
}

function defaultViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'cosmos';
  const stored = localStorage.getItem('nazar.viewMode') as ViewMode | null;
  if (stored) return stored;
  return isMobileScreen() ? 'compact' : 'cosmos';
}

export default function HomePage() {
  const [today, setToday] = useState<TodayJson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cosmos');
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetName | null>(null);
  const [houses, setHouses] = useState<Partial<Record<PlanetName, number>>>({});
  const [ascendantSign, setAscendantSign] = useState<ZodiacSign | undefined>(undefined);
  const [locationLabel, setLocationLabel] = useState('');
  const [location, setLocation] = useState({ lat: 0, lon: 0, label: '' });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Initialise view mode after mount (localStorage access)
  useEffect(() => {
    setViewMode(defaultViewMode());
    setIsMobile(isMobileScreen());
  }, []);

  // Load today.json
  useEffect(() => {
    fetch('/api/today')
      .then((r) => r.json())
      .then((data: TodayJson) => {
        setToday(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Get user location → compute houses
  useEffect(() => {
    async function loadLocation() {
      try {
        const locRes = await fetch('/api/location');
        const loc = await locRes.json();
        setLocationLabel(loc.label ?? '');
        setLocation({ lat: loc.lat ?? 0, lon: loc.lon ?? 0, label: loc.label ?? '' });

        const houseRes = await fetch(`/api/houses?lat=${loc.lat}&lon=${loc.lon}`);
        const houseData = await houseRes.json();
        if (houseData.houses) setHouses(houseData.houses);
        if (houseData.ascendant?.sign) setAscendantSign(houseData.ascendant.sign);
      } catch {
        // Non-fatal — houses remain empty
      }
    }
    loadLocation();
  }, []);

  const handleViewChange = useCallback((v: ViewMode) => {
    setViewMode(v);
    localStorage.setItem('nazar.viewMode', v);
    setSelectedPlanet(null);
  }, []);

  const handleSelectPlanet = useCallback((p: PlanetName) => {
    setSelectedPlanet((prev) => (prev === p ? null : p));
  }, []);

  const handleClosePanel = useCallback(() => setSelectedPlanet(null), []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0A0E14' }}>
        <p className="text-white/20 text-sm tracking-widest">نظر</p>
      </div>
    );
  }

  if (!today) {
    return (
      <div className="fixed inset-0 flex items-center justify-center flex-col gap-3" style={{ background: '#0A0E14' }}>
        <p className="text-white/40">Chart unavailable.</p>
        <p className="text-white/20 text-sm">The daily snapshot hasn&apos;t been generated yet.</p>
        <p className="text-white/20 text-xs mt-2">
          Call <code className="text-[#2196D4]">/api/cron/generate-today</code> to generate it.
        </p>
      </div>
    );
  }

  const showPanel = selectedPlanet !== null && (viewMode !== 'compact' || !isMobile);

  return (
    <div className="relative w-full min-h-screen" style={{ background: '#0A0E14' }}>
      <TopBar viewMode={viewMode} onViewChange={handleViewChange} locationLabel={locationLabel} />

      {/* Main view — wrapped in error boundary so a Three.js crash doesn't kill the page */}
      <ErrorBoundary>
        {viewMode === 'cosmos' && (
          <CosmosView data={today} onSelectPlanet={handleSelectPlanet} selectedPlanet={selectedPlanet} />
        )}
        {viewMode === 'wheel' && (
          <div className="fixed inset-0 flex items-center justify-center pt-12">
            <WheelView
              data={today} houses={houses} ascendantSign={ascendantSign}
              onSelectPlanet={handleSelectPlanet} selectedPlanet={selectedPlanet}
            />
          </div>
        )}
        {viewMode === 'compact' && (
          <CompactView
            data={today} houses={houses}
            onSelectPlanet={handleSelectPlanet} selectedPlanet={selectedPlanet}
          />
        )}
      </ErrorBoundary>

      {/* Always-visible chrome overlay (top-right of canvas) */}
      {viewMode !== 'compact' && (
        <div className="fixed top-16 right-4 flex flex-col items-end gap-1.5 z-30">
          <MoonPhaseIndicator moonPhase={today.moonPhase} />
          <VoidIndicator voidOfCourse={today.voidOfCourse} />
          <RetrogradeList retrogrades={today.retrogrades} />
        </div>
      )}

      {/* Planet side panel */}
      {showPanel && (
        <PlanetPanel
          planet={selectedPlanet}
          data={today}
          houses={houses}
          onClose={handleClosePanel}
          isMobile={isMobile}
        />
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-2 text-xs text-white/20"
        style={{ background: 'linear-gradient(to top, #0A0E14dd, transparent)' }}>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-white/50 transition-colors">about</Link>
          <Link href="/method" className="hover:text-white/50 transition-colors">method</Link>
          <Link href="/saved" className="hover:text-white/50 transition-colors">saved</Link>
        </div>
        <SaveButton today={today} houses={houses} ascendantSign={ascendantSign} location={location} />
      </footer>
    </div>
  );
}
