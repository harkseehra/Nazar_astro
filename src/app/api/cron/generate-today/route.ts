import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { computeChart, computeAspects, moonPhase, isVoidOfCourse } from '@/lib/ephemeris';
import { generateInterpretations } from '@/lib/interpret/claudeClient';
import type { TodayJson, PlanetName } from '@/types/astrology';

function isAuthorised(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const now = new Date();
    const snapshotDate = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0,
    ));

    const chart = computeChart({ datetime: snapshotDate, latitude: 0, longitude: 0 });
    const aspects = computeAspects(chart);
    const phase = moonPhase(snapshotDate);
    const voc = isVoidOfCourse(snapshotDate);

    const planets = Object.fromEntries(
      Object.entries(chart.planets).map(([name, data]) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { house: _house, ...rest } = data;
        return [name, rest];
      })
    ) as TodayJson['planets'];

    const retrogrades = (Object.keys(chart.planets) as PlanetName[]).filter(
      (p) => chart.planets[p].isRetrograde
    );

    const validUntil = new Date(snapshotDate);
    validUntil.setUTCDate(validUntil.getUTCDate() + 1);

    const interpretations = await generateInterpretations(chart, aspects, snapshotDate, retrogrades);

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

    const json = JSON.stringify(today, null, 2);

    // /tmp is always writable on Vercel serverless; public/data works in dev
    const tmpPath = join('/tmp', 'today.json');
    await writeFile(tmpPath, json, 'utf8');

    // Best-effort write to public/data (succeeds in dev, silently skipped in prod)
    try {
      const publicDir = join(process.cwd(), 'public', 'data');
      await mkdir(publicDir, { recursive: true });
      await writeFile(join(publicDir, 'today.json'), json, 'utf8');
    } catch {
      // Expected in Vercel prod — read-only deployment bundle
    }

    return NextResponse.json({ ok: true, generatedAt: today.generatedAt });
  } catch (err) {
    console.error('[generate-today]', err);
    return NextResponse.json({ error: 'Chart generation failed', detail: String(err) }, { status: 500 });
  }
}
