import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Try /tmp first (written by cron on each run), then fall back to bundled static file
  const candidates = [
    join('/tmp', 'today.json'),
    join(process.cwd(), 'public', 'data', 'today.json'),
  ];

  for (const path of candidates) {
    try {
      const raw = await readFile(path, 'utf8');
      const data = JSON.parse(raw);
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: 'today.json not found' }, { status: 404 });
}
