import * as Astronomy from 'astronomy-engine';
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

const SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const BODIES: Record<PlanetName, Astronomy.Body> = {
  sun:     Astronomy.Body.Sun,
  moon:    Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus:   Astronomy.Body.Venus,
  mars:    Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn:  Astronomy.Body.Saturn,
};

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

function tropicalLongitude(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const rot = Astronomy.Rotation_EQJ_ECT(date);
  const ecl = Astronomy.RotateVector(rot, vec);
  return (Math.atan2(ecl.y, ecl.x) * 180 / Math.PI + 360) % 360;
}

function planetSpeed(body: Astronomy.Body, date: Date): number {
  const dt = 0.01; // days ≈ 14.4 minutes, small enough for precision
  const t1 = new Date(date.getTime() - dt * 0.5 * 86400000);
  const t2 = new Date(date.getTime() + dt * 0.5 * 86400000);
  const lon1 = tropicalLongitude(body, t1);
  const lon2 = tropicalLongitude(body, t2);
  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff / dt;
}

function computeAscendantLon(date: Date, lat: number, lon: number): number {
  const gast = Astronomy.SiderealTime(date); // GAST in hours
  const lst = ((gast + lon / 15) % 24 + 24) % 24;
  const ramc = lst * 15; // degrees

  const tilt = Astronomy.e_tilt(Astronomy.MakeTime(date));
  const eps = tilt.tobl; // true obliquity in degrees

  const ramcRad = ramc * Math.PI / 180;
  const epsRad = eps * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  return (Math.atan2(
    Math.cos(ramcRad),
    -(Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad))
  ) * 180 / Math.PI + 360) % 360;
}

function computeMidheavenLon(date: Date, lon: number): number {
  const gast = Astronomy.SiderealTime(date);
  const lst = ((gast + lon / 15) % 24 + 24) % 24;
  const ramc = lst * 15;

  const tilt = Astronomy.e_tilt(Astronomy.MakeTime(date));
  const eps = tilt.tobl;

  const ramcRad = ramc * Math.PI / 180;
  const epsRad = eps * Math.PI / 180;

  return (Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad)) * 180 / Math.PI + 360) % 360;
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

  const ascLon = computeAscendantLon(date, latitude, longitude);
  const mcLon = computeMidheavenLon(date, longitude);
  const { sign: ascSign, signDegree: ascDegree } = longitudeToSign(ascLon);
  const { sign: mcSign, signDegree: mcDegree } = longitudeToSign(mcLon);

  const planets: Partial<Record<PlanetName, PlanetData>> = {};

  for (const [name, body] of Object.entries(BODIES) as [PlanetName, Astronomy.Body][]) {
    const lon = tropicalLongitude(body, date);
    const speed = planetSpeed(body, date);
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
