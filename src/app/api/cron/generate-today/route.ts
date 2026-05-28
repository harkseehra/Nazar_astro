import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { computeChart, computeAspects, moonPhase, isVoidOfCourse } from '@/lib/ephemeris';
import { generateInterpretations } from '@/lib/interpret/claudeClient';
import type { TodayJson, PlanetName } from '@/types/astrology';

// Vercel cron auth — only Vercel scheduler should call this
function isAuthorised(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: allow unauthenticated
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Daily snapshot at 06:00 UTC, geocentric (0°, 0°)
    const now = new Date();
    const snapshotDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      6, 0, 0,
    ));

    const chart = computeChart({
      datetime: snapshotDate,
      latitude: 0,
      longitude: 0,
    });

    const aspects = computeAspects(chart);
    const phase = moonPhase(snapshotDate);
    const voc = isVoidOfCourse(snapshotDate);

    // Strip 'house' — house is recomputed client-side per user location
    const planets = Object.fromEntries(
      Object.entries(chart.planets).map(([name, data]) => {
        const { house: _house, ...rest } = data;
        return [name, rest];
      })
    ) as TodayJson['planets'];

    const retrogrades = (Object.keys(chart.planets) as PlanetName[]).filter(
      (p) => chart.planets[p].isRetrograde
    );

    const validUntil = new Date(snapshotDate);
    validUntil.setUTCDate(validUntil.getUTCDate() + 1);

    // Generate Claude interpretations — fails gracefully, never breaks the chart
    const interpretations = await generateInterpretations(
      chart,
      aspects,
      snapshotDate,
      retrogrades,
    );

    const today: TodayJson = {
      generatedAt: snapshotDate.toISOString(),
      validUntil: validUntil.toISOString(),
      planets,
      aspects,
      moonPhase: phase,
      voidOfCourse: {
        isVoidNow: voc.isVoid,
        nextVoidStart: null,
        nextVoidEnd: voc.isVoid ? voc.untilDatetime : null,
      },
      retrogrades,
      interpretations,
    };

    const dataDir = join(process.cwd(), 'public', 'data');
    await mkdir(dataDir, { recursive: true });
    await writeFile(join(dataDir, 'today.json'), JSON.stringify(today, null, 2), 'utf8');

    return NextResponse.json({ ok: true, generatedAt: today.generatedAt });
  } catch (err) {
    console.error('[generate-today]', err);
    return NextResponse.json(
      { error: 'Chart generation failed', detail: String(err) },
      { status: 500 }
    );
  }
}
