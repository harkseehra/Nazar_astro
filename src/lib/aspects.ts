import type { ChartSnapshot, Aspect, AspectType, PlanetName } from '@/types/astrology';

interface AspectDef {
  type: AspectType;
  angle: number;
}

const ASPECT_DEFS: AspectDef[] = [
  { type: 'conjunction',  angle: 0   },
  { type: 'sextile',      angle: 60  },
  { type: 'square',       angle: 90  },
  { type: 'trine',        angle: 120 },
  { type: 'opposition',   angle: 180 },
];

// Orbs per planet per spec: 8° for Sun/Moon, 6° for Mercury/Venus/Mars, 5° for Jupiter/Saturn
const ORB_TABLE: Record<PlanetName, number> = {
  sun:     8,
  moon:    8,
  mercury: 6,
  venus:   6,
  mars:    6,
  jupiter: 5,
  saturn:  5,
};

function allowedOrb(a: PlanetName, b: PlanetName): number {
  // Use the larger of the two planets' orbs
  return Math.max(ORB_TABLE[a], ORB_TABLE[b]);
}

function angularDistance(lon1: number, lon2: number): number {
  const diff = Math.abs(lon1 - lon2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

const PLANETS: PlanetName[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

export function computeAspects(chart: ChartSnapshot): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const pA = PLANETS[i];
      const pB = PLANETS[j];
      const lonA = chart.planets[pA].absoluteLongitude;
      const lonB = chart.planets[pB].absoluteLongitude;
      const dist = angularDistance(lonA, lonB);

      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(dist - def.angle);
        const maxOrb = allowedOrb(pA, pB);
        if (orb <= maxOrb) {
          // Applying: faster planet is closing the orb
          const speedA = chart.planets[pA].speed;
          const speedB = chart.planets[pB].speed;
          const relativeSpeed = speedA - speedB;
          const isApplying = (relativeSpeed > 0 && dist < def.angle) ||
                             (relativeSpeed < 0 && dist > def.angle);

          // Estimate exactAt: hours until exact = orb / |relativeSpeed| * 24
          let exactAt: string | null = null;
          if (Math.abs(relativeSpeed) > 0.001) {
            const daysUntilExact = orb / Math.abs(relativeSpeed);
            const exactDate = new Date(chart.datetime);
            exactDate.setTime(exactDate.getTime() + daysUntilExact * 86400000);
            exactAt = exactDate.toISOString();
          }

          aspects.push({ from: pA, to: pB, type: def.type, orb, isApplying, exactAt });
          break; // only one aspect type per pair
        }
      }
    }
  }

  // Sort by tightness of orb
  return aspects.sort((a, b) => a.orb - b.orb);
}
