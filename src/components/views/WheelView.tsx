'use client';
import { PLANET_COLORS, PLANET_GLYPHS, SIGN_GLYPHS } from '@/lib/theme';
import type { PlanetName, TodayJson, ZodiacSign } from '@/types/astrology';

const SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const PLANETS: PlanetName[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

interface Props {
  data: TodayJson;
  houses?: Partial<Record<PlanetName, number>>;
  ascendantSign?: ZodiacSign;
  onSelectPlanet: (p: PlanetName) => void;
  selectedPlanet: PlanetName | null;
}

const CX = 200;
const CY = 200;
const R_OUTER = 185;
const R_SIGN = 155;
const R_PLANET = 115;
const R_INNER = 80;

function lonToAngle(absoluteLon: number, ascLon: number): number {
  // Rotate so ascendant is at 9 o'clock (180° in SVG convention)
  return ((absoluteLon - ascLon + 360) % 360);
}

function polarToXY(angleDeg: number, r: number): [number, number] {
  // SVG: 0° = right, clockwise. Astrology: 0° Asc = left, counter-clockwise.
  const rad = ((180 - angleDeg) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
}

export function WheelView({ data, ascendantSign, onSelectPlanet, selectedPlanet }: Props) {
  // Ascendant absolute longitude: derive from sign start
  const ascSignIdx = ascendantSign ? SIGNS.indexOf(ascendantSign) : 0;
  const ascLon = ascSignIdx * 30;

  return (
    <div className="flex items-center justify-center w-full h-full pt-16 pb-4 px-4">
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-[500px] max-h-[85vh]"
        style={{ overflow: 'visible' }}
      >
        {/* Background */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="#0D1219" stroke="#ffffff0d" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_SIGN}  fill="none"    stroke="#ffffff08" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_INNER} fill="#0A0E14" stroke="#ffffff08" strokeWidth={1} />

        {/* 12 house dividers (whole sign — equally spaced from ascendant) */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = ((i * 30) + 180 - ascLon + 360) % 360;
          const [x1, y1] = polarToXY(angle, R_INNER);
          const [x2, y2] = polarToXY(angle, R_OUTER);
          const isAngular = i % 3 === 0;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isAngular ? '#2196D440' : '#ffffff10'}
              strokeWidth={isAngular ? 1.5 : 0.5} />
          );
        })}

        {/* Sign glyphs in the outer ring */}
        {SIGNS.map((sign, i) => {
          const midAngle = (i * 30 + 15 + 180 - ascLon + 360) % 360;
          const [x, y] = polarToXY(midAngle, (R_SIGN + R_OUTER) / 2);
          return (
            <text key={sign} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize="12" fill="#ffffff25">
              {SIGN_GLYPHS[sign]}
            </text>
          );
        })}

        {/* House numbers in inner ring */}
        {Array.from({ length: 12 }, (_, i) => {
          const midAngle = (i * 30 + 15 + 180 - ascLon + 360) % 360;
          const [x, y] = polarToXY(midAngle, (R_INNER + R_PLANET) / 2 - 10);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="#ffffff15">
              {i + 1}
            </text>
          );
        })}

        {/* Aspect lines */}
        {data.aspects.map((a, i) => {
          const lonA = data.planets[a.from].absoluteLongitude;
          const lonB = data.planets[a.to].absoluteLongitude;
          const [x1, y1] = polarToXY(lonToAngle(lonA, ascLon), R_PLANET - 10);
          const [x2, y2] = polarToXY(lonToAngle(lonB, ascLon), R_PLANET - 10);
          const isTense = a.type === 'square' || a.type === 'opposition';
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isTense ? '#f8717130' : '#4ade8030'}
              strokeWidth={0.8} strokeDasharray={isTense ? '3 3' : undefined} />
          );
        })}

        {/* Planets */}
        {PLANETS.map((planet) => {
          const pd = data.planets[planet];
          const angle = lonToAngle(pd.absoluteLongitude, ascLon);
          const [x, y] = polarToXY(angle, R_PLANET);
          const color = PLANET_COLORS[planet];
          const isSelected = selectedPlanet === planet;

          return (
            <g key={planet} onClick={() => onSelectPlanet(planet)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={isSelected ? 14 : 12}
                fill={isSelected ? color + '33' : '#0A0E14'}
                stroke={color} strokeWidth={isSelected ? 1.5 : 1} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fill={color}>
                {PLANET_GLYPHS[planet]}
              </text>
              {pd.isRetrograde && (
                <text x={x + 8} y={y - 8} fontSize="7" fill="#fbbf24">℞</text>
              )}
            </g>
          );
        })}

        {/* AC label */}
        {(() => {
          const [x, y] = polarToXY(180, R_OUTER + 12);
          return <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#2196D4">AC</text>;
        })()}

        {/* Overall text in centre */}
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize="10" fill="#ffffff20">نظر</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="8" fill="#ffffff15">
          {new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </text>
      </svg>
    </div>
  );
}
