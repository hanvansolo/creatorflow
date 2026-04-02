// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import {
  db,
  matches,
  matchEvents,
  matchStats,
  clubs,
  players,
  competitions,
  competitionSeasons,
} from '@/lib/db';
import {
  getLiveFixtures,
  getFixtureEvents,
  getFixtureStatistics,
  mapFixtureStatus,
  mapEventType,
} from '@/lib/api/football-api';
import { generateMatchAnalysis } from '@/lib/api/match-analysis';
import { postCustomTweet } from '@/lib/social/twitter';
import { postCustomFacebook } from '@/lib/social/facebook';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

const SIGNIFICANT_EVENTS = new Set(['goal', 'own_goal', 'penalty_scored', 'red_card', 'var_decision']);

function parseStatValue(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  // Handle percentage strings like "55%"
  const parsed = parseInt(String(value).replace('%', ''), 10);
  return isNaN(parsed) ? null : parsed;
}

function parseDecimalStat(value: number | string | null): string | null {
  if (value === null || value === undefined) return null;
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num.toFixed(2);
}

function getStatValue(
  statistics: Array<{ type: string; value: number | string | null }>,
  type: string
): number | string | null {
  const stat = statistics.find((s) => s.type === type);
  return stat?.value ?? null;
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
    console.log('[live-sync] Starting live match sync...');

    // 1. Get all currently live matches from API-Football
    const liveResponse = await getLiveFixtures();
    const liveFixtures = liveResponse.response;

    // Clean up stale "live" matches in our DB — if API says no live matches,
    // any match in our DB still marked as live that kicked off 3+ hours ago is finished
    const { inArray } = await import('drizzle-orm');
    const liveStatuses = ['live', 'halftime', 'extra_time', 'penalties'];
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    await db.execute(sql`
      UPDATE matches SET status = 'finished'
      WHERE status IN ('live', 'halftime', 'extra_time', 'penalties')
      AND kickoff < ${threeHoursAgo.toISOString()}
    `);

    if (!liveFixtures || liveFixtures.length === 0) {
      console.log('[live-sync] No live matches found');
      return NextResponse.json({ message: 'No live matches', updated: 0, staleCleanup: true });
    }

    console.log(`[live-sync] Found ${liveFixtures.length} live matches`);

    const matchesNeedingAnalysis: Array<{ matchId: string; trigger: string }> = [];
    const kickoffTweets: Array<{ home: string; away: string; competition: string; matchId: string; homeLogo?: string; awayLogo?: string }> = [];
    let updatedCount = 0;

    for (const fixture of liveFixtures) {
      try {
        const apiFixtureId = fixture.fixture.id;

        // Find the match in our database by API-Football ID
        const [existingMatch] = await db
          .select()
          .from(matches)
          .where(eq(matches.apiFootballId, apiFixtureId))
          .limit(1);

        let matchId: string;

        if (!existingMatch) {
          // Match not in DB — create it from the live fixture data
          try {
            // Find home and away clubs by API ID — auto-create if missing
            let [homeClub] = await db.select().from(clubs).where(eq(clubs.apiFootballId, fixture.teams.home.id)).limit(1);
            let [awayClub] = await db.select().from(clubs).where(eq(clubs.apiFootballId, fixture.teams.away.id)).limit(1);

            // Auto-create clubs that don't exist yet
            if (!homeClub) {
              try {
                const t = fixture.teams.home;
                const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const [created] = await db.insert(clubs).values({
                  name: t.name,
                  slug,
                  logoUrl: t.logo,
                  apiFootballId: t.id,
                  country: fixture.league.country || null,
                }).returning();
                homeClub = created;
                console.log(`[live-sync] Auto-created club: ${t.name}`);
              } catch { /* slug conflict — try to find by name */
                [homeClub] = await db.select().from(clubs).where(eq(clubs.name, fixture.teams.home.name)).limit(1);
              }
            }
            if (!awayClub) {
              try {
                const t = fixture.teams.away;
                const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const [created] = await db.insert(clubs).values({
                  name: t.name,
                  slug,
                  logoUrl: t.logo,
                  apiFootballId: t.id,
                  country: fixture.league.country || null,
                }).returning();
                awayClub = created;
                console.log(`[live-sync] Auto-created club: ${t.name}`);
              } catch {
                [awayClub] = await db.select().from(clubs).where(eq(clubs.name, fixture.teams.away.name)).limit(1);
              }
            }

            if (!homeClub || !awayClub) {
              console.log(`[live-sync] Could not create clubs for fixture ${apiFixtureId}, skipping`);
              continue;
            }

            const slug = `${homeClub.slug}-vs-${awayClub.slug}-${new Date(fixture.fixture.date).toISOString().split('T')[0]}`;
            const [inserted] = await db.insert(matches).values({
              apiFootballId: apiFixtureId,
              homeClubId: homeClub.id,
              awayClubId: awayClub.id,
              kickoff: new Date(fixture.fixture.date),
              status: mapFixtureStatus(fixture.fixture.status.short),
              minute: fixture.fixture.status.elapsed,
              homeScore: fixture.goals.home,
              awayScore: fixture.goals.away,
              homeScoreHt: fixture.score.halftime.home,
              awayScoreHt: fixture.score.halftime.away,
              referee: fixture.fixture.referee,
              slug,
              round: fixture.league.round,
            }).returning({ id: matches.id });

            matchId = inserted.id;
            console.log(`[live-sync] Created new match: ${homeClub.name} vs ${awayClub.name} (${apiFixtureId})`);

            // New live match = kickoff just happened — queue tweet
            kickoffTweets.push({
              home: homeClub.name,
              away: awayClub.name,
              competition: fixture.league.name || '',
              matchId,
              homeLogo: homeClub.logoUrl || undefined,
              awayLogo: awayClub.logoUrl || undefined,
            });
          } catch (insertErr) {
            console.error(`[live-sync] Failed to create match ${apiFixtureId}:`, insertErr);
            continue;
          }
        } else {
          matchId = existingMatch.id;

          // Detect kickoff: was scheduled, now live
          if (existingMatch.status === 'scheduled' && fixture.fixture.status.elapsed !== null && fixture.fixture.status.elapsed <= 5) {
            // Find club names for the tweet
            const [hc] = await db.select({ name: clubs.name, logoUrl: clubs.logoUrl }).from(clubs).where(eq(clubs.id, existingMatch.homeClubId)).limit(1);
            const [ac] = await db.select({ name: clubs.name, logoUrl: clubs.logoUrl }).from(clubs).where(eq(clubs.id, existingMatch.awayClubId)).limit(1);
            if (hc && ac) {
              kickoffTweets.push({
                home: hc.name,
                away: ac.name,
                competition: fixture.league.name || '',
                matchId,
                homeLogo: hc.logoUrl || undefined,
                awayLogo: ac.logoUrl || undefined,
              });
            }
          }
        }

        // 2a. Update match record (score, minute, status)
        const newStatus = mapFixtureStatus(fixture.fixture.status.short);
        await db
          .update(matches)
          .set({
            status: newStatus,
            minute: fixture.fixture.status.elapsed,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            homeScoreHt: fixture.score.halftime.home,
            awayScoreHt: fixture.score.halftime.away,
            homeScoreEt: fixture.score.extratime.home,
            awayScoreEt: fixture.score.extratime.away,
            homePenalties: fixture.score.penalty.home,
            awayPenalties: fixture.score.penalty.away,
            updatedAt: new Date(),
          })
          .where(eq(matches.id, matchId));

        updatedCount++;

        // 2b. Get and upsert match events
        // First, count existing events to detect new significant events
        const existingEvents = await db
          .select()
          .from(matchEvents)
          .where(eq(matchEvents.matchId, matchId));

        const existingEventCount = existingEvents.length;
        const existingSignificantCount = existingEvents.filter(
          (e) => SIGNIFICANT_EVENTS.has(e.eventType)
        ).length;

        const eventsResponse = await getFixtureEvents(apiFixtureId);
        const apiEvents = eventsResponse.response || [];

        for (const event of apiEvents) {
          const eventType = mapEventType(event.type, event.detail);
          const minute = event.time.elapsed;
          const addedTime = event.time.extra;

          // Find club by API-Football team ID
          let clubId: string | null = null;
          if (event.team?.id) {
            const [club] = await db
              .select({ id: clubs.id })
              .from(clubs)
              .where(eq(clubs.apiFootballId, event.team.id))
              .limit(1);
            clubId = club?.id || null;
          }

          // Find player by API-Football player ID
          let playerId: string | null = null;
          if (event.player?.id) {
            const [player] = await db
              .select({ id: players.id })
              .from(players)
              .where(eq(players.apiFootballId, event.player.id))
              .limit(1);
            playerId = player?.id || null;
          }

          // Find assist/second player by API-Football ID
          let secondPlayerId: string | null = null;
          if (event.assist?.id) {
            const [assistPlayer] = await db
              .select({ id: players.id })
              .from(players)
              .where(eq(players.apiFootballId, event.assist.id))
              .limit(1);
            secondPlayerId = assistPlayer?.id || null;
          }

          // Build description
          const description = [event.detail, event.comments].filter(Boolean).join(' - ');

          // Upsert: match on matchId + minute + eventType + playerId to avoid duplicates
          // Since there's no unique constraint for this combo, check existence first
          const existingEventMatch = existingEvents.find(
            (e) =>
              e.minute === minute &&
              e.eventType === eventType &&
              e.playerId === playerId &&
              e.addedTime === addedTime
          );

          if (existingEventMatch) {
            // Update existing event
            await db
              .update(matchEvents)
              .set({
                clubId,
                secondPlayerId,
                description: description || null,
              })
              .where(eq(matchEvents.id, existingEventMatch.id));
          } else {
            // Insert new event
            await db.insert(matchEvents).values({
              matchId,
              eventType,
              minute,
              addedTime,
              playerId,
              secondPlayerId,
              clubId,
              description: description || null,
            });
          }
        }

        // 2c. Get and upsert match statistics
        const statsResponse = await getFixtureStatistics(apiFixtureId);
        const apiStats = statsResponse.response || [];

        for (const teamStats of apiStats) {
          if (!teamStats.team?.id || !teamStats.statistics) continue;

          // Find club by API-Football team ID
          const [club] = await db
            .select({ id: clubs.id })
            .from(clubs)
            .where(eq(clubs.apiFootballId, teamStats.team.id))
            .limit(1);

          if (!club) continue;

          const stats = teamStats.statistics;
          const statValues = {
            possession: parseStatValue(getStatValue(stats, 'Ball Possession')),
            shotsTotal: parseStatValue(getStatValue(stats, 'Total Shots')),
            shotsOnTarget: parseStatValue(getStatValue(stats, 'Shots on Goal')),
            shotsOffTarget: parseStatValue(getStatValue(stats, 'Shots off Goal')),
            corners: parseStatValue(getStatValue(stats, 'Corner Kicks')),
            fouls: parseStatValue(getStatValue(stats, 'Fouls')),
            offsides: parseStatValue(getStatValue(stats, 'Offsides')),
            yellowCards: parseStatValue(getStatValue(stats, 'Yellow Cards')),
            redCards: parseStatValue(getStatValue(stats, 'Red Cards')),
            saves: parseStatValue(getStatValue(stats, 'Goalkeeper Saves')),
            passesTotal: parseStatValue(getStatValue(stats, 'Total passes')),
            passesAccurate: parseStatValue(getStatValue(stats, 'Passes accurate')),
            passAccuracy: parseStatValue(getStatValue(stats, 'Passes %')),
            expectedGoals: parseDecimalStat(getStatValue(stats, 'expected_goals')),
            updatedAt: new Date(),
          };

          // Upsert: matchStats has a unique index on (matchId, clubId)
          await db
            .insert(matchStats)
            .values({
              matchId,
              clubId: club.id,
              ...statValues,
            })
            .onConflictDoUpdate({
              target: [matchStats.matchId, matchStats.clubId],
              set: statValues,
            });
        }

        // 3. Check if new significant events happened since last run
        const updatedEvents = await db
          .select()
          .from(matchEvents)
          .where(eq(matchEvents.matchId, matchId));

        const newSignificantCount = updatedEvents.filter(
          (e) => SIGNIFICANT_EVENTS.has(e.eventType)
        ).length;

        if (newSignificantCount > existingSignificantCount) {
          // Find the most recent significant event type for the trigger
          const newSignificantEvents = updatedEvents
            .filter((e) => SIGNIFICANT_EVENTS.has(e.eventType))
            .sort((a, b) => (b.minute || 0) - (a.minute || 0));

          const trigger = newSignificantEvents[0]?.eventType || 'goal';
          matchesNeedingAnalysis.push({ matchId, trigger });
        }
      } catch (err) {
        console.error(`[live-sync] Error processing fixture ${fixture.fixture.id}:`, err);
        // Continue with next fixture
      }
    }

    // 4. Generate AI analysis for matches with significant events
    let analysisCount = 0;
    for (const { matchId, trigger } of matchesNeedingAnalysis) {
      try {
        await generateMatchAnalysis(matchId, trigger);
        analysisCount++;
      } catch (err) {
        console.error(`[live-sync] Error generating analysis for match ${matchId}:`, err);
      }
    }

    // Send kickoff tweets — ONLY for notable leagues
    // Don't spam followers with every minor league match
    const TWEETWORTHY_LEAGUES = new Set([
      'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
      'Champions League', 'Europa League', 'Conference League',
      'FA Cup', 'EFL Cup', 'Copa del Rey', 'Coppa Italia', 'DFB-Pokal', 'Coupe de France',
      'Eredivisie', 'Primeira Liga', 'Championship', 'Scottish Premiership',
      'MLS', 'Liga MX', 'Brasileirão',
      'World Cup', 'European Championship', 'Copa America', 'Nations League',
      'AFCON', 'Asian Cup',
      'WC Qualifiers - Europe', 'WC Qualifiers - Intercontinental',
      'AFCON Qualifiers',
      'International Friendlies', // Major international friendlies (England, Brazil, etc.)
    ]);

    // For friendlies, only tweet if it involves a top nation
    const TOP_NATIONS = new Set([
      'England', 'France', 'Germany', 'Spain', 'Italy', 'Brazil', 'Argentina',
      'Portugal', 'Netherlands', 'Belgium', 'Uruguay', 'Colombia', 'Mexico',
      'USA', 'Japan', 'South Korea', 'Morocco', 'Senegal', 'Nigeria',
    ]);

    let tweetsSent = 0;
    for (const kick of kickoffTweets) {
      // Check if this match is tweetworthy
      const isTweetworthy = TWEETWORTHY_LEAGUES.has(kick.competition);
      const isFriendly = kick.competition === 'International Friendlies' || kick.competition === 'Friendlies';
      const involvesTopNation = isFriendly && (TOP_NATIONS.has(kick.home) || TOP_NATIONS.has(kick.away));

      if (!isTweetworthy && !involvesTopNation) {
        console.log(`[live-sync] Skipping tweet for minor match: ${kick.home} vs ${kick.away} (${kick.competition})`);
        continue;
      }

      try {
        const homeTag = kick.home.replace(/[^a-zA-Z0-9]/g, '');
        const awayTag = kick.away.replace(/[^a-zA-Z0-9]/g, '');
        const compTag = kick.competition.replace(/[^a-zA-Z0-9]/g, '');
        const matchUrl = `https://www.footy-feed.com/matches/${kick.matchId}`;

        // Generate OG match image URL with team logos
        const ogParams = new URLSearchParams({
          home: kick.home,
          away: kick.away,
          comp: kick.competition,
          status: 'live',
          ...(kick.homeLogo ? { homeLogo: kick.homeLogo } : {}),
          ...(kick.awayLogo ? { awayLogo: kick.awayLogo } : {}),
        });
        const ogImageUrl = `https://www.footy-feed.com/api/og/match?${ogParams.toString()}`;

        const tweet = `⚽ KICK OFF! ${kick.home} vs ${kick.away} is underway!\n\nLive scores, stats & match feed 👇\n${matchUrl}\n\n#${homeTag} #${awayTag} #${compTag} #Football`;

        // Post to X and Facebook in parallel (Facebook gets the OG image)
        const [tweetResult, fbResult] = await Promise.allSettled([
          postCustomTweet(tweet),
          postCustomFacebook(
            `⚽ KICK OFF! ${kick.home} vs ${kick.away} is underway!\n\nLive scores, stats & match feed 👇\n\n#${homeTag} #${awayTag} #${compTag} #Football`,
            matchUrl,
            ogImageUrl
          ),
        ]);

        if (tweetResult.status === 'fulfilled' && tweetResult.value.success) {
          tweetsSent++;
          console.log(`[live-sync] Kickoff tweet sent: ${kick.home} vs ${kick.away}`);
        }
        if (fbResult.status === 'fulfilled' && fbResult.value.success) {
          console.log(`[live-sync] Kickoff FB post sent: ${kick.home} vs ${kick.away}`);
        }
      } catch (err) {
        console.error(`[live-sync] Kickoff tweet error:`, err);
      }
    }

    console.log(
      `[live-sync] Complete: ${updatedCount} matches updated, ${analysisCount} analyses, ${tweetsSent} kickoff tweets`
    );

    return NextResponse.json({
      message: 'Live sync complete',
      liveMatches: liveFixtures.length,
      updated: updatedCount,
      analysisGenerated: analysisCount,
      kickoffTweets: tweetsSent,
    });
  } catch (error) {
    console.error('[live-sync] Fatal error:', error);
    return NextResponse.json(
      { error: 'Live sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
