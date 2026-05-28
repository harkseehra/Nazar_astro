import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { computeChart } from '@/lib/ephemeris';
import { computeWholeSignHouse } from '@/lib/houses';
import type { PlanetName, ZodiacSign } from '@/types/astrology';
import { readFile } from 'fs/promises';
import { join } from 'path';

const PLANETS: PlanetName[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '51.5074');
  const lon = parseFloat(searchParams.get('lon') ?? '-0.1278');

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 });
  }

  try {
    // Use the snapshot datetime from today.json so houses match the same moment
    const raw = await readFile(join(process.cwd(), 'public', 'data', 'today.json'), 'utf8');
    const today = JSON.parse(raw);
    const snapshotDatetime = today.generatedAt as string;

    const chart = computeChart({ datetime: snapshotDatetime, latitude: lat, longitude: lon });
    const ascendantSign = chart.ascendant.sign;

    const houses: Partial<Record<PlanetName, number>> = {};
    for (const planet of PLANETS) {
      const sign = today.planets[planet]?.sign as ZodiacSign;
      if (sign) {
        houses[planet] = computeWholeSignHouse(sign, ascendantSign);
      }
    }

    return NextResponse.json({
      ascendant: chart.ascendant,
      midheaven: chart.midheaven,
      houses,
    });
  } catch (err) {
    console.error('[houses]', err);
    return NextResponse.json({ error: 'House computation failed' }, { status: 500 });
  }
}
