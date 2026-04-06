// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';
import { db, matches, matchPredictions, clubs, competitions, competitionSeasons } from '@/lib/db';
import { getFixturePredictions } from '@/lib/api/football-api';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

// Only generate predictions for these leagues (saves API calls + AI tokens)
const PREDICTION_LEAGUES = new Set([
  'Premier League', 'Championship', 'League One', 'League Two',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Champions League', 'Europa League', 'Conference League',
  'FA Cup', 'EFL Cup',
  'Scottish Premiership',
  'Eredivisie', 'Primeira Liga',
  'MLS', 'Liga MX', 'Brasileirão',
  'Copa Libertadores',
  'World Cup', 'European Championship', 'Copa America', 'Nations League',
  'Saudi Pro League',
]);

const PREDICTION_PARTIAL = [
  'Champions League', 'Europa League', 'Conference League',
  'World Cup', 'Nations League', 'Euro',
];

function isPredictionWorthy(competitionName: string): boolean {
  if (PREDICTION_LEAGUES.has(competitionName)) return true;
  return PREDICTION_PARTIAL.some(p => competitionName.includes(p));
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

interface AIPrediction {
  predictedOutcome: 'home' | 'draw' | 'away';
  predictedHomeScore: number;
  predictedAwayScore: number;
  confidence: number;
  btts: boolean;
  overUnder: number;
  overUnderPrediction: 'over' | 'under';
  reasoning: string;
}

async function generateAIPrediction(
  homeName: string,
  awayName: string,
  competitionName: string,
  apiPrediction: any
): Promise<AIPrediction | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const pred = apiPrediction?.predictions;
    const teams = apiPrediction?.teams;
    const comparison = apiPrediction?.comparison;

    const prompt = `You are a football betting analyst. Generate a match prediction.

Match: ${homeName} vs ${awayName}
Competition: ${competitionName}

API-Football Data:
- Winner prediction: ${pred?.winner?.name || 'None'} (${pred?.winner?.comment || ''})
- Advice: ${pred?.advice || 'None'}
- Win probabilities: Home ${pred?.percent?.home || '?'}, Draw ${pred?.percent?.draw || '?'}, Away ${pred?.percent?.away || '?'}
- Expected goals: Home ${pred?.goals?.home || '?'}, Away ${pred?.goals?.away || '?'}
- Over/Under: ${pred?.under_over || '?'}
${teams ? `
Home form (last 5): ${teams.home?.last_5?.form || '?'} | Goals for: ${teams.home?.last_5?.goals?.for?.average || '?'}/game | Against: ${teams.home?.last_5?.goals?.against?.average || '?'}/game
Away form (last 5): ${teams.away?.last_5?.form || '?'} | Goals for: ${teams.away?.last_5?.goals?.for?.average || '?'}/game | Against: ${teams.away?.last_5?.goals?.against?.average || '?'}/game` : ''}
${comparison ? `
Comparison: Form ${comparison.form?.home || '?'} vs ${comparison.form?.away || '?'} | Attack ${comparison.att?.home || '?'} vs ${comparison.att?.away || '?'} | Defence ${comparison.def?.home || '?'} vs ${comparison.def?.away || '?'} | H2H ${comparison.h2h?.home || '?'} vs ${comparison.h2h?.away || '?'}` : ''}

Respond in JSON only, no markdown:
{
  "predictedOutcome": "home",
  "predictedHomeScore": 2,
  "predictedAwayScore": 1,
  "confidence": 72,
  "btts": true,
  "overUnder": 2.5,
  "overUnderPrediction": "over",
  "reasoning": "Brief 1-2 sentence reasoning combining form, H2H, and statistical analysis"
}`;

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonStr = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error(`[predictions] AI prediction error for ${homeName} vs ${awayName}:`, (e as Error).message);
    return null;
  }
}

