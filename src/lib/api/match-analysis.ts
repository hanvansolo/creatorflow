import Anthropic from '@anthropic-ai/sdk';
import { db, matchAnalysis, matchStats, matchEvents, matches, clubs, competitions, competitionSeasons } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

interface AnalysisResult {
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  expectedHomeScore: number;
  expectedAwayScore: number;
  confidence: number;
  keyInsight: string;
  momentum: 'home' | 'away' | 'neutral';
  analysis: string;
}

export async function generateMatchAnalysis(matchId: string, trigger: string): Promise<void> {
  // Skip silently if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[match-analysis] ANTHROPIC_API_KEY not set, skipping analysis');
    return;
  }

  try {
    // 1. Fetch match details with team names
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      console.error(`[match-analysis] Match ${matchId} not found`);
      return;
    }

    const [homeClub] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, match.homeClubId))
      .limit(1);

    const [awayClub] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, match.awayClubId))
      .limit(1);

    // Get competition name
    let competitionName = 'Unknown Competition';
    if (match.competitionSeasonId) {
      const [compSeason] = await db
        .select()
        .from(competitionSeasons)
        .where(eq(competitionSeasons.id, match.competitionSeasonId))
        .limit(1);

      if (compSeason) {
        const [comp] = await db
          .select()
          .from(competitions)
          .where(eq(competitions.id, compSeason.competitionId))
          .limit(1);
        if (comp) competitionName = comp.name;
      }
    }

    // 2. Fetch match stats for both teams
    const stats = await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.matchId, matchId));

    const homeStats = stats.find((s) => s.clubId === match.homeClubId);
    const awayStats = stats.find((s) => s.clubId === match.awayClubId);

    // 3. Fetch all match events
    const events = await db
      .select()
      .from(matchEvents)
      .where(eq(matchEvents.matchId, matchId))
      .orderBy(matchEvents.minute);

    // Resolve event player/club names for the prompt
    const eventDescriptions: string[] = [];
    for (const event of events) {
      let clubName = '';
      if (event.clubId) {
        if (event.clubId === match.homeClubId) clubName = homeClub?.name || '';
        else if (event.clubId === match.awayClubId) clubName = awayClub?.name || '';
      }

      const timeStr = event.addedTime
        ? `${event.minute}+${event.addedTime}'`
        : `${event.minute}'`;

      eventDescriptions.push(
        `${timeStr} - ${event.eventType.replace(/_/g, ' ')}${clubName ? ` (${clubName})` : ''}${event.description ? `: ${event.description}` : ''}`
      );
    }

    // 4. Build the Claude prompt
    const formatStats = (s: typeof homeStats) => {
      if (!s) return 'No stats available';
      return `${s.possession ?? '?'}% possession, ${s.shotsTotal ?? 0} shots (${s.shotsOnTarget ?? 0} on target), ${s.corners ?? 0} corners, xG: ${s.expectedGoals ?? '?'}`;
    };

    const prompt = `You are a football analyst providing live match predictions.

Match: ${homeClub?.name || 'Home'} vs ${awayClub?.name || 'Away'}
Competition: ${competitionName}
Current Score: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}
Minute: ${match.minute ?? '?'}'
Status: ${match.status}

Match Events:
${eventDescriptions.length > 0 ? eventDescriptions.join('\n') : 'No events yet'}

Match Statistics:
Home: ${formatStats(homeStats)}
Away: ${formatStats(awayStats)}

Triggered by: ${trigger.replace(/_/g, ' ')}

Respond in JSON format only, no markdown or code blocks:
{
  "homeWinPct": 65,
  "drawPct": 20,
  "awayWinPct": 15,
  "expectedHomeScore": 2,
  "expectedAwayScore": 1,
  "confidence": 75,
  "keyInsight": "One line key insight about the match",
  "momentum": "home",
  "analysis": "Two-three sentence tactical analysis..."
}`;

    // 5. Call Claude
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse the response
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let result: AnalysisResult;
    try {
      // Strip any markdown code blocks if present
      const jsonStr = responseText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[match-analysis] Failed to parse Claude response:', responseText);
      return;
    }

    // Validate momentum value
    const validMomentum = ['home', 'away', 'neutral'];
    const momentum = validMomentum.includes(result.momentum) ? result.momentum : 'neutral';

    // 6. Store in matchAnalysis table
    await db.insert(matchAnalysis).values({
      matchId,
      analysisType: 'prediction',
      minute: match.minute,
      title: `${homeClub?.name || 'Home'} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${awayClub?.name || 'Away'} (${match.minute}')`,
      content: result.analysis,
      prediction: {
        homeWinPct: result.homeWinPct,
        drawPct: result.drawPct,
        awayWinPct: result.awayWinPct,
        expectedHomeScore: result.expectedHomeScore,
        expectedAwayScore: result.expectedAwayScore,
        confidence: result.confidence,
      },
      momentum,
      keyInsight: result.keyInsight,
      triggeredBy: trigger,
    });

    console.log(
      `[match-analysis] Analysis generated for ${homeClub?.name} vs ${awayClub?.name} (${match.minute}') triggered by ${trigger}`
    );
  } catch (error) {
    console.error(`[match-analysis] Error generating analysis for match ${matchId}:`, error);
    throw error;
  }
}
