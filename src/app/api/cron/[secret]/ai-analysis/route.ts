import { NextRequest, NextResponse } from 'next/server';
import { db, aiAnalysis, teams, races, racePredictions, raceResults, drivers } from '@/lib/db';
import { desc, eq, lt, and, isNull, isNotNull, asc } from 'drizzle-orm';
import { analyzeF1Content, fetchAndAnalyzeF1News, generateRaceDebrief, type AnalysisResult } from '@/lib/api/ai-analysis';
import { syncCurrentStandings } from '@/lib/api/jolpica-sync';
import type { DriverPrediction } from '@/types/predictions';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 minutes max (includes Jolpica sync + AI)

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

/**
 * AI Analysis Cron Endpoint
 *
 * IMPORTANT: Syncs from Jolpica-F1 API first (PRIMARY SOURCE),
 * then uses AI to analyze news for supplementary insights.
 *
 * Data priority:
 * 1. Jolpica-F1 API - Official race results, standings (PRIMARY)
 * 2. AI Analysis - News insights, testing reports (SECONDARY)
 *
 * Schedule: Every 6-12 hours during testing/race weekends, daily otherwise
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== Starting Data Update ===\n');
    const startTime = Date.now();

    // STEP 1: Sync from Jolpica-F1 API (PRIMARY SOURCE)
    console.log('--- Step 1: Syncing from Jolpica-F1 API (PRIMARY) ---');
    let jolpicaSync = { driverStandingsUpdated: 0, constructorStandingsUpdated: 0, errors: [] as string[] };
    try {
      jolpicaSync = await syncCurrentStandings();
      console.log(`  Driver standings synced: ${jolpicaSync.driverStandingsUpdated}`);
      console.log(`  Constructor standings synced: ${jolpicaSync.constructorStandingsUpdated}`);
      if (jolpicaSync.errors.length > 0) {
        console.log(`  Jolpica sync errors: ${jolpicaSync.errors.join(', ')}`);
      }
    } catch (jolpicaError) {
      console.error('  Jolpica sync failed, continuing with AI analysis:', jolpicaError);
      jolpicaSync.errors.push(jolpicaError instanceof Error ? jolpicaError.message : 'Unknown error');
    }

    // STEP 2: Generate debriefs for completed races that don't have one
    console.log('\n--- Step 2: Generating Race Debriefs ---');
    let debriefCount = 0;
    try {
      const now = new Date();
      // Find predictions for completed races that lack a debrief
      const pendingDebriefs = await db
        .select({
          predictionId: racePredictions.id,
          raceId: racePredictions.raceId,
          predictedOrder: racePredictions.predictedOrder,
          raceName: races.name,
          raceDate: races.raceDatetime,
        })
        .from(racePredictions)
        .innerJoin(races, eq(racePredictions.raceId, races.id))
        .where(and(
          lt(races.raceDatetime, now),
          isNull(racePredictions.debrief),
          isNotNull(racePredictions.accuracy) // Only debrief races that have accuracy (results synced)
        ))
        .limit(3); // Process max 3 per run to avoid timeouts

      for (const pending of pendingDebriefs) {
        if (!pending.raceId) continue;

        // Get circuit name
        const [raceData] = await db
          .select({ circuitName: races.name })
          .from(races)
          .where(eq(races.id, pending.raceId))
          .limit(1);

        // Get race results with driver and team info
        const results = await db
          .select({
            position: raceResults.position,
            gridPosition: raceResults.gridPosition,
            points: raceResults.points,
            status: raceResults.status,
            fastestLap: raceResults.fastestLap,
            driverCode: drivers.code,
            driverFirstName: drivers.firstName,
            driverLastName: drivers.lastName,
            teamName: teams.name,
          })
          .from(raceResults)
          .innerJoin(drivers, eq(raceResults.driverId, drivers.id))
          .innerJoin(teams, eq(raceResults.teamId, teams.id))
          .where(eq(raceResults.raceId, pending.raceId))
          .orderBy(asc(raceResults.position));

        if (results.length === 0) continue;

        const predictedOrder = (pending.predictedOrder as DriverPrediction[]) || [];

        const debrief = await generateRaceDebrief({
          raceName: pending.raceName,
          circuitName: raceData?.circuitName || pending.raceName,
          results: results.map(r => ({
            position: r.position || 0,
            driverCode: r.driverCode || `${r.driverFirstName[0]}${r.driverLastName[0]}`,
            driverName: `${r.driverFirstName} ${r.driverLastName}`,
            teamName: r.teamName,
            gridPosition: r.gridPosition || 0,
            points: parseFloat(r.points || '0'),
            status: r.status || 'Finished',
            fastestLap: r.fastestLap || false,
          })),
          predictions: predictedOrder.map(p => ({
            driverCode: p.driverCode,
            predictedPosition: p.predictedPosition,
          })),
        });

        if (debrief.summary) {
          await db
            .update(racePredictions)
            .set({ debrief })
            .where(eq(racePredictions.id, pending.predictionId));
          debriefCount++;
          console.log(`  Generated debrief for ${pending.raceName}`);
        }
      }
    } catch (debriefError) {
      console.error('  Debrief generation failed:', debriefError);
    }

    // STEP 3: AI Analysis of news (SECONDARY SOURCE)
    console.log('\n--- Step 3: AI Analysis of News (SECONDARY) ---');
    const analysisResults = await fetchAndAnalyzeF1News();

    console.log(`Analyzed ${analysisResults.length} sources`);

    let savedCount = 0;
    const allAdjustments: Record<string, number[]> = {};
    const explanations: string[] = [];

    for (const result of analysisResults) {
      if (!result.summary || result.summary === 'Analysis failed') {
        console.log(`  Skipping failed analysis from ${result.source}`);
        continue;
      }

      // Store the analysis
      await db.insert(aiAnalysis).values({
        source: result.source,
        analysisType: 'news',
        summary: result.summary,
        explanation: result.explanation,
        teamUpdates: result.teamUpdates,
        driverUpdates: result.driverUpdates,
        confidenceAdjustments: result.confidenceAdjustments,
      });
      savedCount++;

      // Collect explanations
      if (result.explanation && result.explanation !== 'No detailed explanation available.') {
        explanations.push(`**${result.source}:**\n${result.explanation}`);
      }

      // Collect all confidence adjustments
      for (const [teamSlug, adjustment] of Object.entries(result.confidenceAdjustments)) {
        if (!allAdjustments[teamSlug]) {
          allAdjustments[teamSlug] = [];
        }
        allAdjustments[teamSlug].push(adjustment);
      }

      console.log(`  ${result.source}: ${result.teamUpdates.length} team updates, ${result.driverUpdates.length} driver updates`);
    }

    // Calculate average adjustments per team
    const averagedAdjustments: Record<string, number> = {};
    for (const [teamSlug, adjustments] of Object.entries(allAdjustments)) {
      const avg = adjustments.reduce((a, b) => a + b, 0) / adjustments.length;
      // Clamp to -0.2 to +0.2 range
      averagedAdjustments[teamSlug] = Math.max(-0.2, Math.min(0.2, avg));
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      // Primary source: Jolpica-F1 API
      jolpicaSync: {
        driverStandingsUpdated: jolpicaSync.driverStandingsUpdated,
        constructorStandingsUpdated: jolpicaSync.constructorStandingsUpdated,
        errors: jolpicaSync.errors,
      },
      // Race debriefs
      debriefs: {
        generated: debriefCount,
      },
      // Secondary source: AI Analysis
      aiAnalysis: {
        sourcesAnalyzed: analysisResults.length,
        analysisSaved: savedCount,
        adjustments: averagedAdjustments,
        explanations: explanations.join('\n\n---\n\n'),
      },
      duration_ms: duration,
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual content analysis
 *
 * Use this to analyze specific content (e.g., testing reports, press releases)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, source, analysisType = 'manual' } = body;

    if (!content || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: content, source' },
        { status: 400 }
      );
    }

    console.log(`Analyzing manual content from ${source}...`);
    const startTime = Date.now();

    const result = await analyzeF1Content(content, source);

    // Store the analysis
    await db.insert(aiAnalysis).values({
      source: result.source,
      analysisType,
      content: content.slice(0, 10000), // Limit stored content
      summary: result.summary,
      explanation: result.explanation,
      teamUpdates: result.teamUpdates,
      driverUpdates: result.driverUpdates,
      confidenceAdjustments: result.confidenceAdjustments,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis: {
        summary: result.summary,
        explanation: result.explanation,
        teamUpdates: result.teamUpdates,
        driverUpdates: result.driverUpdates,
        confidenceAdjustments: result.confidenceAdjustments,
      },
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Manual analysis failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