function fallbackPrediction(apiPrediction: any): AIPrediction {
  const pred = apiPrediction?.predictions;
  const teams = apiPrediction?.teams;

  // Parse win percentages
  const homePct = parseInt(pred?.percent?.home || '33');
  const drawPct = parseInt(pred?.percent?.draw || '33');
  const awayPct = parseInt(pred?.percent?.away || '33');

  let outcome: 'home' | 'draw' | 'away' = 'draw';
  if (homePct > drawPct && homePct > awayPct) outcome = 'home';
  else if (awayPct > drawPct && awayPct > homePct) outcome = 'away';

  // Parse expected goals
  const homeGoalsAvg = parseFloat(teams?.home?.last_5?.goals?.for?.average || '1.2');
  const awayGoalsAvg = parseFloat(teams?.away?.last_5?.goals?.for?.average || '1.0');
  const homeScore = Math.round(homeGoalsAvg);
  const awayScore = Math.round(awayGoalsAvg);

  // BTTS: if both teams average > 0.8 goals per game, likely BTTS
  const homeConcedeAvg = parseFloat(teams?.home?.last_5?.goals?.against?.average || '1.0');
  const awayConcedeAvg = parseFloat(teams?.away?.last_5?.goals?.against?.average || '1.0');
  const btts = homeGoalsAvg > 0.8 && awayGoalsAvg > 0.8;

  // Over/Under
  const totalExpected = homeGoalsAvg + awayGoalsAvg;
  const overUnder = 2.5;
  const overUnderPrediction = totalExpected > 2.3 ? 'over' : 'under';

  return {
    predictedOutcome: outcome,
    predictedHomeScore: homeScore,
    predictedAwayScore: awayScore,
    confidence: Math.max(homePct, drawPct, awayPct),
    btts,
    overUnder,
    overUnderPrediction: overUnderPrediction as 'over' | 'under',
    reasoning: pred?.advice || `Based on recent form and statistics`,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (secret !== CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[predictions] Starting prediction generation...');

    // Find matches kicking off in the next 48 hours that don't have predictions yet
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcomingMatches = await db
      .select({
        id: matches.id,
        apiFootballId: matches.apiFootballId,
        homeClubId: matches.homeClubId,
        awayClubId: matches.awayClubId,
        kickoff: matches.kickoff,
        status: matches.status,
        competitionSeasonId: matches.competitionSeasonId,
      })
      .from(matches)
      .where(
        and(
          eq(matches.status, 'scheduled'),
          gte(matches.kickoff, now),
          lte(matches.kickoff, in48h),
        )
      )
      .limit(50);

    console.log(`[predictions] Found ${upcomingMatches.length} upcoming matches in next 48h`);

    // Filter out matches that already have predictions
    const matchIds = upcomingMatches.map(m => m.id);
    const existingPredictions = matchIds.length > 0
      ? await db
          .select({ matchId: matchPredictions.matchId })
          .from(matchPredictions)
          .where(sql`${matchPredictions.matchId} IN (${sql.join(matchIds.map(id => sql`${id}::uuid`), sql`, `)})`)
      : [];

    const existingSet = new Set(existingPredictions.map(p => p.matchId));
    const needsPrediction = upcomingMatches.filter(m => !existingSet.has(m.id));

    console.log(`[predictions] ${needsPrediction.length} matches need predictions (${existingSet.size} already have them)`);

    let generated = 0;
    let skipped = 0;

    for (const match of needsPrediction) {
      try {
        // Get club names
        const [homeClub] = await db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, match.homeClubId)).limit(1);
        const [awayClub] = await db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, match.awayClubId)).limit(1);
        if (!homeClub || !awayClub) continue;

        // Get competition name
        let competitionName = '';
        if (match.competitionSeasonId) {
          const [cs] = await db.select({ competitionId: competitionSeasons.competitionId })
            .from(competitionSeasons).where(eq(competitionSeasons.id, match.competitionSeasonId)).limit(1);
          if (cs) {
            const [comp] = await db.select({ name: competitions.name })
              .from(competitions).where(eq(competitions.id, cs.competitionId)).limit(1);
            competitionName = comp?.name || '';
          }
        }

        // Only predict for worthy leagues
        if (competitionName && !isPredictionWorthy(competitionName)) {
          skipped++;
          continue;
        }

        // Fetch API-Football prediction data (1 API call)
        let apiPrediction: any = null;
        if (match.apiFootballId) {
          try {
            const res = await getFixturePredictions(match.apiFootballId);
            apiPrediction = res.response?.[0] || null;
          } catch (e) {
            console.error(`[predictions] API-Football error for ${homeClub.name} vs ${awayClub.name}:`, (e as Error).message);
          }
        }

        if (!apiPrediction) {
          console.log(`[predictions] No API data for ${homeClub.name} vs ${awayClub.name}, skipping`);
          continue;
        }

        // Generate AI-enhanced prediction (uses Claude Haiku — cheap)
        let prediction = await generateAIPrediction(
          homeClub.name,
          awayClub.name,
          competitionName,
          apiPrediction,
        );

        // Fallback to pure API-Football data if AI fails
        if (!prediction) {
          prediction = fallbackPrediction(apiPrediction);
        }

        // Store in DB
        await db.insert(matchPredictions).values({
          matchId: match.id,
          predictedOutcome: prediction.predictedOutcome,
          predictedHomeScore: prediction.predictedHomeScore,
          predictedAwayScore: prediction.predictedAwayScore,
          confidence: prediction.confidence,
          btts: prediction.btts,
          overUnder: String(prediction.overUnder),
          overUnderPrediction: prediction.overUnderPrediction,
          factors: {
            apiAdvice: apiPrediction.predictions?.advice,
            homeForm: apiPrediction.teams?.home?.last_5?.form,
            awayForm: apiPrediction.teams?.away?.last_5?.form,
            comparison: apiPrediction.comparison,
            reasoning: prediction.reasoning,
          },
        });

        generated++;
        console.log(`[predictions] Generated: ${homeClub.name} vs ${awayClub.name} → ${prediction.predictedOutcome} (${prediction.predictedHomeScore}-${prediction.predictedAwayScore}, BTTS: ${prediction.btts}, confidence: ${prediction.confidence}%)`);

        // Small delay between API calls to be respectful
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.error(`[predictions] Error for match ${match.id}:`, err);
      }
    }

    console.log(`[predictions] Complete: ${generated} generated, ${skipped} skipped (minor leagues), ${existingSet.size} already existed`);

    return NextResponse.json({
      message: 'Predictions generated',
      upcoming: upcomingMatches.length,
      generated,
      skipped,
      alreadyExisted: existingSet.size,
    });
  } catch (error) {
    console.error('[predictions] Fatal error:', error);
    return NextResponse.json({ error: 'Predictions failed', details: String(error) }, { status: 500 });
  }
}
