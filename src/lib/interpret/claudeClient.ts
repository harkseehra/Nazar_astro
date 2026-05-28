import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './systemPrompt';
import {
  buildPlanetPrompt,
  buildOverallPrompt,
  buildTopAspectPrompt,
} from './userPrompts';
import type { PlanetName, ChartSnapshot, Aspect, TodayJson } from '@/types/astrology';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 400;

const PLANETS: PlanetName[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// Fallback when Claude call fails — raw position data so the site never breaks
function fallbackInterpretation(planet: PlanetName, chart: ChartSnapshot): string {
  const d = chart.planets[planet];
  const sign = d.sign.charAt(0).toUpperCase() + d.sign.slice(1);
  const retro = d.isRetrograde ? ', retrograde' : '';
  return `${planet.charAt(0).toUpperCase() + planet.slice(1)} at ${d.signDegree.toFixed(1)}° ${sign}${retro}. Interpretation unavailable — check back later.`;
}

function fallbackOverall(): string {
  return 'Chart computed. Interpretation unavailable — check back later.';
}

export async function generateInterpretations(
  chart: ChartSnapshot,
  aspects: Aspect[],
  date: Date,
  retrogrades: PlanetName[],
): Promise<TodayJson['interpretations']> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = buildSystemPrompt();

  async function call(userPrompt: string): Promise<string> {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const block = msg.content[0];
    return block.type === 'text' ? block.text.trim() : '';
  }

  const interpretations: TodayJson['interpretations'] = {
    overall: '',
    topAspect: '',
  };

  // Overall
  try {
    interpretations.overall = await call(buildOverallPrompt(chart, aspects, date, retrogrades));
  } catch (err) {
    console.error('[interpret] overall failed:', err);
    interpretations.overall = fallbackOverall();
  }

  // Top aspect
  if (aspects.length > 0) {
    try {
      interpretations.topAspect = await call(buildTopAspectPrompt(aspects[0], chart, date));
    } catch (err) {
      console.error('[interpret] topAspect failed:', err);
      interpretations.topAspect = '';
    }
  }

  // Per planet — sequential to avoid rate-limit spikes
  for (const planet of PLANETS) {
    try {
      interpretations[planet] = await call(buildPlanetPrompt(planet, chart, aspects, date));
    } catch (err) {
      console.error(`[interpret] ${planet} failed:`, err);
      interpretations[planet] = fallbackInterpretation(planet, chart);
    }
  }

  return interpretations;
}
