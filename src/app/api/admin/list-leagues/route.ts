// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getLeagues } from '@/lib/api/football-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all leagues with a current season
    const data = await getLeagues({ current: 'true' } as any);

    const leagues = data.response
      .filter((l: any) => l.league.type === 'League')
      .map((l: any) => ({
        id: l.league.id,
        name: l.league.name,
        country: l.country.name,
        code: l.country.code || 'XX',
      }))
      .sort((a: any, b: any) => a.country.localeCompare(b.country));

    const cups = data.response
      .filter((l: any) => l.league.type === 'Cup')
      .map((l: any) => ({
        id: l.league.id,
        name: l.league.name,
        country: l.country.name,
        code: l.country.code || 'XX',
      }))
      .sort((a: any, b: any) => a.country.localeCompare(b.country));

    return NextResponse.json({
      totalActive: data.results,
      leagues: leagues.length,
      cups: cups.length,
      allLeagues: leagues,
      allCups: cups,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
