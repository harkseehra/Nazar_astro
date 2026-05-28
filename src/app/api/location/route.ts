import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel injects geo headers on the edge
  const lat = request.headers.get('x-vercel-ip-latitude');
  const lon = request.headers.get('x-vercel-ip-longitude');
  const city = request.headers.get('x-vercel-ip-city') ?? '';
  const country = request.headers.get('x-vercel-ip-country') ?? '';

  if (lat && lon) {
    return NextResponse.json({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      label: [city, country].filter(Boolean).join(', '),
    });
  }

  // Dev fallback — London
  return NextResponse.json({ lat: 51.5074, lon: -0.1278, label: 'London' });
}
