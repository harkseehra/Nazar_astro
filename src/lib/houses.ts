import type { ZodiacSign } from '@/types/astrology';

const SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export function computeWholeSignHouse(planetSign: ZodiacSign, ascendantSign: ZodiacSign): number {
  const planetIdx = SIGNS.indexOf(planetSign);
  const ascIdx = SIGNS.indexOf(ascendantSign);
  return ((planetIdx - ascIdx + 12) % 12) + 1;
}

export function houseSign(house: number, ascendantSign: ZodiacSign): ZodiacSign {
  const ascIdx = SIGNS.indexOf(ascendantSign);
  return SIGNS[(ascIdx + house - 1) % 12];
}
