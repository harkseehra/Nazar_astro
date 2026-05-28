import type { PlanetName } from '@/types/astrology';

export const PLANET_COLORS: Record<PlanetName, string> = {
  sun:     '#7D4452', // Yama-budo
  moon:    '#506D8B', // Tsuki-yo
  mercury: '#788E96', // Kiri-same
  venus:   '#825D8E', // Murasaki-shikibu
  mars:    '#6F4734', // Yama-guri
  jupiter: '#205171', // Shin-kai
  saturn:  '#404B57', // Take-sumi
};

export const PLANET_GLYPHS: Record<PlanetName, string> = {
  sun:     '☉',
  moon:    '☽',
  mercury: '☿',
  venus:   '♀',
  mars:    '♂',
  jupiter: '♃',
  saturn:  '♄',
};

export const PLANET_LABELS: Record<PlanetName, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury',
  venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
};

export const SIGN_GLYPHS: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

export const MOON_PHASE_ICONS: Record<string, string> = {
  new_moon: '🌑', waxing_crescent: '🌒', first_quarter: '🌓',
  waxing_gibbous: '🌔', full_moon: '🌕', waning_gibbous: '🌖',
  last_quarter: '🌗', waning_crescent: '🌘',
};

export const MOON_PHASE_LABELS: Record<string, string> = {
  new_moon: 'New Moon', waxing_crescent: 'Waxing Crescent',
  first_quarter: 'First Quarter', waxing_gibbous: 'Waxing Gibbous',
  full_moon: 'Full Moon', waning_gibbous: 'Waning Gibbous',
  last_quarter: 'Last Quarter', waning_crescent: 'Waning Crescent',
};

export const BG = '#0A0E14';
export const ACCENT = '#2196D4'; // Kon-peki
export const TEXT_PRIMARY = '#E8ECF0';
export const TEXT_MUTED = '#8A9099';
