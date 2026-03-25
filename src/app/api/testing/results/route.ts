import { NextRequest, NextResponse } from 'next/server';
import { db, testingEvents, testingSessions, testingResults, drivers, teams } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

interface ResultInput {
  driverCode: string;
  bestLapTime: string;        // "1:30.456"
  bestLapTimeMs: number;      // 90456
  totalLaps: number;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  longRunPace?: string;       // "1:33.200"
  longRunPaceMs?: number;     // 93200
  longRunLaps?: number;
  tyreCompound?: string;      // "C3"
  reliabilityIssues?: string;
  notes?: string;
}

/**
 * POST /api/testing/results
 *
 * Input testing session results.
 *
 * Body:
 * {
 *   "secret": "...",
 *   "eventSlug": "bahrain-2026",
 *   "day": 1,
 *   "session": "morning" | "afternoon",
 *   "weatherConditions": "Hot & Dry",
 *   "trackTemp": 45.5,
 *   "airTemp": 32.0,
 *   "results": [
 *     { "driverCode": "VER", "bestLapTime": "1:30.456", "bestLapTimeMs": 90456, "totalLaps": 78, ... }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, eventSlug, day, session, weatherConditions, trackTemp, airTemp, results: inputResults } = body;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!eventSlug || !day || !session || !inputResults?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: eventSlug, day, session, results' },
        { status: 400 }
      );
    }

    // Find event
    const [event] = await db
      .select()
      .from(testingEvents)
      .where(eq(testingEvents.slug, eventSlug))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: `Event not found: ${eventSlug}` }, { status: 404 });
    }

    // Find session
    const sessionNamePattern = session === 'morning' ? `Day ${day} - Morning` : `Day ${day} - Afternoon`;
    const [testSession] = await db
      .select()
      .from(testingSessions)
      .where(and(
        eq(testingSessions.eventId, event.id),
        eq(testingSessions.sessionName, sessionNamePattern)
      ))
      .limit(1);

    if (!testSession) {
      return NextResponse.json(
        { error: `Session not found: Day ${day} ${session}` },
        { status: 404 }
      );
    }

    // Update session weather
    if (weatherConditions || trackTemp || airTemp) {
      await db
        .update(testingSessions)
        .set({
          weatherConditions: weatherConditions || testSession.weatherConditions,
          trackTemp: trackTemp?.toString() || testSession.trackTemp,
          airTemp: airTemp?.toString() || testSession.airTemp,
        })
        .where(eq(testingSessions.id, testSession.id));
    }

    // Get all drivers and teams for lookup
    const allDrivers = await db.select({ id: drivers.id, code: drivers.code }).from(drivers);
    const allTeams = await db.select({ id: teams.id, slug: teams.slug }).from(teams);

    const driverMap = new Map(allDrivers.map(d => [d.code, d.id]));

    // Get driver -> team mapping
    const driverTeams = await db
      .select({ id: drivers.id, code: drivers.code, teamId: drivers.currentTeamId })
      .from(drivers);
    const driverTeamMap = new Map(driverTeams.map(d => [d.code, d.teamId]));

    // Sort results by lap time and assign positions
    const sorted = [...(inputResults as ResultInput[])].sort(
      (a, b) => (a.bestLapTimeMs || 999999) - (b.bestLapTimeMs || 999999)
    );

    const fastestMs = sorted[0]?.bestLapTimeMs || 0;
    let savedCount = 0;

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const driverId = driverMap.get(r.driverCode);
      const teamId = driverTeamMap.get(r.driverCode);

      if (!driverId) {
        console.warn(`Driver not found: ${r.driverCode}`);
        continue;
      }

      const gap = i === 0 ? null : `+${((r.bestLapTimeMs - fastestMs) / 1000).toFixed(3)}`;

      // Upsert result
      await db
        .insert(testingResults)
        .values({
          sessionId: testSession.id,
          driverId,
          teamId: teamId || undefined,
          bestLapTime: r.bestLapTime,
          bestLapTimeMs: r.bestLapTimeMs,
          totalLaps: r.totalLaps,
          sector1: r.sector1,
          sector2: r.sector2,
          sector3: r.sector3,
          longRunPace: r.longRunPace,
          longRunPaceMs: r.longRunPaceMs,
          longRunLaps: r.longRunLaps || 0,
          tyreCompound: r.tyreCompound,
          reliabilityIssues: r.reliabilityIssues,
          notes: r.notes,
          position: i + 1,
          gapToLeader: gap,
        })
        .onConflictDoUpdate({
          target: [testingResults.sessionId, testingResults.driverId],
          set: {
            bestLapTime: r.bestLapTime,
            bestLapTimeMs: r.bestLapTimeMs,
            totalLaps: r.totalLaps,
            sector1: r.sector1,
            sector2: r.sector2,
            sector3: r.sector3,
            longRunPace: r.longRunPace,
            longRunPaceMs: r.longRunPaceMs,
            longRunLaps: r.longRunLaps || 0,
            tyreCompound: r.tyreCompound,
            reliabilityIssues: r.reliabilityIssues,
            notes: r.notes,
            position: i + 1,
            gapToLeader: gap,
          },
        });

      savedCount++;
    }

    // Update event status to live if upcoming
    if (event.status === 'upcoming') {
      await db
        .update(testingEvents)
        .set({ status: 'live' })
        .where(eq(testingEvents.id, event.id));
    }

    return NextResponse.json({
      success: true,
      session: sessionNamePattern,
      resultsSaved: savedCount,
    });
  } catch (error) {
    console.error('Testing results API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/testing/results?eventSlug=bahrain-2026
 *
 * Get all testing results for an event (used by prediction system).
 */
export async function GET(request: NextRequest) {
  const eventSlug = request.nextUrl.searchParams.get('eventSlug');

  if (!eventSlug) {
    return NextResponse.json({ error: 'Missing eventSlug' }, { status: 400 });
  }

  const [event] = await db
    .select()
    .from(testingEvents)
    .where(eq(testingEvents.slug, eventSlug))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const sessions = await db
    .select()
    .from(testingSessions)
    .where(eq(testingSessions.eventId, event.id));

  const allResults = [];
  for (const session of sessions) {
    const results = await db
      .select({
        sessionName: testingSessions.sessionName,
        day: testingSessions.day,
        driverCode: drivers.code,
        teamSlug: teams.slug,
        bestLapTime: testingResults.bestLapTime,
        bestLapTimeMs: testingResults.bestLapTimeMs,
        totalLaps: testingResults.totalLaps,
        longRunPace: testingResults.longRunPace,
        longRunPaceMs: testingResults.longRunPaceMs,
        longRunLaps: testingResults.longRunLaps,
        tyreCompound: testingResults.tyreCompound,
        reliabilityIssues: testingResults.reliabilityIssues,
        position: testingResults.position,
      })
      .from(testingResults)
      .innerJoin(testingSessions, eq(testingResults.sessionId, testingSessions.id))
      .innerJoin(drivers, eq(testingResults.driverId, drivers.id))
      .innerJoin(teams, eq(testingResults.teamId, teams.id))
      .where(eq(testingResults.sessionId, session.id));

    allResults.push(...results);
  }

  return NextResponse.json({ event, results: allResults });
}
