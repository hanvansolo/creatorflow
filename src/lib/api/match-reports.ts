// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import {
  db,
  matches,
  matchEvents,
  matchStats,
  matchAnalysis,
  clubs,
  competitions,
  competitionSeasons,
  newsArticles,
  newsSources,
  players,
} from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

/**
 * Get or create the "Footy Feed Match Reports" news source.
 */
async function getMatchReportSource(): Promise<string> {
  const [existing] = await db
    .select()
    .from(newsSources)
    .where(eq(newsSources.slug, 'footyfeed-match-reports'))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(newsSources)
    .values({
      name: 'Footy Feed',
      slug: 'footyfeed-match-reports',
      type: 'match-report',
      url: SITE_URL,
      isActive: true,
      priority: 10,
    })
    .returning();

  return created.id;
}

/**
 * Try to find a match image by scraping news sites for OG images.
 * Falls back to our own OG match image generator.
 */
async function findMatchImage(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  competition: string,
  homeLogo?: string | null,
  awayLogo?: string | null
): Promise<string | null> {
  // Try scraping BBC Sport, Sky Sports, The Guardian for an og:image
  const searchTerms = `${homeTeam} vs ${awayTeam}`;
  const sites = [
    `https://www.bbc.co.uk/search?q=${encodeURIComponent(searchTerms)}&filter=sport`,
    `https://www.skysports.com/search?q=${encodeURIComponent(searchTerms)}`,
    `https://www.theguardian.com/football?q=${encodeURIComponent(searchTerms)}`,
  ];

  for (const siteUrl of sites) {
    try {
      const res = await fetch(siteUrl, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FootyFeed/1.0)',
        },
      });
      if (!res.ok) continue;

      const html = await res.text();
      // Look for og:image in the HTML
      const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
        || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

      if (ogMatch?.[1]) {
        const imgUrl = ogMatch[1];
        // Validate it looks like a real image URL
        if (imgUrl.startsWith('http') && (imgUrl.includes('.jpg') || imgUrl.includes('.png') || imgUrl.includes('.webp') || imgUrl.includes('image'))) {
          console.log(`[match-report] Found image from ${new URL(siteUrl).hostname}: ${imgUrl}`);
          return imgUrl;
        }
      }
    } catch {
      // Timeout or network error — try next site
    }
  }

  // Fallback: Use our own OG match image with the final score
  const ogParams = new URLSearchParams({
    home: homeTeam,
    away: awayTeam,
    comp: competition,
    homeScore: String(homeScore),
    awayScore: String(awayScore),
    status: 'FT',
    ...(homeLogo ? { homeLogo } : {}),
    ...(awayLogo ? { awayLogo } : {}),
  });

  return `${SITE_URL}/api/og/match?${ogParams.toString()}`;
}

/**
 * Generate a post-match report article from match data.
 * Fetches match details, events, stats, and AI analysis from DB,
 * uses Claude to write a professional match report, and saves it as a news article.
 */
