import swisseph from 'swisseph';
import { longitudeToSign } from './ephemeris';
import type { MoonPhaseResult, MoonPhaseName, VoidOfCourseResult, ZodiacSign, AspectType } from '@/types/astrology';

const FLAGS = swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SPEED;

function dateToJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return swisseph.swe_julday(y, m, d, h, swisseph.SE_GREG_CAL);
}

function julianDayToDate(jd: number): Date {
  const result = swisseph.swe_jdut1_to_utc(jd, swisseph.SE_GREG_CAL);
  return new Date(Date.UTC(result.year, result.month - 1, result.day,
    result.hour, result.minute, Math.floor(result.second)));
}

function getSunMoonLongitudes(jd: number): { sun: number; moon: number; moonSpeed: number } {
  const sunResult = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, FLAGS);
  const moonResult = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, FLAGS);
  if ('error' in sunResult || 'error' in moonResult) {
    throw new Error('swisseph calculation failed');
  }
  return {
    sun: sunResult.longitude,
    moon: moonResult.longitude,
    moonSpeed: moonResult.longitudeSpeed,
  };
}

function elongation(sunLon: number, moonLon: number): number {
  return ((moonLon - sunLon) % 360 + 360) % 360;
}

function phaseFromElongation(elong: number): MoonPhaseName {
  if (elong < 22.5 || elong >= 337.5) return 'new_moon';
  if (elong < 67.5)  return 'waxing_crescent';
  if (elong < 112.5) return 'first_quarter';
  if (elong < 157.5) return 'waxing_gibbous';
  if (elong < 202.5) return 'full_moon';
  if (elong < 247.5) return 'waning_gibbous';
  if (elong < 292.5) return 'last_quarter';
  return 'waning_crescent';
}

function nextPhaseBoundaryJd(jd: number, currentElong: number): { name: MoonPhaseName; jd: number } {
  const boundaries = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const names: MoonPhaseName[] = [
    'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
    'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent', 'new_moon',
  ];

  // Find next boundary after currentElong
  const next = boundaries.find((b) => b > currentElong) ?? 360;
  const nextIndex = boundaries.indexOf(next);
  const nextName = names[nextIndex];

  // Estimate: moon moves ~13.2°/day relative to sun
  const daysUntil = (next - currentElong) / 13.2;
  return { name: nextName, jd: jd + daysUntil };
}

export function moonPhase(datetime: Date | string): MoonPhaseResult {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const jd = dateToJulianDay(date);
  const { sun, moon } = getSunMoonLongitudes(jd);
  const elong = elongation(sun, moon);
  const phaseName = phaseFromElongation(elong);
  const illumination = (1 - Math.cos((elong * Math.PI) / 180)) / 2;
  const next = nextPhaseBoundaryJd(jd, elong);

  return {
    phaseName,
    illumination: Math.round(illumination * 1000) / 1000,
    nextPhase: { name: next.name, at: julianDayToDate(next.jd).toISOString() },
  };
}

const ASPECT_ANGLES: { type: AspectType; angle: number }[] = [
  { type: 'conjunction', angle: 0 },
  { type: 'sextile',     angle: 60 },
  { type: 'square',      angle: 90 },
  { type: 'trine',       angle: 120 },
  { type: 'opposition',  angle: 180 },
];

const OTHER_PLANETS = [
  swisseph.SE_SUN,
  swisseph.SE_MERCURY,
  swisseph.SE_VENUS,
  swisseph.SE_MARS,
  swisseph.SE_JUPITER,
  swisseph.SE_SATURN,
];

const MOON_ORB = 8;

function angularDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Void of course: Moon has made its last Ptolemaic aspect in its current sign
// and has not yet entered the next sign.
export function isVoidOfCourse(datetime: Date | string): VoidOfCourseResult {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const jd = dateToJulianDay(date);

  const moonResult = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, FLAGS);
  if ('error' in moonResult) throw new Error('Moon calculation failed');

  const moonLon = moonResult.longitude;
  const moonSpeed = moonResult.longitudeSpeed;
  const moonSign = longitudeToSign(moonLon).sign;

  // Degrees remaining in current sign
  const moonSignDeg = moonLon % 30;
  const degsRemainingInSign = 30 - moonSignDeg;

  // Check if Moon will form any more Ptolemaic aspects before leaving its sign
  // We step forward in small increments checking aspects
  let willFormAspect = false;
  let voidEndJd: number | null = null;

  // Time for moon to leave sign at current speed
  const daysToSignChange = degsRemainingInSign / (moonSpeed > 0 ? moonSpeed : 13.2);
  const signChangeJd = jd + daysToSignChange;

  // Check every 2 hours until sign change
  const stepDays = 2 / 24;
  for (let checkJd = jd + stepDays; checkJd < signChangeJd; checkJd += stepDays) {
    const mResult = swisseph.swe_calc_ut(checkJd, swisseph.SE_MOON, FLAGS);
    if ('error' in mResult) continue;
    const checkMoonLon = mResult.longitude;
    const checkMoonSign = longitudeToSign(checkMoonLon).sign;
    if (checkMoonSign !== moonSign) break;

    for (const planetId of OTHER_PLANETS) {
      const pResult = swisseph.swe_calc_ut(checkJd, planetId, FLAGS);
      if ('error' in pResult) continue;
      const pLon = pResult.longitude;
      const dist = angularDist(checkMoonLon, pLon);
      for (const { angle } of ASPECT_ANGLES) {
        if (Math.abs(dist - angle) <= MOON_ORB) {
          willFormAspect = true;
          break;
        }
      }
      if (willFormAspect) break;
    }
    if (willFormAspect) break;
  }

  const isVoid = !willFormAspect;

  if (isVoid) {
    voidEndJd = signChangeJd;
  }

  return {
    isVoid,
    untilDatetime: isVoid && voidEndJd ? julianDayToDate(voidEndJd).toISOString() : null,
  };
}
