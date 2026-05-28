'use client';
import { PLANET_COLORS, PLANET_GLYPHS, PLANET_LABELS, SIGN_GLYPHS } from '@/lib/theme';
import { getDignity, getDignityLabel } from '@/lib/dignities';
import type { PlanetName, TodayJson } from '@/types/astrology';

interface Props {
  planet: PlanetName | null;
  data: TodayJson | null;
  houses: Partial<Record<PlanetName, number>>;
  onClose: () => void;
  isMobile: boolean;
}

const ASPECT_LABELS: Record<string, string> = {
  conjunction: 'conjunct', sextile: 'sextile', square: 'square',
  trine: 'trine', opposition: 'opposite',
};

const ASPECT_NATURE: Record<string, string> = {
  conjunction: 'blending',
  sextile: 'ease',
  trine: 'ease',
  square: 'tension',
  opposition: 'tension',
};

export function PlanetPanel({ planet, data, houses, onClose, isMobile }: Props) {
  if (!planet || !data) return null;

  const pd = data.planets[planet];
  const house = houses[planet];
  const dignity = getDignity(planet, pd.sign);
  const dignityLabel = getDignityLabel(dignity);
  const color = PLANET_COLORS[planet];
  const glyph = PLANET_GLYPHS[planet];
  const signGlyph = SIGN_GLYPHS[pd.sign] ?? '';
  const signLabel = pd.sign.charAt(0).toUpperCase() + pd.sign.slice(1);
  const interpretation = data.interpretations[planet] ?? '';

  const relevantAspects = data.aspects.filter(
    (a) => a.from === planet || a.to === planet,
  );

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', inset: 0, zIndex: 50,
        background: '#0D1219',
        overflowY: 'auto',
        padding: '80px 20px 40px',
      }
    : {
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', zIndex: 50,
        background: '#0D1219',
        borderLeft: '1px solid #ffffff0d',
        overflowY: 'auto',
        padding: '80px 28px 40px',
        transform: 'translateX(0)',
      };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: isMobile ? '#0A0E14cc' : 'transparent' }}
      />

      <aside style={panelStyle}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white/80 text-xl"
          aria-label="Close"
        >
          ×
        </button>

        {/* Planet header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-4xl" style={{ color }}>{glyph}</span>
          <div>
            <h2 className="text-2xl font-semibold text-white">{PLANET_LABELS[planet]}</h2>
            <p className="text-sm" style={{ color: '#8A9099' }}>
              {signGlyph} {signLabel} · {pd.signDegree.toFixed(1)}°
              {house ? ` · House ${house}` : ''}
              {pd.isRetrograde ? ' · ℞' : ''}
            </p>
          </div>
        </div>

        {/* Dignity */}
        <div className="mb-5 px-3 py-2 rounded-lg text-sm" style={{ background: '#ffffff06', borderLeft: `2px solid ${color}` }}>
          <span style={{ color }} className="font-medium capitalize">{dignityLabel}</span>
        </div>

        {/* Interpretation */}
        {interpretation && (
          <p className="leading-relaxed mb-6 text-white/80" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '1.05rem' }}>
            {interpretation}
          </p>
        )}

        {/* Aspects */}
        {relevantAspects.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-white/30 mb-3">Active aspects</h3>
            <ul className="space-y-2">
              {relevantAspects.map((a, i) => {
                const other = a.from === planet ? a.to : a.from;
                const nature = ASPECT_NATURE[a.type];
                const natureColor = nature === 'ease' ? '#4ade80' : nature === 'tension' ? '#f87171' : '#94a3b8';
                return (
                  <li key={i} className="flex items-center justify-between text-sm py-1.5"
                    style={{ borderBottom: '1px solid #ffffff08' }}>
                    <span className="text-white/70">
                      <span style={{ color: PLANET_COLORS[other] }}>{PLANET_LABELS[other]}</span>
                      {' '}{ASPECT_LABELS[a.type]}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-white/30">
                      <span style={{ color: natureColor }}>{nature}</span>
                      <span>{a.orb.toFixed(1)}°</span>
                      <span>{a.isApplying ? 'applying' : 'separating'}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    </>
  );
}
