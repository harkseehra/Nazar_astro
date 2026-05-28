export type PlanetName = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine';

export type MoonPhaseName =
  | 'new_moon' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full_moon' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export interface PlanetData {
  sign: ZodiacSign;
  signDegree: number;       // 0–29.999
  absoluteLongitude: number; // 0–359.999
  house: number;             // 1–12
  isRetrograde: boolean;
  speed: number;             // deg/day
}

export interface ChartSnapshot {
  datetime: string;          // ISO 8601, UTC
  location: { lat: number; lon: number; label: string };
  ascendant: { sign: ZodiacSign; degree: number };
  midheaven: { sign: ZodiacSign; degree: number };
  planets: Record<PlanetName, PlanetData>;
}

export interface Aspect {
  from: PlanetName;
  to: PlanetName;
  type: AspectType;
  orb: number;
  isApplying: boolean;
  exactAt: string | null;    // ISO 8601, or null if can't determine
}

export interface MoonPhaseResult {
  phaseName: MoonPhaseName;
  illumination: number;      // 0–1
  nextPhase: { name: MoonPhaseName; at: string };
}

export interface VoidOfCourseResult {
  isVoid: boolean;
  untilDatetime: string | null;  // ISO 8601
}

export interface TodayJson {
  generatedAt: string;
  validUntil: string;
  planets: Record<PlanetName, Omit<PlanetData, 'house'>>;
  aspects: Aspect[];
  moonPhase: MoonPhaseResult;
  voidOfCourse: {
    isVoidNow: boolean;
    nextVoidStart: string | null;
    nextVoidEnd: string | null;
  };
  retrogrades: PlanetName[];
  interpretations: {
    overall: string;
    topAspect: string;
  } & Partial<Record<PlanetName, string>>;
}
