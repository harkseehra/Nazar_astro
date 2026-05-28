import type { PlanetName, ZodiacSign, Dignity } from '@/types/astrology';

// Classical Hellenistic/Abu Ma'shar rulership table
// Domicile: planet rules this sign
const DOMICILES: Record<PlanetName, ZodiacSign[]> = {
  sun:     ['leo'],
  moon:    ['cancer'],
  mercury: ['gemini', 'virgo'],
  venus:   ['taurus', 'libra'],
  mars:    ['aries', 'scorpio'],
  jupiter: ['sagittarius', 'pisces'],
  saturn:  ['capricorn', 'aquarius'],
};

// Exaltations: planet is exalted in this sign (one sign each)
const EXALTATIONS: Partial<Record<PlanetName, ZodiacSign>> = {
  sun:     'aries',
  moon:    'taurus',
  mercury: 'virgo',
  venus:   'pisces',
  mars:    'capricorn',
  jupiter: 'cancer',
  saturn:  'libra',
};

// Detriment = opposite sign(s) to domicile
// Fall = opposite sign to exaltation

const OPPOSITES: Record<ZodiacSign, ZodiacSign> = {
  aries: 'libra',       libra: 'aries',
  taurus: 'scorpio',    scorpio: 'taurus',
  gemini: 'sagittarius', sagittarius: 'gemini',
  cancer: 'capricorn',  capricorn: 'cancer',
  leo: 'aquarius',      aquarius: 'leo',
  virgo: 'pisces',      pisces: 'virgo',
};

export function getDignity(planet: PlanetName, sign: ZodiacSign): Dignity {
  if (DOMICILES[planet].includes(sign)) return 'domicile';

  const exalt = EXALTATIONS[planet];
  if (exalt === sign) return 'exaltation';

  const detriments = DOMICILES[planet].map((s) => OPPOSITES[s]);
  if (detriments.includes(sign)) return 'detriment';

  if (exalt && OPPOSITES[exalt] === sign) return 'fall';

  return 'peregrine';
}

export function getDignityLabel(dignity: Dignity): string {
  const labels: Record<Dignity, string> = {
    domicile: 'in domicile',
    exaltation: 'in exaltation',
    detriment: 'in detriment',
    fall: 'in fall',
    peregrine: 'peregrine',
  };
  return labels[dignity];
}
