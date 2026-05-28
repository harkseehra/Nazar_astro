/**
 * Reference charts verified via swisseph Moshier, cross-checked against
 * NASA/JPL Horizons and Astro.com (Tropical, Geocentric).
 *
 * Chart 1: 2000-01-01 00:00:00 UTC at 0°N 0°E
 *   Sun  ~  9.86° Capricorn
 *   Moon ~  7.29° Scorpio
 *   Mercury ~  1.11° Capricorn (direct)
 *   Venus  ~  0.96° Sagittarius
 *   Mars   ~ 27.58° Aquarius
 *   Jupiter ~ 25.23° Aries
 *   Saturn ~ 10.41° Taurus (retrograde)
 *
 * Chart 2: 1980-06-21 12:00:00 UTC at 0°N 0°E  (summer solstice)
 *   Sun ~ 0.25° Cancer (solstice point)
 *
 * Chart 3: 2024-03-20 03:07:00 UTC at 0°N 0°E  (vernal equinox 2024)
 *   Sun ~ 0.00° Aries (equinox point)
 */

import { computeChart, computeAspects } from '../src/lib/ephemeris';
import { getDignity } from '../src/lib/dignities';
import { computeWholeSignHouse } from '../src/lib/houses';
import { moonPhase } from '../src/lib/moon';

describe('computeChart — J2000.0 reference', () => {
  const chart = computeChart({
    datetime: new Date('2000-01-01T00:00:00Z'),
    latitude: 0,
    longitude: 0,
  });

  test('Sun is in Capricorn near 10°', () => {
    expect(chart.planets.sun.sign).toBe('capricorn');
    expect(chart.planets.sun.signDegree).toBeCloseTo(10, 0);
  });

  test('Moon is in Scorpio near 7°', () => {
    expect(chart.planets.moon.sign).toBe('scorpio');
    expect(chart.planets.moon.signDegree).toBeCloseTo(7.3, 0);
  });

  test('Mercury is direct in Capricorn near 1°', () => {
    expect(chart.planets.mercury.sign).toBe('capricorn');
    expect(chart.planets.mercury.isRetrograde).toBe(false);
  });

  test('Venus is in Sagittarius near 1°', () => {
    expect(chart.planets.venus.sign).toBe('sagittarius');
    expect(chart.planets.venus.signDegree).toBeCloseTo(1, 0);
  });

  test('Mars is in Aquarius near 27°', () => {
    expect(chart.planets.mars.sign).toBe('aquarius');
    expect(chart.planets.mars.signDegree).toBeCloseTo(27.6, 0);
  });

  test('Jupiter is in Aries near 25°', () => {
    expect(chart.planets.jupiter.sign).toBe('aries');
    expect(chart.planets.jupiter.signDegree).toBeCloseTo(25.2, 0);
  });

  test('Saturn is retrograde in Taurus near 10°', () => {
    expect(chart.planets.saturn.sign).toBe('taurus');
    expect(chart.planets.saturn.signDegree).toBeCloseTo(10.4, 0);
    expect(chart.planets.saturn.isRetrograde).toBe(true);
  });

  test('All 7 classical planets are present', () => {
    const names = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    for (const name of names) {
      expect(chart.planets).toHaveProperty(name);
    }
  });
});

describe('computeChart — Summer Solstice 1980', () => {
  const chart = computeChart({
    datetime: new Date('1980-06-21T12:00:00Z'),
    latitude: 0,
    longitude: 0,
  });

  test('Sun is at 0° Cancer at summer solstice', () => {
    expect(chart.planets.sun.sign).toBe('cancer');
    expect(chart.planets.sun.signDegree).toBeCloseTo(0, 0);
  });
});

describe('computeChart — Vernal Equinox 2024', () => {
  const chart = computeChart({
    datetime: new Date('2024-03-20T03:07:00Z'),
    latitude: 0,
    longitude: 0,
  });

  test('Sun is at 0° Aries at vernal equinox', () => {
    expect(chart.planets.sun.sign).toBe('aries');
    expect(chart.planets.sun.signDegree).toBeCloseTo(0, 0);
  });
});

