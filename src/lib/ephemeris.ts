import swisseph from 'swisseph';
import { computeWholeSignHouse } from './houses';
import { computeAspects as _computeAspects } from './aspects';
import { moonPhase as _moonPhase, isVoidOfCourse as _isVoidOfCourse } from './moon';
import type {
  ChartSnapshot,
  PlanetName,
  PlanetData,
  ZodiacSign,
  Aspect,
  MoonPhaseResult,
  VoidOfCourseResult,
} from '@/types/astrology';

// Moshier analytical ephemeris — no data files required
const FLAGS = swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SPEED;

const PLANET_IDS: Record<PlanetName, number> = {
  sun: swisseph.SE_SUN,
  moon: swisseph.SE_MOON,
  mercury: swisseph.SE_MERCURY,
  venus: swisseph.SE_VENUS,
  mars: swisseph.SE_MARS,
  jupiter: swisseph.SE_JUPITER,
  saturn: swisseph.SE_SATURN,
};

const SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export function longitudeToSign(lon: number): { sign: ZodiacSign; signDegree: number } {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  return {
    sign: SIGNS[signIndex],
    signDegree: normalized % 30,
  };
}

export function signIndex(sign: ZodiacSign): number {
  return SIGNS.indexOf(sign);
}

function dateToJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return swisseph.swe_julday(y, m, d, h, swisseph.SE_GREG_CAL);
}

function computePlanet(jd: number, id: number): { longitude: number; speed: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = swisseph.swe_calc_ut(jd, id, FLAGS) as any;
  if (result.error) {
    throw new Error(`swisseph error for planet ${id}: ${result.error}`);
  }
  return { longitude: result.longitude as number, speed: result.longitudeSpeed as number };
}

export function computeChart({
  datetime,
  latitude,
  longitude,
}: {
  datetime: Date | string;
  latitude: number;
  longitude: number;
}): ChartSnapshot {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const jd = dateToJulianDay(date);

  // swe_houses(jd, geolat, geolon, hsys) — 'W' = Whole Sign
  // This gives us the ascendant and MC longitudes even in Whole Sign mode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const houses = swisseph.swe_houses(jd, latitude, longitude, 'W') as any;
  if (houses.error) {
    throw new Error(`swe_houses error: ${houses.error}`);
  }

  const ascLon: number = houses.ascendant;
  const mcLon: number = houses.mc;
  const { sign: ascSign, signDegree: ascDegree } = longitudeToSign(ascLon);
  const { sign: mcSign, signDegree: mcDegree } = longitudeToSign(mcLon);

  const planets: Partial<Record<PlanetName, PlanetData>> = {};

  for (const [name, id] of Object.entries(PLANET_IDS) as [PlanetName, number][]) {
    const { longitude: lon, speed } = computePlanet(jd, id);
    const { sign, signDegree } = longitudeToSign(lon);
    const house = computeWholeSignHouse(sign, ascSign);

    planets[name] = {
      sign,
      signDegree,
      absoluteLongitude: lon,
      house,
      isRetrograde: speed < 0,
      speed,
    };
  }

  return {
    datetime: date.toISOString(),
    location: { lat: latitude, lon: longitude, label: '' },
    ascendant: { sign: ascSign, degree: ascDegree },
    midheaven: { sign: mcSign, degree: mcDegree },
    planets: planets as Record<PlanetName, PlanetData>,
  };
}

export function computeAspects(chart: ChartSnapshot): Aspect[] {
  return _computeAspects(chart);
}

export function moonPhase(datetime: Date | string): MoonPhaseResult {
  return _moonPhase(datetime);
}

export function isVoidOfCourse(datetime: Date | string): VoidOfCourseResult {
  return _isVoidOfCourse(datetime);
}
