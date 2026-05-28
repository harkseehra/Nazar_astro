import swisseph from 'swisseph';
import { longitudeToSign } from './ephemeris';
import type { MoonPhaseResult, MoonPhaseName, VoidOfCourseResult, AspectType } from '@/types/astrology';

const FLAGS = swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SPEED;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcUt(jd: number, planet: number): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = swisseph.swe_calc_ut(jd, planet, FLAGS) as any;
  if (r.error) throw new Error(`swe_calc_ut failed: ${r.error}`);
  return r;
}

function dateToJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return swisseph.swe_julday(y, m, d, h, swisseph.SE_GREG_CAL);
}

function julianDayToDate(jd: number): Date {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = swisseph.swe_jdut1_to_utc(jd, swisseph.SE_GREG_CAL) as any;
  return new Date(Date.UTC(
    result.year, result.month - 1, result.day,
    result.hour, result.minute, Math.floor(result.second),
  ));
}

function getSunMoonLongitudes(jd: number): { sun: number; moon: number; moonSpeed: number } {
  const sunResult = calcUt(jd, swisseph.SE_SUN);
  const moonResult = calcUt(jd, swisseph.SE_MOON);
  return {
    sun: sunResult.longitude as number,
    moon: moonResult.longitude as number,
    moonSpeed: moonResult.longitudeSpeed as number,
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

  const next = boundaries.find((b) => b > currentElong) ?? 360;
  const nextIndex = boundaries.indexOf(next);
  const nextName = names[nextIndex];
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

// Void of course: Moon has made its last Ptolemaic aspect before leaving its current sign.
export function isVoidOfCourse(datetime: Date | string): VoidOfCourseResult {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const jd = dateToJulianDay(date);

  const moonResult = calcUt(jd, swisseph.SE_MOON);
  const moonLon: number = moonResult.longitude;
  const moonSpeed: number = moonResult.longitudeSpeed;
  const moonSign = longitudeToSign(moonLon).sign;

  const moonSignDeg = moonLon % 30;
  const degsRemainingInSign = 30 - moonSignDeg;
  const daysToSignChange = degsRemainingInSign / (moonSpeed > 0 ? moonSpeed : 13.2);
  const signChangeJd = jd + daysToSignChange;

  let willFormAspect = false;
  const stepDays = 2 / 24;

  outer: for (let checkJd = jd + stepDays; checkJd < signChangeJd; checkJd += stepDays) {
    let mResult: { longitude: number } | null = null;
    try { mResult = calcUt(checkJd, swisseph.SE_MOON); } catch { continue; }
    if (!mResult) continue;
    const checkMoonLon: number = mResult.longitude;
    if (longitudeToSign(checkMoonLon).sign !== moonSign) break;

    for (const planetId of OTHER_PLANETS) {
      let pResult: { longitude: number } | null = null;
      try { pResult = calcUt(checkJd, planetId); } catch { continue; }
      if (!pResult) continue;
      const pLon: number = pResult.longitude;
      const dist = angularDist(checkMoonLon, pLon);
      for (const { angle } of ASPECT_ANGLES) {
        if (Math.abs(dist - angle) <= MOON_ORB) {
          willFormAspect = true;
          break outer;
        }
      }
    }
  }

  return {
    isVoid: !willFormAspect,
    untilDatetime: !willFormAspect ? julianDayToDate(signChangeJd).toISOString() : null,
  };
}