describe('Whole Sign houses', () => {
  test('Planet in same sign as ascendant = house 1', () => {
    expect(computeWholeSignHouse('aries', 'aries')).toBe(1);
  });

  test('Planet in next sign = house 2', () => {
    expect(computeWholeSignHouse('taurus', 'aries')).toBe(2);
  });

  test('Planet in opposite sign = house 7', () => {
    expect(computeWholeSignHouse('libra', 'aries')).toBe(7);
  });

  test('Wraps correctly at year boundary', () => {
    expect(computeWholeSignHouse('pisces', 'aries')).toBe(12);
  });
});

describe('Classical dignities', () => {
  test('Sun in Leo = domicile', () => {
    expect(getDignity('sun', 'leo')).toBe('domicile');
  });

  test('Sun in Aries = exaltation', () => {
    expect(getDignity('sun', 'aries')).toBe('exaltation');
  });

  test('Sun in Aquarius = detriment', () => {
    expect(getDignity('sun', 'aquarius')).toBe('detriment');
  });

  test('Sun in Libra = fall', () => {
    expect(getDignity('sun', 'libra')).toBe('fall');
  });

  test('Mars in Aries = domicile', () => {
    expect(getDignity('mars', 'aries')).toBe('domicile');
  });

  test('Mars in Cancer = fall', () => {
    expect(getDignity('mars', 'cancer')).toBe('fall');
  });

  test('Venus in Pisces = exaltation', () => {
    expect(getDignity('venus', 'pisces')).toBe('exaltation');
  });

  test('Saturn in Libra = exaltation', () => {
    expect(getDignity('saturn', 'libra')).toBe('exaltation');
  });

  test('Jupiter in Gemini = detriment', () => {
    expect(getDignity('jupiter', 'gemini')).toBe('detriment');
  });

  test('Mercury in Virgo = domicile and exaltation (domicile takes precedence)', () => {
    expect(getDignity('mercury', 'virgo')).toBe('domicile');
  });
});

describe('Aspect detection', () => {
  const chart = computeChart({
    datetime: new Date('2000-01-01T00:00:00Z'),
    latitude: 0,
    longitude: 0,
  });
  const aspects = computeAspects(chart);

  test('Returns an array of aspects', () => {
    expect(Array.isArray(aspects)).toBe(true);
  });

  test('Each aspect has required fields', () => {
    for (const asp of aspects) {
      expect(asp).toHaveProperty('from');
      expect(asp).toHaveProperty('to');
      expect(asp).toHaveProperty('type');
      expect(asp).toHaveProperty('orb');
      expect(typeof asp.isApplying).toBe('boolean');
    }
  });

  test('No self-aspects', () => {
    for (const asp of aspects) {
      expect(asp.from).not.toBe(asp.to);
    }
  });

  test('Sorted by tightness (smallest orb first)', () => {
    for (let i = 1; i < aspects.length; i++) {
      expect(aspects[i].orb).toBeGreaterThanOrEqual(aspects[i - 1].orb);
    }
  });
});

describe('Moon phase', () => {
  test('Returns correct phase shape', () => {
    const result = moonPhase(new Date('2000-01-01T00:00:00Z'));
    expect(result).toHaveProperty('phaseName');
    expect(result).toHaveProperty('illumination');
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.illumination).toBeLessThanOrEqual(1);
    expect(result.nextPhase).toHaveProperty('name');
    expect(result.nextPhase).toHaveProperty('at');
  });

  test('Full moon has high illumination', () => {
    // 2000-02-19 was a full moon
    const result = moonPhase(new Date('2000-02-19T12:00:00Z'));
    expect(result.illumination).toBeGreaterThan(0.85);
  });

  test('New moon has low illumination', () => {
    // 2000-02-05 was a new moon
    const result = moonPhase(new Date('2000-02-05T12:00:00Z'));
    expect(result.illumination).toBeLessThan(0.15);
  });
});
