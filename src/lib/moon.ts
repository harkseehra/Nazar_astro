import * as Astronomy from 'astronomy-engine';
import { longitudeToSign } from './ephemeris';
import type { MoonPhaseResult, MoonPhaseName, VoidOfCourseResult } from '@/types/astrology';

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

function nextPhaseAfter(date: Date, currentElong: number): { name: MoonPhaseName; at: string } {
  const targets = [0, 90, 180, 270];
  const names: MoonPhaseName[] = ['new_moon', 'first_quarter', 'full_moon', 'last_quarter'];

  let idx = targets.findIndex((t) => t > currentElong);
  if (idx === -1) idx = 0;

  const result = Astronomy.SearchMoonPhase(targets[idx], date, 30);
  if (!result) {
    const daysUntil = ((targets[idx] - currentElong + 360) % 360) / 13.2;
    return {
      name: names[idx],
      at: new Date(date.getTime() + daysUntil * 86400000).toISOString(),
    };
  }
  return { name: names[idx], at: result.date.toISOString() };
}

export function moonPhase(datetime: Date | string): MoonPhaseResult {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const elong = Astronomy.MoonPhase(date); // 0–360°, 0=new, 180=full
  const phaseName = phaseFromElongation(elong);
  const illumination = (1 - Math.cos((elong * Math.PI) / 180)) / 2;
  const next = nextPhaseAfter(date, elong);

  return {
    phaseName,
    illumination: Math.round(illumination * 1000) / 1000,
    nextPhase: next,
  };
}

const MOON_BODY = Astronomy.Body.Moon;
const OTHER_BODIES = [
  Astronomy.Body.Sun,
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
];
const ASPECT_ANGLES = [0, 60, 90, 120, 180];
const MOON_ORB = 8;

function tropicalLon(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const rot = Astronomy.Rotation_EQJ_ECT(date);
  const ecl = Astronomy.RotateVector(rot, vec);
  return (Math.atan2(ecl.y, ecl.x) * 180 / Math.PI + 360) % 360;
}

function angularDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function isVoidOfCourse(datetime: Date | string): VoidOfCourseResult {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;

  const moonLon = tropicalLon(MOON_BODY, date);
  const moonSign = longitudeToSign(moonLon).sign;

  const degsRemaining = 30 - (moonLon % 30);
  const daysToSignChange = degsRemaining / 13.2; // avg Moon speed
  const signChangeDate = new Date(date.getTime() + daysToSignChange * 86400000);

  let willFormAspect = false;
  const stepMs = 2 * 60 * 60 * 1000; // 2-hour steps

  let checkDate = new Date(date.getTime() + stepMs);
  outer: while (checkDate < signChangeDate) {
    const checkMoonLon = tropicalLon(MOON_BODY, checkDate);
    if (longitudeToSign(checkMoonLon).sign !== moonSign) break;

    for (const body of OTHER_BODIES) {
      const pLon = tropicalLon(body, checkDate);
      const dist = angularDist(checkMoonLon, pLon);
      for (const angle of ASPECT_ANGLES) {
        if (Math.abs(dist - angle) <= MOON_ORB) {
          willFormAspect = true;
          break outer;
        }
      }
    }

    checkDate = new Date(checkDate.getTime() + stepMs);
  }

  return {
    isVoid: !willFormAspect,
    untilDatetime: !willFormAspect ? signChangeDate.toISOString() : null,
  };
}
