'use client';
import { PLANET_COLORS, PLANET_GLYPHS, PLANET_LABELS, SIGN_GLYPHS } from '@/lib/theme';
import { getDignity, getDignityLabel } from '@/lib/dignities';
import type { PlanetName, TodayJson } from '@/types/astrology';

const PLANETS: PlanetName[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

interface Props {
  data: TodayJson;
  houses: Partial<Record<PlanetName, number>>;
  onSelectPlanet: (p: PlanetName) => void;
  selectedPlanet: PlanetName | null;
}

export function CompactView({ data, houses, onSelectPlanet, selectedPlanet }: Props) {
  return (
    <div className="px-4 pt-20 pb-24 max-w-lg mx-auto">
      {/* Overall interpretation */}
      {data.interpretations.overall && (
        <div className="mb-6 px-4 py-4 rounded-xl text-sm leading-relaxed text-white/70"
          style={{ background: '#ffffff05', border: '1px solid #ffffff0a' }}>
          <p style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '1rem' }}>
            {data.interpretations.overall}
          </p>
        </div>
      )}

      {/* Planet cards */}
      <div className="space-y-2">
        {PLANETS.map((planet) => {
          const pd = data.planets[planet];
          const isSelected = selectedPlanet === planet;
          const house = houses[planet];
          const dignity = getDignity(planet, pd.sign);
          const dignityLabel = getDignityLabel(dignity);
          const color = PLANET_COLORS[planet];
          const signGlyph = SIGN_GLYPHS[pd.sign] ?? '';
          const signLabel = pd.sign.charAt(0).toUpperCase() + pd.sign.slice(1);
          const interp = data.interpretations[planet];

          return (
            <div key={planet}>
              <button
                onClick={() => onSelectPlanet(planet)}
                className="w-full text-left rounded-xl px-4 py-3.5 transition-all"
                style={{
                  background: isSelected ? `${color}18` : '#ffffff06',
                  border: `1px solid ${isSelected ? color + '40' : '#ffffff0a'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl" style={{ color }}>{PLANET_GLYPHS[planet]}</span>
                    <div>
                      <span className="font-medium text-white">{PLANET_LABELS[planet]}</span>
                      <span className="ml-2 text-sm text-white/50">
                        {signGlyph} {signLabel} {pd.signDegree.toFixed(0)}°
                        {house ? ` · H${house}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {pd.isRetrograde && (
                      <span className="text-xs text-amber-400/80 mr-2">℞</span>
                    )}
                    <span className="text-xs text-white/30 capitalize">{dignityLabel}</span>
                  </div>
                </div>

                {/* Expanded interpretation */}
                {isSelected && interp && (
                  <p className="mt-3 text-sm leading-relaxed text-white/65 border-t border-white/5 pt-3"
                    style={{ fontFamily: 'Gentium Plus, Georgia, serif' }}>
                    {interp}
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Top aspect */}
      {data.interpretations.topAspect && (
        <div className="mt-6 px-4 py-4 rounded-xl text-sm leading-relaxed"
          style={{ background: '#2196D408', border: '1px solid #2196D420' }}>
          <h3 className="text-xs uppercase tracking-widest text-[#2196D4] mb-2">Today&apos;s aspect</h3>
          <p style={{ fontFamily: 'Gentium Plus, Georgia, serif', color: '#C8D4DC' }}>
            {data.interpretations.topAspect}
          </p>
        </div>
      )}
    </div>
  );
}
