// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getFixtureEvents } from '@/lib/api/football-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const fixtureId = parseInt(request.nextUrl.searchParams.get('fixture') || '0');
  if (key !== (process.env.CRON_KEY || 'dev-key') || !fixtureId) {
    return NextResponse.json({ error: 'Unauthorized or missing fixture param' }, { status: 401 });
  }

  const data = await getFixtureEvents(fixtureId);
  return NextResponse.json({
    results: data.results,
    errors: data.errors,
    firstEvent: data.response?.[0] || null,
    allEvents: data.response?.slice(0, 5) || [],
  });
}
