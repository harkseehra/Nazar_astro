import { getDignity, getDignityLabel } from '@/lib/dignities';
import type { PlanetName, ChartSnapshot, Aspect, TodayJson } from '@/types/astrology';

const PLANET_LABELS: Record<PlanetName, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury',
  venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
};

const ASPECT_LABELS: Record<string, string> = {
  conjunction: 'conjunct', sextile: 'sextile', square: 'square',
  trine: 'trine', opposition: 'opposite',
};

function speedLabel(speed: number, planet: PlanetName): string {
  if (speed < 0) return 'retrograde';
  const avg: Record<PlanetName, number> = {
    sun: 0.985, moon: 13.2, mercury: 1.2, venus: 1.2,
    mars: 0.52, jupiter: 0.083, saturn: 0.034,
  };
  const ratio = Math.abs(speed) / avg[planet];
  if (ratio < 0.6) return 'slow (stationing)';
  if (ratio > 1.3) return 'fast';
  return 'average speed';
}

function formatAspects(planet: PlanetName, aspects: Aspect[]): string {
  const relevant = aspects.filter((a) => a.from === planet || a.to === planet);
  if (relevant.length === 0) return 'No exact aspects today.';
  return relevant
    .map((a) => {
      const other = a.from === planet ? a.to : a.from;
      const applying = a.isApplying ? 'applying' : 'separating';
      return `  - ${ASPECT_LABELS[a.type]} ${PLANET_LABELS[other]} (${applying}, ${a.orb.toFixed(1)}° orb)`;
    })
    .join('\n');
}

export function buildPlanetPrompt(
  planet: PlanetName,
  chart: ChartSnapshot,
  aspects: Aspect[],
  date: Date,
): string {
  const data = chart.planets[planet];
  const dignity = getDignity(planet, data.sign);
  const dignityStr = getDignityLabel(dignity);
  const sign = data.sign.charAt(0).toUpperCase() + data.sign.slice(1);
  const degree = data.signDegree.toFixed(1);
  const speed = speedLabel(data.speed, planet);
  const retroStr = data.isRetrograde ? 'Retrograde.' : 'Direct.';

  return `Today is ${date.toDateString()}.

Generate the interpretation for ${PLANET_LABELS[planet]} only.

Position:
- ${PLANET_LABELS[planet]} is at ${degree}° ${sign}, ${dignityStr}
- ${retroStr} Moving at ${speed}.
- House ${data.house} (Whole Sign, based on user location — mention house only if directly relevant)

Active aspects today:
${formatAspects(planet, aspects)}

Write 2–4 sentences. Begin with what the planet is doing today (sign, motion, any key aspect). End with a concrete, honest observation about how this day feels or what it demands. Do not use the word "energy."`;
}

export function buildOverallPrompt(
  chart: ChartSnapshot,
  aspects: Aspect[],
  date: Date,
  retrogrades: PlanetName[],
): string {
  const retroStr =
    retrogrades.length > 0
      ? `Retrograde planets: ${retrogrades.map((p) => PLANET_LABELS[p]).join(', ')}.`
      : 'No planets retrograde today.';

  const topAspects = aspects.slice(0, 3).map((a) => {
    const applying = a.isApplying ? 'applying' : 'separating';
    return `${PLANET_LABELS[a.from]} ${ASPECT_LABELS[a.type]} ${PLANET_LABELS[a.to]} (${applying}, ${a.orb.toFixed(1)}°)`;
  });

  const moonSign = chart.planets.moon.sign;
  const moonDeg = chart.planets.moon.signDegree.toFixed(1);

  return `Today is ${date.toDateString()}.

Give the overall headline for today's sky in 2–3 sentences. This is the first thing a person reads — make it land.

Key facts:
- Moon: ${moonDeg}° ${moonSign}
- ${retroStr}
- Tightest aspects: ${topAspects.join('; ')}

Capture the day's overall texture — what kind of day is it? Is it easy or demanding? Fast or slow? Do not list planets. Do not explain what aspects mean. Just describe how the day feels, in your voice, with the honesty and directness of the writing samples. Do not use the word "energy."`;
}

export function buildTopAspectPrompt(aspect: Aspect, chart: ChartSnapshot, date: Date): string {
  const fromData = chart.planets[aspect.from];
  const toData = chart.planets[aspect.to];
  const fromSign = fromData.sign.charAt(0).toUpperCase() + fromData.sign.slice(1);
  const toSign = toData.sign.charAt(0).toUpperCase() + toData.sign.slice(1);
  const applying = aspect.isApplying ? 'applying' : 'separating (past exact)';

  return `Today is ${date.toDateString()}.

The most exact aspect today is ${PLANET_LABELS[aspect.from]} ${ASPECT_LABELS[aspect.type]} ${PLANET_LABELS[aspect.to]}, ${applying}, orb ${aspect.orb.toFixed(1)}°.

${PLANET_LABELS[aspect.from]} is in ${fromSign}. ${PLANET_LABELS[aspect.to]} is in ${toSign}.

Write 2–3 sentences. Name what this aspect actually does — what it demands, permits, or denies. Be specific to the signs involved. Honest about whether this is ease or tension. Do not use the word "energy."`;
}