export async function generateMatchReport(
  matchId: string
): Promise<{ success: boolean; articleId?: string; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: 'ANTHROPIC_API_KEY not set' };
  }

  try {
    // 1. Fetch the match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return { success: false, error: `Match ${matchId} not found` };
    }

    // 2. Fetch teams
    const [homeClub] = await db.select().from(clubs).where(eq(clubs.id, match.homeClubId)).limit(1);
    const [awayClub] = await db.select().from(clubs).where(eq(clubs.id, match.awayClubId)).limit(1);

    if (!homeClub || !awayClub) {
      return { success: false, error: 'Could not find clubs for match' };
    }

    // 3. Build the slug and check for duplicates
    const dateStr = match.kickoff.toISOString().split('T')[0];
    const homeSlug = homeClub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const awaySlug = awayClub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const articleSlug = `${dateStr}-${homeSlug}-vs-${awaySlug}-match-report`;

    // Check if article already exists
    const [existingArticle] = await db
      .select({ id: newsArticles.id })
      .from(newsArticles)
      .where(eq(newsArticles.slug, articleSlug))
      .limit(1);

    if (existingArticle) {
      console.log(`[match-report] Article already exists for ${articleSlug}`);
      return { success: true, articleId: existingArticle.id };
    }

    // 4. Fetch events with player names
    const events = await db
      .select({
        eventType: matchEvents.eventType,
        minute: matchEvents.minute,
        addedTime: matchEvents.addedTime,
        description: matchEvents.description,
        clubId: matchEvents.clubId,
        playerId: matchEvents.playerId,
        secondPlayerId: matchEvents.secondPlayerId,
      })
      .from(matchEvents)
      .where(eq(matchEvents.matchId, matchId))
      .orderBy(matchEvents.minute);

    // 5. Check if there's enough data
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const hasEnoughData = events.length >= 2 || (homeScore + awayScore) > 0;

    if (!hasEnoughData) {
      return { success: false, error: 'Not enough match data for a report (0-0 with < 2 events)' };
    }

    // 6. Fetch stats
    const stats = await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.matchId, matchId));

    const homeStats = stats.find(s => s.clubId === homeClub.id);
    const awayStats = stats.find(s => s.clubId === awayClub.id);

    // 7. Fetch AI analysis generated during the match
    const analyses = await db
      .select({
        analysisType: matchAnalysis.analysisType,
        content: matchAnalysis.content,
        keyInsight: matchAnalysis.keyInsight,
        prediction: matchAnalysis.prediction,
        momentum: matchAnalysis.momentum,
      })
      .from(matchAnalysis)
      .where(eq(matchAnalysis.matchId, matchId))
      .orderBy(desc(matchAnalysis.createdAt))
      .limit(5);

    // 8. Get competition name
    let competitionName = 'Football Match';
    if (match.competitionSeasonId) {
      const [compSeason] = await db
        .select({ compId: competitionSeasons.competitionId })
        .from(competitionSeasons)
        .where(eq(competitionSeasons.id, match.competitionSeasonId))
        .limit(1);

      if (compSeason) {
        const [comp] = await db
          .select({ name: competitions.name })
          .from(competitions)
          .where(eq(competitions.id, compSeason.compId))
          .limit(1);
        if (comp) competitionName = comp.name;
      }
    }

    // 9. Resolve player names for events
    const playerIds = new Set<string>();
    for (const e of events) {
      if (e.playerId) playerIds.add(e.playerId);
      if (e.secondPlayerId) playerIds.add(e.secondPlayerId);
    }

    const playerMap = new Map<string, string>();
    if (playerIds.size > 0) {
      const playerRows = await db
        .select({ id: players.id, firstName: players.firstName, lastName: players.lastName, knownAs: players.knownAs })
        .from(players)
        .where(sql`${players.id} IN (${sql.join([...playerIds].map(id => sql`${id}::uuid`), sql`, `)})`);

      for (const p of playerRows) {
        playerMap.set(p.id, p.knownAs || `${p.firstName} ${p.lastName}`);
      }
    }

    // 10. Build event descriptions for the prompt
    const eventDescriptions = events.map(e => {
      const playerName = e.playerId ? (playerMap.get(e.playerId) || 'Unknown Player') : '';
      const secondPlayerName = e.secondPlayerId ? (playerMap.get(e.secondPlayerId) || '') : '';
      const team = e.clubId === homeClub.id ? homeClub.name : (e.clubId === awayClub.id ? awayClub.name : '');
      const timeStr = e.addedTime ? `${e.minute}+${e.addedTime}'` : `${e.minute}'`;

      switch (e.eventType) {
        case 'goal':
          return `${timeStr} - GOAL: ${playerName} (${team})${secondPlayerName ? ` assist: ${secondPlayerName}` : ''}`;
        case 'own_goal':
          return `${timeStr} - OWN GOAL: ${playerName} (${team})`;
        case 'penalty_scored':
          return `${timeStr} - PENALTY SCORED: ${playerName} (${team})`;
        case 'penalty_missed':
          return `${timeStr} - PENALTY MISSED: ${playerName} (${team})`;
        case 'yellow_card':
          return `${timeStr} - YELLOW CARD: ${playerName} (${team})`;
        case 'second_yellow':
          return `${timeStr} - SECOND YELLOW (RED): ${playerName} (${team})`;
        case 'red_card':
          return `${timeStr} - RED CARD: ${playerName} (${team})`;
        case 'substitution':
          return `${timeStr} - SUBSTITUTION (${team}): ${playerName} on for ${secondPlayerName}`;
        case 'var_decision':
          return `${timeStr} - VAR: ${e.description || 'Decision reviewed'}`;
        default:
          return `${timeStr} - ${e.eventType}: ${playerName} (${team}) ${e.description || ''}`;
      }
    }).join('\n');

    // 11. Build stats summary for the prompt
    const statsSummary = homeStats && awayStats ? `
MATCH STATISTICS:
                    ${homeClub.name}  |  ${awayClub.name}
Possession:         ${homeStats.possession ?? '-'}%  |  ${awayStats.possession ?? '-'}%
Shots (Total):      ${homeStats.shotsTotal ?? '-'}  |  ${awayStats.shotsTotal ?? '-'}
Shots (On Target):  ${homeStats.shotsOnTarget ?? '-'}  |  ${awayStats.shotsOnTarget ?? '-'}
Corners:            ${homeStats.corners ?? '-'}  |  ${awayStats.corners ?? '-'}
Fouls:              ${homeStats.fouls ?? '-'}  |  ${awayStats.fouls ?? '-'}
Pass Accuracy:      ${homeStats.passAccuracy ?? '-'}%  |  ${awayStats.passAccuracy ?? '-'}%
xG:                 ${homeStats.expectedGoals ?? '-'}  |  ${awayStats.expectedGoals ?? '-'}
Saves:              ${homeStats.saves ?? '-'}  |  ${awayStats.saves ?? '-'}
` : 'No detailed statistics available.';

    // 12. Build AI analysis context
    const analysisContext = analyses.length > 0
      ? analyses.map(a => `[${a.analysisType}] ${a.keyInsight || ''}: ${a.content?.slice(0, 300) || ''}`).join('\n')
      : 'No AI analysis was generated during the match.';

    // 13. Generate the match report with Claude
    const prompt = `You are a senior football journalist writing a post-match report for FootyFeed. Write a professional, engaging match report in the style of BBC Sport or The Guardian.

MATCH DETAILS:
- Competition: ${competitionName}
- ${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name}
- Date: ${dateStr}
- Round: ${match.round || 'N/A'}
- Half-time: ${match.homeScoreHt ?? '?'} - ${match.awayScoreHt ?? '?'}
${match.referee ? `- Referee: ${match.referee}` : ''}
${match.attendance ? `- Attendance: ${match.attendance.toLocaleString()}` : ''}

MATCH EVENTS:
${eventDescriptions || 'No detailed events available.'}

${statsSummary}

AI ANALYSIS DURING MATCH:
${analysisContext}

REQUIREMENTS:
1. TITLE: A punchy, newspaper-style headline (UNDER 48 characters). Do NOT include the score in the title — use a creative angle about the key moment/narrative.
2. SUMMARY: 2-3 sentences capturing the match outcome, key moments, and significance.
3. FULL REPORT: 400-800 words. Structure:
   - Opening paragraph: The result and its significance
   - Key moments: Goals described vividly with context
   - Tactical observations: How the teams played
   - Stats and analysis: Notable statistical takeaways
   - What this means: League/tournament implications
   - Closing thought: Looking ahead
4. Write in third person, past tense, factual and engaging.
5. Do NOT fabricate any facts not present in the data above.
6. Do NOT mention being AI-generated.
7. If a player scored multiple goals, highlight it as a brace or hat-trick.
8. Use markdown formatting (## for sections, **bold** for emphasis).

Respond in this exact format:

---TITLE---
Your headline here
---SUMMARY---
Your 2-3 sentence summary here
---REPORT---
Your full 400-800 word report here`;

    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';

    const titleMatch = responseText.match(/---TITLE---\s*([\s\S]*?)---SUMMARY---/);
    const summaryMatch = responseText.match(/---SUMMARY---\s*([\s\S]*?)---REPORT---/);
    const reportMatch = responseText.match(/---REPORT---\s*([\s\S]*?)$/);

    if (!titleMatch || !summaryMatch || !reportMatch) {
      console.error('[match-report] Could not parse Claude response');
      return { success: false, error: 'Failed to parse AI response' };
    }

    const title = titleMatch[1].trim();
    const summary = summaryMatch[1].trim();
    const report = reportMatch[1].trim();

    // 14. Find an image for the article
    const imageUrl = await findMatchImage(
      homeClub.name,
      awayClub.name,
      homeScore,
      awayScore,
      competitionName,
      homeClub.logoUrl,
      awayClub.logoUrl
    );

    // 15. Save as a news article
    const sourceId = await getMatchReportSource();
    const externalId = `match-report-${matchId}`;

    const [article] = await db
      .insert(newsArticles)
      .values({
        sourceId,
        externalId,
        title,
        slug: articleSlug,
        summary,
        content: report,
        author: 'Footy Feed',
        imageUrl,
        originalUrl: `${SITE_URL}/news/${articleSlug}`,
        publishedAt: new Date(),
        credibilityRating: 'verified',
        tags: ['Match Report', competitionName, homeClub.name, awayClub.name],
      })
      .returning();

    // 16. Mark match as report generated
    try {
      await db.execute(
        sql`UPDATE matches SET match_report_generated = TRUE WHERE id = ${matchId}::uuid`
      );
    } catch {
      // Column may not exist yet — that's OK, the slug check prevents duplicates
      console.log('[match-report] Could not set match_report_generated flag (column may not exist)');
    }

    console.log(`[match-report] Generated report: "${title}" (${article.id})`);
    return { success: true, articleId: article.id };
  } catch (error) {
    console.error('[match-report] Error generating report:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if a match is "reportworthy" — should we generate a full report for it?
 * Stricter than tweetworthy. Only major leagues + high-scoring outliers.
 */
export function isReportworthy(
  competitionName: string,
  homeScore: number,
  awayScore: number,
  homeTeam?: string,
  awayTeam?: string
): boolean {
  const totalGoals = homeScore + awayScore;

  // Always generate for high-scoring matches regardless of league
  if (totalGoals >= 4) return true;

  // Major leagues and cups
  const REPORTWORTHY_COMPETITIONS = new Set([
    // English football
    'Premier League', 'Championship', 'League One', 'League Two',
    'FA Cup', 'EFL Cup', 'Carabao Cup',
    // Top European leagues
    'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    // European cups
    'Champions League', 'Europa League', 'Conference League',
    // International
    'World Cup', 'European Championship', 'Copa America',
    'Nations League', 'AFCON',
    // Scottish
    'Scottish Premiership',
  ]);

  if (REPORTWORTHY_COMPETITIONS.has(competitionName)) return true;

  // Partial matches for competition names with qualifiers etc.
  const PARTIAL_REPORTWORTHY = [
    'Champions League', 'Europa League', 'Conference League',
    'World Cup', 'Euro', 'Nations League', 'AFCON',
    'FA Cup', 'EFL Cup', 'Carabao Cup',
  ];

  for (const partial of PARTIAL_REPORTWORTHY) {
    if (competitionName.includes(partial)) return true;
  }

  // Top nation friendlies
  const TOP_NATIONS = new Set([
    'England', 'Scotland', 'Wales', 'Northern Ireland', 'Republic of Ireland',
    'France', 'Germany', 'Spain', 'Italy', 'Brazil', 'Argentina',
    'Portugal', 'Netherlands', 'Belgium', 'Uruguay', 'Colombia', 'Mexico',
    'USA', 'Japan', 'South Korea', 'Morocco', 'Senegal', 'Nigeria',
    'Australia', 'Croatia', 'Denmark', 'Switzerland', 'Poland', 'Turkey',
  ]);

  if (competitionName.includes('Friendl') && homeTeam && awayTeam) {
    if (TOP_NATIONS.has(homeTeam) || TOP_NATIONS.has(awayTeam)) return true;
  }

  return false;
}

/**
 * Check if a match report should be posted on social media.
 * Even stricter — only the biggest matches.
 */
export function isSocialPostworthy(competitionName: string): boolean {
  const SOCIAL_COMPETITIONS = new Set([
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'Conference League',
    'FA Cup', 'EFL Cup', 'Carabao Cup',
    'World Cup', 'European Championship', 'Copa America', 'Nations League',
    'Scottish Premiership',
  ]);

  if (SOCIAL_COMPETITIONS.has(competitionName)) return true;

  const PARTIAL_SOCIAL = [
    'Champions League', 'Europa League', 'Conference League',
    'World Cup', 'Euro', 'Nations League',
  ];

  for (const partial of PARTIAL_SOCIAL) {
    if (competitionName.includes(partial)) return true;
  }

  return false;
}
