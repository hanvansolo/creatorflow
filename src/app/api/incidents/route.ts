// @ts-nocheck — Stub API data, will be properly typed when rewritten for Footy Feed
import { NextRequest, NextResponse } from 'next/server';
import { getLiveIncidents, getCurrentRaceSession } from '@/lib/api/regulations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get('raceId');
    const sessionType = searchParams.get('sessionType') || undefined;

    // If no raceId provided, try to get current race
    let targetRaceId = raceId;
    let raceName: string | undefined;
    let isLive = false;

    if (!targetRaceId) {
      const currentSession = await getCurrentRaceSession();
      if (currentSession) {
        targetRaceId = currentSession.raceId;
        raceName = currentSession.raceName;
        isLive = currentSession.isLive;
      } else {
        return NextResponse.json({
          incidents: [],
          raceId: null,
          raceName: null,
          isLive: false,
        });
      }
    }

    const incidents = await getLiveIncidents(targetRaceId, sessionType);

    return NextResponse.json({
      incidents,
      raceId: targetRaceId,
      raceName,
      isLive,
    });
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
