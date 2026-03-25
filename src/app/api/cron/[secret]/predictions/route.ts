import { NextRequest, NextResponse } from 'next/server';
import { db, races, circuits } from '@/lib/db';
import { eq, gte, asc } from 'drizzle-orm';
import { generateRacePrediction } from '@/lib/api/predictions';
import { syncCurrentStandings } from '@/lib/api/jolpica-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max (includes Jolpica sync)

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    // Validate secret token
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== Starting Prediction Generation ===\n');
    const startTime = Date.now();

    // STEP 1: Sync latest standings from Jolpica-F1 API (PRIMARY SOURCE)
    console.log('--- Step 1: Syncing from Jolpica-F1 API ---');
    let jolpicaSync = { driverStandingsUpdated: 0, constructorStandingsUpdated: 0, errors: [] as string[] };
    try {
      jolpicaSync = await syncCurrentStandings();
      console.log(`  Synced ${jolpicaSync.driverStandingsUpdated} driver standings`);
      console.log(`  Synced ${jolpicaSync.constructorStandingsUpdated} constructor standings`);
    } catch (err) {
      console.error('  Jolpica sync failed, using cached data:', err);
      jolpicaSync.errors.push(err instanceof Error ? err.message : 'Unknown error');
    }

    // STEP 2: Generate prediction
    console.log('\n--- Step 2: Generating Prediction ---');

    // Get next upcoming race
    const now = new Date();

    const [nextRace] = await db
      .select({
        id: races.id,
        name: races.name,
        raceDate: races.raceDatetime,
        circuitName: circuits.name,
      })
      .from(races)
      .innerJoin(circuits, eq(races.circuitId, circuits.id))
      .where(gte(races.raceDatetime, now))
      .orderBy(asc(races.raceDatetime))
      .limit(1);

    if (!nextRace) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming races found',
      });
    }

    console.log(`Generating prediction for: ${nextRace.name}`);

    // Generate prediction
    const prediction = await generateRacePrediction(nextRace.id);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dataSynced: {
        source: 'Jolpica-F1 API',
        driverStandings: jolpicaSync.driverStandingsUpdated,
        constructorStandings: jolpicaSync.constructorStandingsUpdated,
        errors: jolpicaSync.errors,
      },
      race: {
        id: nextRace.id,
        name: nextRace.name,
        circuit: nextRace.circuitName,
        date: nextRace.raceDate,
      },
      topPredictions: prediction.predictedOrder.slice(0, 10).map(p => ({
        position: p.predictedPosition,
        driver: p.driverName,
        team: p.teamName,
        confidence: `${p.confidenceScore.toFixed(0)}%`,
      })),
      weatherCondition: prediction.weatherConditions?.weatherCondition || 'unknown',
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Prediction generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
