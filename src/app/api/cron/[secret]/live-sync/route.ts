// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  db,
  matches,
  matchEvents,
  matchStats,
  clubs,
  players,
  competitions,
  competitionSeasons,
  newsArticles,
  matchPredictions,
  socialPosts,
} from '@/lib/db';
import {
  getLiveFixtures,
  getFixtureEvents,
  getFixtureStatistics,
  mapFixtureStatus,
  mapEventType,
} from '@/lib/api/football-api';
import { generateMatchAnalysis } from '@/lib/api/match-analysis';
import { generateMatchReport, isReportworthy, isSocialPostworthy } from '@/lib/api/match-reports';
import { postCustomTweet, buildHashtags, checkTwitterDailyLimit } from '@/lib/social/twitter';
import { postCustomFacebook, postCustomInstagram, postFacebookComment } from '@/lib/social/facebook';
import { isValidApiFootballLogo } from '@/lib/utils/api-football-logo';
import { sendPushToAll } from '@/lib/push/send';

// Push notifications fire only for notable matches — we don't want to
// wake users up for a Latvian Liga 2 goal. Compositions: top leagues,
// major continental cups, and any match with a BIG_CLUB.
const PUSH_NOTABLE_COMPS = new Set([
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Championship', 'Eredivisie', 'Primeira Liga',
  'UEFA Champions League', 'UEFA Europa League', 'UEFA Conference League',
  'FA Cup', 'EFL Cup', 'Copa del Rey', 'Coppa Italia', 'DFB Pokal',
  'Copa Libertadores', 'Copa America', 'World Cup', 'European Championship',
]);
const PUSH_BIG_CLUBS = new Set([
  'Manchester United', 'Manchester City', 'Liverpool', 'Arsenal',
  'Chelsea', 'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern Munich',
  'Paris Saint Germain', 'Juventus', 'Inter', 'AC Milan', 'Napoli',
  'Borussia Dortmund', 'Atletico Madrid',
]);

function isPushNotable(compName: string, home: string, away: string): boolean {
  return PUSH_NOTABLE_COMPS.has(compName)
    || PUSH_BIG_CLUBS.has(home)
    || PUSH_BIG_CLUBS.has(away);
}

// API-Football budget throttle for weekends. Saturday + Sunday UTC are
// when ~80% of weekly fixtures kick off, blowing through the daily quota.
// We treat the same set as "notable" for the API: those matches keep full
// event/stats fetching; everything else just gets the live score from the
// single getLiveFixtures() call (free per match).
//
// Disable by setting API_BUDGET_WEEKEND_THROTTLE=false on Railway if a
// big league is missing from the notable set.
function isWeekendUtc(): boolean {
  const day = new Date().getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}
const WEEKEND_THROTTLE_ENABLED = process.env.API_BUDGET_WEEKEND_THROTTLE !== 'false';
function isApiThrottled(compName: string, home: string, away: string): boolean {
  if (!WEEKEND_THROTTLE_ENABLED) return false;
  if (!isWeekendUtc()) return false;
  return !isPushNotable(compName, home, away);
}

/**
 * Post a FB comment on a match's kickoff post, deduped via social_posts.
 * - `contentType` distinguishes event comments (match_comment), HT
 *   (match_ht), FT (match_ft) so we can dedup per kind.
 * - `contentId` is whatever makes the dedup unique: for events it's the
 *   matchEvents.id; for HT/FT it's the matchId.
 *
 * Natural cap: dedup means each event comments once, plus one HT and one FT
 * per match. A 10-goal thriller tops out around ~12 comments — below FB's
 * comment-rate threshold.
 */
// Kill switch for FB comment posting. Defaults to disabled because our
// current page token is missing `pages_manage_engagement` — every comment
// attempt fails with "(#200) The permission(s) …pages_manage_engagement
// are not available. It could be because either they are deprecated or
// need to be approved by App Review". Leaving it enabled burns 5–10 failed
// Graph API calls per minute and adds log noise. Re-enable by setting
// FB_COMMENTS_ENABLED=true once Meta approves the permission.
const FB_COMMENTS_ENABLED = process.env.FB_COMMENTS_ENABLED === 'true';

async function postMatchComment(args: {
  postId: string;
  contentType: 'match_comment' | 'match_ht' | 'match_ft';
  contentId: string;
  message: string;
}) {
  if (!FB_COMMENTS_ENABLED) return;

  const [existing] = await db
    .select({ id: socialPosts.id })
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.platform, 'facebook'),
        eq(socialPosts.contentType, args.contentType),
        eq(socialPosts.contentId, args.contentId),
      ),
    )
    .limit(1);
  if (existing) return;

  const res = await postFacebookComment(args.postId, args.message);
  try {
    await db.insert(socialPosts).values({
      platform: 'facebook',
      contentType: args.contentType,
      contentId: args.contentId,
      postText: args.message.slice(0, 2000),
      externalPostId: res.id,
      status: res.success ? 'posted' : 'failed',
      error: res.success ? undefined : res.error,
    });
  } catch (err) {
    console.error('[live-sync] Failed to log match comment:', err instanceof Error ? err.message : err);
  }
  if (res.success) {
    console.log(`[live-sync] FB comment posted on ${args.postId}: ${args.message.slice(0, 80)}`);
  } else {
    console.error(`[live-sync] FB comment failed on ${args.postId}: ${res.error}`);
  }
}

/** Human-readable minute string for an event, e.g. "45+2'" or "23'". */
function formatMinute(minute: number | null, addedTime: number | null): string {
  if (minute == null) return '';
  return addedTime ? `${minute}+${addedTime}'` : `${minute}'`;
}

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

  // No DB lock needed — atomic UPDATE WHERE social_posted=FALSE handles dedup

  try {
    console.log('[live-sync] Starting live match sync...');

    // Pre-check: skip the API entirely if no match in our DB is anywhere
    // near a live window. Saves a paid-API call every cron tick during the
    // overnight / between-matchdays gaps.
    // (Status list is hardcoded — Drizzle's sql template inlines JS arrays
    // as a tuple, not a Postgres array, so ANY($1) breaks.)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const couldBeLive = await db.execute(sql`
      SELECT 1 FROM matches
      WHERE status IN ('live', 'halftime', 'extra_time', 'penalties')
         OR (kickoff BETWEEN ${fourHoursAgo.toISOString()} AND ${fiveMinFromNow.toISOString()})
      LIMIT 1
    `);
    if ((couldBeLive as any[]).length === 0) {
      console.log('[live-sync] No matches in live window — skipping API call');
      return NextResponse.json({ message: 'No matches in live window', skipped: true });
    }

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
    const kickoffTweets: Array<{ home: string; away: string; competition: string; matchId: string; matchSlug: string; homeLogo?: string; awayLogo?: string }> = [];
    const finishedMatches: Array<{ matchId: string; home: string; away: string; homeScore: number; awayScore: number; competition: string; slug: string }> = [];
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

            // Auto-create clubs that don't exist yet. API-Football serves a
            // generic "no image" placeholder (90,381 bytes) for clubs it
            // doesn't have logos for — we store null instead so the OG image
            // and site fall back to initials rather than a broken-looking
            // camera icon.
            if (!homeClub) {
              try {
                const t = fixture.teams.home;
                const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const validLogo = await isValidApiFootballLogo(t.logo);
                const [created] = await db.insert(clubs).values({
                  name: t.name,
                  slug,
                  logoUrl: validLogo ? t.logo : null,
                  apiFootballId: t.id,
                  country: fixture.league.country || null,
                }).returning();
                homeClub = created;
                console.log(`[live-sync] Auto-created club: ${t.name}${validLogo ? '' : ' (no logo — placeholder)'}`);
              } catch { /* slug conflict — try to find by name */
                [homeClub] = await db.select().from(clubs).where(eq(clubs.name, fixture.teams.home.name)).limit(1);
              }
            }
            if (!awayClub) {
              try {
                const t = fixture.teams.away;
                const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const validLogo = await isValidApiFootballLogo(t.logo);
                const [created] = await db.insert(clubs).values({
                  name: t.name,
                  slug,
                  logoUrl: validLogo ? t.logo : null,
                  apiFootballId: t.id,
                  country: fixture.league.country || null,
                }).returning();
                awayClub = created;
                console.log(`[live-sync] Auto-created club: ${t.name}${validLogo ? '' : ' (no logo — placeholder)'}`);
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
              // CLAIM the post slot at insert time. If every platform fails
              // later, the release-on-failure block near the end of the run
              // flips this back to FALSE so the next cron run retries. Do
              // NOT change this to false — the existing-match path below only
              // queues matches where social_posted is FALSE, so a new match
              // left as FALSE would be re-queued (and re-posted) on every
              // subsequent run.
              socialPosted: true,
            }).returning({ id: matches.id });

            matchId = inserted.id;
            console.log(`[live-sync] Created new match: ${homeClub.name} vs ${awayClub.name} (${apiFixtureId})`);

            // New match — queue for posting. The insert above claimed the lock.
            kickoffTweets.push({
              home: homeClub.name,
              away: awayClub.name,
              competition: fixture.league.name || '',
              matchId,
              matchSlug: slug,
              homeLogo: homeClub.logoUrl || undefined,
              awayLogo: awayClub.logoUrl || undefined,
            });
          } catch (insertErr) {
            console.error(`[live-sync] Failed to create match ${apiFixtureId}:`, insertErr);
            continue;
          }
        } else {
          matchId = existingMatch.id;

          // ATOMIC: only queue if we can flip social_posted from FALSE to TRUE
          const lockResult = await db.execute(sql`UPDATE matches SET social_posted = TRUE WHERE id = ${matchId}::uuid AND social_posted = FALSE RETURNING id`);
          const notYetTweeted = (lockResult as any[]).length > 0;

          if (notYetTweeted) {
            // Find club names for the tweet
            const [hc] = await db.select({ name: clubs.name, logoUrl: clubs.logoUrl }).from(clubs).where(eq(clubs.id, existingMatch.homeClubId)).limit(1);
            const [ac] = await db.select({ name: clubs.name, logoUrl: clubs.logoUrl }).from(clubs).where(eq(clubs.id, existingMatch.awayClubId)).limit(1);
            if (hc && ac) {
              kickoffTweets.push({
                home: hc.name,
                away: ac.name,
                competition: fixture.league.name || '',
                matchId,
                matchSlug: existingMatch.slug || matchId,
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

        // 2a-ii. Detect match finishing (was live/halftime, now FT)
        if (
          existingMatch &&
          newStatus === 'finished' &&
          ['live', 'halftime', 'extra_time', 'penalties'].includes(existingMatch.status)
        ) {
          const [hc] = await db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, existingMatch.homeClubId)).limit(1);
          const [ac] = await db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, existingMatch.awayClubId)).limit(1);
          if (hc && ac) {
            finishedMatches.push({
              matchId,
              home: hc.name,
              away: ac.name,
              homeScore: fixture.goals.home ?? 0,
              awayScore: fixture.goals.away ?? 0,
              competition: fixture.league.name || '',
              slug: existingMatch.slug,
            });
          }
        }

        // 2b. Only fetch events/stats for TOP LEAGUES when score changes
        // Minor leagues just get score updates from getLiveFixtures (no extra API calls)
        // Fetch events/stats for all leagues when score changes (150k API budget)
        const scoreChanged = existingMatch
          ? (existingMatch.homeScore !== fixture.goals.home || existingMatch.awayScore !== fixture.goals.away)
          : true;

        // Web push: fire on score change OR full-time, but only for
        // notable matches. Same tag = browser replaces the previous
        // notification, so a 4-goal thriller doesn't stack 4 banners.
        const homeName = fixture.teams.home.name;
        const awayName = fixture.teams.away.name;
        const compName = fixture.league.name || '';
        const justFinished = newStatus === 'finished'
          && existingMatch
          && ['live', 'halftime', 'extra_time', 'penalties'].includes(existingMatch.status);
        if ((scoreChanged || justFinished) && isPushNotable(compName, homeName, awayName)) {
          const score = `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`;
          const minute = fixture.fixture.status.elapsed;
          const slug = existingMatch?.slug || matchId;
          const title = justFinished
            ? `FT: ${homeName} ${score} ${awayName}`
            : `⚽ GOAL — ${homeName} ${score} ${awayName}`;
          const body = justFinished
            ? `Full time at ${compName}. Read the report →`
            : `${compName}${minute != null ? ` · ${minute}'` : ''}`;
          // Fire-and-forget; don't slow down the cron loop on a slow push.
          sendPushToAll({
            title,
            body,
            url: `/matches/${slug}`,
            tag: `match-${matchId}`,
            renotify: true,
          }).catch(err => console.error('[live-sync] push failed:', err));
        }

        const existingEvents = await db
          .select()
          .from(matchEvents)
          .where(eq(matchEvents.matchId, matchId));

        const existingEventCount = existingEvents.length;
        const existingSignificantCount = existingEvents.filter(
          (e) => SIGNIFICANT_EVENTS.has(e.eventType)
        ).length;

        // Weekend API-budget gate — non-notable matches get score-only
        // updates from getLiveFixtures, no per-fixture event/stats burns.
        const apiThrottled = isApiThrottled(compName, homeName, awayName);

        // Only call API for events if score changed or at HT/FT
        let apiEvents: any[] = [];
        const shouldFetchEvents = !apiThrottled
          && (scoreChanged || (fixture.fixture.status.elapsed && fixture.fixture.status.elapsed % 15 === 0));
        if (shouldFetchEvents) {
          const eventsResponse = await getFixtureEvents(apiFixtureId);
          apiEvents = eventsResponse.response || [];
        }

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

        // 2c. Get and upsert match statistics (only if score changed or halftime/fulltime)
        let apiStats: any[] = [];
        const isBreak = fixture.fixture.status.short === 'HT' || fixture.fixture.status.short === 'FT';
        if (shouldFetchEvents || (isBreak && !apiThrottled)) {
          const statsResponse = await getFixtureStatistics(apiFixtureId);
          apiStats = statsResponse.response || [];
        }

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

        // 3b. FB comment thread on the kickoff post.
        // Only runs when the match already had a FB kickoff post in a
        // previous cron run (existingMatch.fbKickoffPostId set). Brand-new
        // matches get their comment thread next run, after the kickoff post.
        const kickoffPostId = existingMatch?.fbKickoffPostId;
        if (kickoffPostId) {
          try {
            const [hc] = await db.select({ name: clubs.name, shortName: clubs.shortName }).from(clubs).where(eq(clubs.id, existingMatch!.homeClubId)).limit(1);
            const [ac] = await db.select({ name: clubs.name, shortName: clubs.shortName }).from(clubs).where(eq(clubs.id, existingMatch!.awayClubId)).limit(1);
            const homeName = hc?.shortName || hc?.name || 'Home';
            const awayName = ac?.shortName || ac?.name || 'Away';
            const homeScore = fixture.goals.home ?? 0;
            const awayScore = fixture.goals.away ?? 0;
            const scoreLine = `${homeName} ${homeScore}-${awayScore} ${awayName}`;

            // HT transition
            if (newStatus === 'halftime' && existingMatch!.status === 'live') {
              await postMatchComment({
                postId: kickoffPostId,
                contentType: 'match_ht',
                contentId: matchId,
                message: `⏸️ HALF-TIME\n\n${scoreLine}`,
              });
            }

            // FT transition
            if (newStatus === 'finished' && ['live', 'halftime', 'extra_time', 'penalties'].includes(existingMatch!.status)) {
              await postMatchComment({
                postId: kickoffPostId,
                contentType: 'match_ft',
                contentId: matchId,
                message: `🔚 FULL-TIME\n\n${scoreLine}`,
              });
            }

            // Significant events (goals, reds, VAR) — one comment per event.
            const sigEvents = updatedEvents.filter((e) => SIGNIFICANT_EVENTS.has(e.eventType));
            if (sigEvents.length > 0) {
              // Pre-load which of these events we've already commented on so
              // we don't hammer the Graph API once per cron iteration.
              const ids = sigEvents.map((e) => e.id);
              const already = await db
                .select({ contentId: socialPosts.contentId })
                .from(socialPosts)
                .where(
                  and(
                    eq(socialPosts.platform, 'facebook'),
                    eq(socialPosts.contentType, 'match_comment'),
                    inArray(socialPosts.contentId, ids),
                  ),
                );
              const alreadySet = new Set(already.map((a) => a.contentId));

              // Sort oldest first so the comment thread reads chronologically.
              const toComment = sigEvents
                .filter((e) => !alreadySet.has(e.id))
                .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

              for (const ev of toComment) {
                let playerName = '';
                if (ev.playerId) {
                  const [p] = await db
                    .select({ firstName: players.firstName, lastName: players.lastName, knownAs: players.knownAs })
                    .from(players)
                    .where(eq(players.id, ev.playerId))
                    .limit(1);
                  playerName = p?.knownAs || p?.lastName || p?.firstName || '';
                }
                let teamName = '';
                if (ev.clubId) {
                  if (ev.clubId === existingMatch!.homeClubId) teamName = homeName;
                  else if (ev.clubId === existingMatch!.awayClubId) teamName = awayName;
                }

                const minStr = formatMinute(ev.minute, ev.addedTime);
                let text = '';
                switch (ev.eventType) {
                  case 'goal':
                    text = playerName
                      ? `⚽ GOAL! ${playerName}${teamName ? ` (${teamName})` : ''} ${minStr}\n\n${scoreLine}`
                      : `⚽ GOAL${teamName ? ` — ${teamName}` : ''} ${minStr}\n\n${scoreLine}`;
                    break;
                  case 'own_goal':
                    text = playerName
                      ? `😬 OWN GOAL — ${playerName} ${minStr}\n\n${scoreLine}`
                      : `😬 OWN GOAL ${minStr}\n\n${scoreLine}`;
                    break;
                  case 'penalty_scored':
                    text = playerName
                      ? `⚽ PENALTY! ${playerName}${teamName ? ` (${teamName})` : ''} ${minStr}\n\n${scoreLine}`
                      : `⚽ PENALTY scored ${minStr}\n\n${scoreLine}`;
                    break;
                  case 'red_card':
                    text = playerName
                      ? `🟥 RED CARD — ${playerName}${teamName ? ` (${teamName})` : ''} ${minStr}`
                      : `🟥 RED CARD${teamName ? ` — ${teamName}` : ''} ${minStr}`;
                    break;
                  case 'var_decision':
                    text = `📺 VAR (${minStr})${ev.description ? ` — ${ev.description}` : ''}`;
                    break;
                  default:
                    continue;
                }

                await postMatchComment({
                  postId: kickoffPostId,
                  contentType: 'match_comment',
                  contentId: ev.id,
                  message: text,
                });
              }
            }
          } catch (commentErr) {
            console.error(`[live-sync] Comment-thread error for ${matchId}:`, commentErr instanceof Error ? commentErr.message : commentErr);
          }
        }
      } catch (err) {
        console.error(`[live-sync] Error processing fixture ${fixture.fixture.id}:`, err);
        // Continue with next fixture
      }
    }

    // 4. Generate AI analysis — DISABLED to save Anthropic tokens
    // Re-enable when token budget allows. Was generating analysis for every goal/card across 90+ matches.
    let analysisCount = 0;
    // for (const { matchId, trigger } of matchesNeedingAnalysis) {
    //   try {
    //     await generateMatchAnalysis(matchId, trigger);
    //     analysisCount++;
    //   } catch (err) {
    //     console.error(`[live-sync] Error generating analysis for match ${matchId}:`, err);
    //   }
    // }

    // === AI-POWERED MATCH SELECTION ===
    // Score each match by traffic potential, only post the best ones
    // Max 3 posts per cron run to stay within rate limits

    function scoreMatch(kick: typeof kickoffTweets[0]): number {
      const comp = kick.competition;
      let score = 0;

      // Tier 1: Massive global interest (10 points)
      if (['Champions League', 'Europa League', 'World Cup', 'European Championship', 'Copa America'].some(c => comp.includes(c))) score += 10;

      // Tier 2: Top domestic leagues (8 points)
      if (['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'].includes(comp)) score += 8;

      // Tier 3: Cup competitions & notable leagues (5 points)
      if (['FA Cup', 'EFL Cup', 'Copa del Rey', 'Coppa Italia', 'DFB-Pokal', 'Conference League', 'Nations League'].some(c => comp.includes(c))) score += 5;
      if (['Championship', 'MLS', 'Brasileirão', 'Eredivisie', 'Scottish Premiership'].includes(comp)) score += 5;

      // Tier 4: Secondary leagues (2 points)
      if (['Liga MX', 'Copa Libertadores', 'Saudi Pro League', 'League One', 'Super Lig', 'Primeira Liga'].some(c => comp.includes(c))) score += 2;

      // Bonus: Big clubs (+3)
      const BIG_CLUBS = ['Arsenal', 'Manchester City', 'Liverpool', 'Manchester United', 'Chelsea', 'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'PSG', 'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Borussia Dortmund', 'Atletico Madrid'];
      if (BIG_CLUBS.includes(kick.home)) score += 3;
      if (BIG_CLUBS.includes(kick.away)) score += 3;

      // Bonus: Finals/Semis/Quarters (+5)
      if (comp.includes('Final') || comp.includes('Semi') || comp.includes('Quarter')) score += 5;

      // Penalty: Youth/reserve (-100)
      if (comp.includes('U19') || comp.includes('U20') || comp.includes('U21') || comp.includes('Reserve') || comp.includes('Primavera')) score -= 100;

      return score;
    }

    // Score and sort. Two tiers:
    //  - FB target: every non-youth/non-reserve kickoff posts to FB.
    //  - Other platforms (TW/IG/Threads/Bluesky/Telegram) stay on the
    //    high-value selection (top leagues, big clubs, finals) to keep
    //    those feeds curated.
    const scoredMatches = kickoffTweets
      .map(kick => ({ ...kick, score: scoreMatch(kick) }))
      .sort((a, b) => b.score - a.score);

    const highValue = scoredMatches.filter(k => k.score >= 4);
    const bestAvailable = highValue.length > 0 ? highValue : scoredMatches.slice(0, 2);
    const highValueIds = new Set(bestAvailable.filter(k => k.score >= 0).map(k => k.matchId));

    // FB gets every non-youth kickoff. score < 0 = youth/reserve penalty.
    const toPost = scoredMatches.filter(k => k.score >= 0);

    console.log(
      `[live-sync] ${kickoffTweets.length} kickoffs queued, ${toPost.length} for FB, ` +
      `${highValueIds.size} for other platforms`
    );

    // Log only matches we're fully dropping (youth/reserve) — the others
    // are at least getting FB, so they shouldn't show up as "missing".
    const dropped = scoredMatches.filter(k => k.score < 0);
    if (dropped.length > 0) {
      console.log(
        `[live-sync] Dropped ${dropped.length} youth/reserve kickoffs: ` +
        dropped.map(m => `${m.home} vs ${m.away} [${m.competition || 'no comp'}] score=${m.score}`).join(' | '),
      );
    }

    // Per-platform caps. FB pulled back to 3/run after FB temp-blocked
    // the page for posting too aggressively (12/run × 60s cron interval =
    // up to 720/hr peak, well above FB's organic page tolerance). 3/run +
    // 15s inter-match delay = max 3 posts spread over 30s of the 60s
    // window, ~180/hr peak. Cap-skipped matches release their lock and
    // retry on the next tick, so a busy 3pm Saturday still gets every
    // game posted — just over 10-15 minutes instead of all at once.
    const MAX_KICKOFF_FB_PER_RUN = Number(process.env.MAX_KICKOFF_FB_PER_RUN || 3);
    // Twitter Free tier = 17 posts/day. With kickoffs alone (high-value
    // matches Sat-Sun) we can blow that fast, so cap to 1 kickoff tweet
    // per cron run AND check the rolling 24h daily cap inside the loop.
    const MAX_KICKOFF_TW_PER_RUN = Number(process.env.MAX_KICKOFF_TW_PER_RUN || 1);
    const KICKOFF_INTER_POST_DELAY_MS = Number(process.env.KICKOFF_INTER_POST_DELAY_MS || 15_000);

    let tweetsSent = 0;
    let fbSent = 0;
    for (const kick of toPost) {
      const comp = kick.competition;
      const isHighValue = highValueIds.has(kick.matchId);

      try {
        const homeTag = kick.home.replace(/[^a-zA-Z0-9]/g, '');
        const awayTag = kick.away.replace(/[^a-zA-Z0-9]/g, '');
        const compTag = kick.competition.replace(/[^a-zA-Z0-9]/g, '');
        const matchUrl = `https://www.footy-feed.com/matches/${kick.matchSlug || kick.matchId}`;

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

        // Detect BIG MATCHES for hyped-up templates
        const BIG_COMPS = new Set([
          'Champions League', 'Europa League', 'Conference League',
          'World Cup', 'European Championship', 'Copa America',
          'Nations League', 'FA Cup', 'Copa del Rey', 'Coppa Italia',
          'DFB-Pokal', 'Coupe de France', 'Club World Cup',
        ]);
        const BIG_CLUBS = new Set([
          'Arsenal', 'Manchester City', 'Liverpool', 'Manchester United', 'Chelsea', 'Tottenham',
          'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Bayern Munich', 'Borussia Dortmund',
          'PSG', 'Juventus', 'Inter Milan', 'AC Milan', 'Napoli',
        ]);
        const isBigMatch = BIG_COMPS.has(comp)
          || (BIG_CLUBS.has(kick.home) && BIG_CLUBS.has(kick.away))
          || comp.includes('Final') || comp.includes('Semi') || comp.includes('Quarter');

        // BIG MATCH templates — maximum hype
        const BIG_TWEET_TEMPLATES = [
          (h: string, a: string, c: string, url: string, tags: string) => `🔥🔥🔥 THE STAGE IS SET!\n\n${h} 🆚 ${a}\n${c}\n\nThis is going to be MASSIVE. Every touch, every tackle, every moment — LIVE 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `⚡ BUCKLE UP! ${h} vs ${a} is LIVE!\n\n${c} football at its finest. You won't want to miss this one 🍿\n\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🚨 IT'S ON! ${h} vs ${a}\n\n${c} — the atmosphere is ELECTRIC ⚡\n\nLive scores, stats & minute-by-minute updates 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🏟️ WHAT A NIGHT FOR FOOTBALL!\n\n${h} 🆚 ${a} — ${c}\n\nKick-off confirmed. Game on! 🎬\n\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `💥 ${h} vs ${a} — LIVE NOW!\n\nThe ${c} delivers again. This one has blockbuster written all over it 🎯\n\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🌟 THE BIG ONE IS UNDERWAY!\n\n${h} 🆚 ${a}\n${c}\n\nWho's taking the glory tonight? Follow LIVE 👇\n${url}\n\n${tags}`,
        ];
        const BIG_FB_TEMPLATES = [
          (h: string, a: string, c: string, tags: string) => `🔥🔥🔥 THE STAGE IS SET!\n\n${h} 🆚 ${a}\n${c}\n\nThis is going to be MASSIVE. Every touch, every tackle, every moment — follow it all LIVE on Footy Feed!\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `⚡ BUCKLE UP! ${h} vs ${a} is LIVE!\n\n${c} football at its finest. You won't want to miss this one 🍿\n\nFull match centre with live stats, commentary & predictions 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🚨 IT'S ON! ${h} vs ${a}\n\n${c} — the atmosphere is ELECTRIC ⚡\n\nLive scores, stats, player ratings & minute-by-minute updates on Footy Feed!\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🏟️ WHAT A NIGHT FOR FOOTBALL!\n\n${h} 🆚 ${a} — ${c}\n\nKick-off confirmed. Who's winning this one? Follow every moment LIVE!\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `💥 ${h} vs ${a} — LIVE NOW!\n\nThe ${c} delivers again. This one has blockbuster written all over it 🎯\n\nLive coverage at footy-feed.com!\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🌟 THE BIG ONE IS UNDERWAY!\n\n${h} 🆚 ${a}\n${c}\n\nWho's taking the glory tonight? Live scores, AI predictions & full match centre 👇\n\n${tags}`,
        ];

        // Standard templates for regular matches
        const STD_TWEET_TEMPLATES = [
          (h: string, a: string, c: string, url: string, tags: string) => `⚽ KICK OFF! ${h} vs ${a} is underway!\n\nLive scores, stats & match feed 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🔴 LIVE: ${h} take on ${a} in the ${c}!\n\nFollow every kick 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🚨 We're underway at ${h} vs ${a}!\n\nLive coverage, stats & commentary 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `⚡ It's GO TIME! ${h} 🆚 ${a}\n\nAll the action live 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🎯 ${h} vs ${a} has kicked off in the ${c}!\n\nLive feed 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `📡 ${h} v ${a} is LIVE!\n\nReal-time scores & match centre 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `🏟️ ${h} host ${a} — and we're off!\n\nMatch centre 👇\n${url}\n\n${tags}`,
          (h: string, a: string, c: string, url: string, tags: string) => `⏱️ Underway! ${h} 0-0 ${a}\n\nLive blog 👇\n${url}\n\n${tags}`,
        ];
        const STD_FB_TEMPLATES = [
          (h: string, a: string, c: string, tags: string) => `⚽ KICK OFF! ${h} vs ${a} is underway!\n\nLive scores, stats & match feed 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🔴 LIVE: ${h} take on ${a} in the ${c}!\n\nFollow every kick at footy-feed.com 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🚨 We're underway at ${h} vs ${a}!\n\nFull live coverage, stats & commentary 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `⚡ It's GO TIME! ${h} 🆚 ${a}\n\nAll the action — live now 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🎯 ${h} vs ${a} has kicked off in the ${c}!\n\nDon't miss a moment 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `📡 ${h} v ${a} is LIVE!\n\nReal-time scores & match centre below 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `🏟️ ${h} host ${a} — and we're off!\n\nFull match centre below 👇\n\n${tags}`,
          (h: string, a: string, c: string, tags: string) => `⏱️ Underway! ${h} 0-0 ${a}\n\nLive updates as they happen 👇\n\n${tags}`,
        ];

        // Pick template set based on match importance
        const TWEET_TEMPLATES = isBigMatch ? BIG_TWEET_TEMPLATES : STD_TWEET_TEMPLATES;
        const FB_TEMPLATES = isBigMatch ? BIG_FB_TEMPLATES : STD_FB_TEMPLATES;

        // Pick a template based on match ID hash — deterministic so retries don't change text
        const seed = kick.matchId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const tweetTemplate = TWEET_TEMPLATES[seed % TWEET_TEMPLATES.length];
        const fbTemplate = FB_TEMPLATES[seed % FB_TEMPLATES.length];

        // Hashtags: buildHashtags maps to canonical tags (#ManCity not
        // #ManchesterCity, #UCL not #ChampionsLeague) using the curated
        // dictionaries in twitter.ts. Limit to 2-3 for Twitter best
        // practice; FB tolerates more so use the full set there.
        const allTags = buildHashtags(`${kick.home} vs ${kick.away}`, [kick.home, kick.away, kick.competition]);
        const fbTagStr = allTags;
        const tweetTagStr = allTags.split(' ').slice(0, 3).join(' ');
        const tweetText = tweetTemplate(kick.home, kick.away, kick.competition, matchUrl, tweetTagStr);
        const fbText = fbTemplate(kick.home, kick.away, kick.competition, fbTagStr);

        if (isBigMatch) console.log(`[live-sync] BIG MATCH detected: ${kick.home} vs ${kick.away} (${comp})`);

        // Delay between matches to avoid FB rate limits / temp blocks.
        // Configurable via KICKOFF_INTER_POST_DELAY_MS (default 15s).
        if (tweetsSent > 0 || fbSent > 0) {
          await new Promise(r => setTimeout(r, KICKOFF_INTER_POST_DELAY_MS));
        }

        // Post to platforms — track if ANY platform succeeded.
        // Twitter stays off via TWITTER_PAUSED flag in twitter.ts — postCustomTweet
        // returns a paused error so calling it is a cheap no-op.
        let anySuccess = false;

        // Facebook — postCustomFacebook handles its own credential lookup.
        // Honour per-platform kickoff cap. Save the returned post id so later
        // runs can post event comments (goals, cards, HT, FT) on the same
        // thread instead of flooding the feed with new posts.
        if (fbSent < MAX_KICKOFF_FB_PER_RUN) {
          try {
            const fbRes = await postCustomFacebook(fbText, matchUrl, ogImageUrl);
            if (fbRes.success) {
              anySuccess = true;
              fbSent++;
              if (fbRes.id) {
                await db.update(matches).set({ fbKickoffPostId: fbRes.id }).where(eq(matches.id, kick.matchId));
              }
              console.log(`[live-sync] Facebook kickoff posted: ${kick.home} vs ${kick.away} (id=${fbRes.id})`);
            } else {
              console.error(`[live-sync] Facebook kickoff failed: ${fbRes.error}`);
            }
          } catch (e) {
            console.error(`[live-sync] Facebook kickoff threw:`, e);
          }
        }

        // Non-FB platforms (IG/Threads/Twitter/Bluesky/Telegram) only
        // run for high-value matches — keeps those feeds curated. FB
        // already posted above for every non-youth kickoff.
        if (isHighValue) {
          // Instagram — needs a public image URL (ogImageUrl fits). URL is
          // appended to the caption (IG doesn't hyperlink it, but at least it's
          // visible to readers).
          try {
            const igRes = await postCustomInstagram(fbText, ogImageUrl, matchUrl);
            if (igRes.success) {
              anySuccess = true;
              console.log(`[live-sync] Instagram kickoff posted: ${kick.home} vs ${kick.away}`);
            } else {
              console.error(`[live-sync] Instagram kickoff failed: ${igRes.error}`);
            }
          } catch (e) {
            console.error(`[live-sync] Instagram kickoff threw:`, e);
          }

          // Threads — title-with-hashtags branch keeps our pre-built caption intact.
          try {
            const { postToThreads } = await import('@/lib/social/threads');
            const thRes = await postToThreads(`${fbText}\n\n${matchUrl}`, matchUrl, ogImageUrl);
            if (thRes.success) {
              anySuccess = true;
              console.log(`[live-sync] Threads kickoff posted: ${kick.home} vs ${kick.away}`);
            } else {
              console.error(`[live-sync] Threads kickoff failed: ${thRes.error}`);
            }
          } catch (e) {
            console.error(`[live-sync] Threads kickoff threw:`, e);
          }

          // Twitter — only the single best kickoff per run gets a tweet,
          // and only if we're under the rolling 24h daily cap (Free tier
          // = 17/day, we cap at 12). Live games are the priority. Score
          // gate >= 4 means top-flight only (Top 5 European leagues,
          // major cups, finals, big-club derbies); on quiet days the
          // tweet quota goes to breaking news / transfer articles via
          // the social-post cron instead of a Segunda División kickoff.
          const TW_MIN_SCORE = 4;
          if (tweetsSent < MAX_KICKOFF_TW_PER_RUN && (kick as any).score >= TW_MIN_SCORE) {
            try {
              const limit = await checkTwitterDailyLimit();
              if (!limit.ok) {
                console.log(`[live-sync] Twitter skipped (${kick.home} vs ${kick.away}): ${limit.reason}`);
              } else {
                const twRes = await postCustomTweet(
                  tweetText,
                  ogImageUrl,
                  { contentType: 'match_kickoff', contentId: kick.matchId },
                );
                if (twRes.success) {
                  anySuccess = true;
                  tweetsSent++;
                  console.log(`[live-sync] Twitter kickoff posted: ${kick.home} vs ${kick.away} (${(limit.recent ?? 0) + 1}/12 today)`);
                } else {
                  console.error(`[live-sync] Twitter kickoff failed: ${twRes.error}`);
                }
              }
            } catch (e) {
              console.error(`[live-sync] Twitter kickoff threw:`, e);
            }
          }

          try {
            const { postToBluesky } = await import('@/lib/social/bluesky');
            const bsRes = await postToBluesky(tweetText.slice(0, 280), matchUrl, [], ogImageUrl);
            if (bsRes.success) {
              anySuccess = true;
              console.log(`[live-sync] Bluesky posted: ${kick.home} vs ${kick.away}`);
            } else {
              console.error(`[live-sync] Bluesky failed: ${bsRes.error}`);
            }
          } catch (e) {
            console.error(`[live-sync] Bluesky threw:`, e);
          }

          try {
            const { postToTelegram } = await import('@/lib/social/telegram');
            const tgText = `${fbText}\n\n${matchUrl}`;
            const tgRes = await postToTelegram(tgText, ogImageUrl);
            if (tgRes.anySuccess) {
              anySuccess = true;
              console.log(`[live-sync] Telegram: ${tgRes.sent} sent, ${tgRes.failed} failed for ${kick.home} vs ${kick.away}`);
            } else if (tgRes.sent === 0 && tgRes.failed === 0) {
              // not configured — skip quietly
            } else {
              console.error(`[live-sync] Telegram all failed: ${tgRes.errors.join('; ')}`);
            }
          } catch (e) {
            console.error(`[live-sync] Telegram threw:`, e);
          }
        }

        // The atomic lock at line ~198 / new-insert flow already claimed this match
        // by setting social_posted=TRUE to prevent concurrent cron runs double-posting.
        // If all platforms failed, release the claim so the next cron run retries.
        if (!anySuccess) {
          console.error(`[live-sync] ALL platforms failed for ${kick.home} vs ${kick.away} — releasing lock for retry`);
          await db.execute(sql`UPDATE matches SET social_posted = FALSE WHERE id = ${kick.matchId}::uuid`);
        }
      } catch (err) {
        console.error(`[live-sync] Kickoff post error for ${kick.home} vs ${kick.away}:`, err);
        // Release lock on unexpected error so retry can happen
        try {
          await db.execute(sql`UPDATE matches SET social_posted = FALSE WHERE id = ${kick.matchId}::uuid`);
        } catch {}
      }
    }

    // 5b. Ping IndexNow for the matches that just went live — gets Bing/Yandex
    //     to crawl the match URL within minutes instead of hours.
    if (toPost.length > 0) {
      try {
        const { pingIndexNow } = await import('@/lib/seo/indexnow');
        const urls = toPost.map(k => `/matches/${k.matchSlug || k.matchId}`);
        await pingIndexNow(urls);
      } catch (e) {
        console.error('[live-sync] IndexNow ping failed:', (e as Error).message);
      }
    }

    // 6. Generate match reports for finished matches
    let reportsGenerated = 0;
    for (const fm of finishedMatches) {
      try {
        // Check if reportworthy
        if (!isReportworthy(fm.competition, fm.homeScore, fm.awayScore, fm.home, fm.away)) {
          continue;
        }

        // Check if already generated (via column or slug)
        let alreadyGenerated = false;
        try {
          const [check] = await db.execute(
            sql`SELECT match_report_generated FROM matches WHERE id = ${fm.matchId}::uuid AND match_report_generated = TRUE LIMIT 1`
          );
          if (check) alreadyGenerated = true;
        } catch {
          // Column may not exist — fall through to slug check in generateMatchReport
        }

        if (alreadyGenerated) {
          console.log(`[live-sync] Report already generated for ${fm.home} vs ${fm.away}`);
          continue;
        }

        console.log(`[live-sync] Generating match report: ${fm.home} ${fm.homeScore}-${fm.awayScore} ${fm.away}`);
        const reportResult = await generateMatchReport(fm.matchId);

        if (reportResult.success && reportResult.articleId) {
          reportsGenerated++;

          // Post to social media for major matches
          if (isSocialPostworthy(fm.competition)) {
            try {
              const articleSlug = `${new Date().toISOString().split('T')[0]}-${fm.home.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vs-${fm.away.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-match-report`;
              const articleUrl = `https://www.footy-feed.com/news/${articleSlug}`;

              // Fetch the generated article for the summary
              const [article] = await db
                .select({ summary: newsArticles.summary })
                .from(newsArticles)
                .where(eq(newsArticles.id, reportResult.articleId))
                .limit(1);

              const summaryText = article?.summary || `${fm.home} ${fm.homeScore}-${fm.awayScore} ${fm.away} in the ${fm.competition}.`;

              const homeTag = fm.home.replace(/[^a-zA-Z0-9]/g, '');
              const awayTag = fm.away.replace(/[^a-zA-Z0-9]/g, '');
              const compTag = fm.competition.replace(/[^a-zA-Z0-9]/g, '');
              const scoreLine = `${fm.home} ${fm.homeScore}-${fm.awayScore} ${fm.away}`;
              const tags = `#${homeTag} #${awayTag} #${compTag} #MatchReport`;

              // Vary match-report captions by scoreline + teams so Saturday
              // rounds of 10+ reports don't look identical on the feed.
              const REPORT_TW_TEMPLATES = [
                (sl: string, s: string) => `📝 FULL-TIME: ${sl}\n\n${s.slice(0, 140)}\n\n${articleUrl}\n\n${tags}`,
                (sl: string, s: string) => `🏁 MATCH REPORT: ${sl}\n\n${s.slice(0, 140)}\n\n${articleUrl}\n\n${tags}`,
                (sl: string, s: string) => `⏱️ Full-time scenes: ${sl}\n\n${s.slice(0, 140)}\n\n${articleUrl}\n\n${tags}`,
                (sl: string, s: string) => `📋 That's a wrap: ${sl}\n\n${s.slice(0, 140)}\n\n${articleUrl}\n\n${tags}`,
                (sl: string, s: string) => `🔚 ${sl}\n\n${s.slice(0, 160)}\n\n${articleUrl}\n\n${tags}`,
              ];
              const REPORT_FB_TEMPLATES = [
                (sl: string, s: string) => `📝 FULL-TIME: ${sl}\n\n${s}\n\n${tags}`,
                (sl: string, s: string) => `🏁 MATCH REPORT: ${sl}\n\n${s}\n\n${tags}`,
                (sl: string, s: string) => `⏱️ Full-time scenes at ${sl}\n\n${s}\n\n${tags}`,
                (sl: string, s: string) => `📋 That's a wrap — ${sl}\n\n${s}\n\n${tags}`,
                (sl: string, s: string) => `🔚 ${sl}\n\nThe verdict:\n\n${s}\n\n${tags}`,
              ];

              // Deterministic pick: same match always gets the same template.
              const reportSeed = fm.matchId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
              const twReport = REPORT_TW_TEMPLATES[reportSeed % REPORT_TW_TEMPLATES.length];
              const fbReport = REPORT_FB_TEMPLATES[reportSeed % REPORT_FB_TEMPLATES.length];

              const tweetText = twReport(scoreLine, summaryText);
              const fbText = fbReport(scoreLine, summaryText);

              // Generate a full-time OG image for IG (optional — fall back to no image).
              const reportOgParams = new URLSearchParams({
                home: fm.home,
                away: fm.away,
                comp: fm.competition,
                status: 'finished',
                homeScore: String(fm.homeScore),
                awayScore: String(fm.awayScore),
              });
              const reportOgImage = `https://www.footy-feed.com/api/og/match?${reportOgParams.toString()}`;

              const { postToBluesky: bsPost } = await import('@/lib/social/bluesky');
              const { postToThreads: thPost } = await import('@/lib/social/threads');

              const [tweetRes, fbRes, igRes, bsRes, thRes] = await Promise.allSettled([
                postCustomTweet(tweetText.slice(0, 280)),
                postCustomFacebook(fbText, articleUrl),
                postCustomInstagram(fbText, reportOgImage, articleUrl),
                bsPost(tweetText.slice(0, 280), articleUrl, [], reportOgImage),
                thPost(`${fbText}\n\n${articleUrl}`, articleUrl, reportOgImage),
              ]);

              if (tweetRes.status === 'fulfilled' && tweetRes.value?.success) {
                console.log(`[live-sync] Match report tweet sent: ${fm.home} vs ${fm.away}`);
              }
              if (fbRes.status === 'fulfilled' && fbRes.value?.success) {
                console.log(`[live-sync] Match report FB post sent: ${fm.home} vs ${fm.away}`);
              }
              if (igRes.status === 'fulfilled' && igRes.value?.success) {
                console.log(`[live-sync] Match report IG post sent: ${fm.home} vs ${fm.away}`);
              }
              if (bsRes.status === 'fulfilled' && bsRes.value?.success) {
                console.log(`[live-sync] Match report Bluesky post sent: ${fm.home} vs ${fm.away}`);
              }
              if (thRes.status === 'fulfilled' && thRes.value?.success) {
                console.log(`[live-sync] Match report Threads post sent: ${fm.home} vs ${fm.away}`);
              }
            } catch (socialErr) {
              console.error(`[live-sync] Social posting error for report:`, socialErr);
            }
          }
        } else {
          console.log(`[live-sync] Report generation failed: ${reportResult.error}`);
        }
      } catch (err) {
        console.error(`[live-sync] Error generating report for ${fm.home} vs ${fm.away}:`, err);
      }
    }

    // 7. Update prediction accuracy for finished matches
    let predictionsScored = 0;
    for (const fm of finishedMatches) {
      try {
        const [pred] = await db
          .select()
          .from(matchPredictions)
          .where(eq(matchPredictions.matchId, fm.matchId))
          .limit(1);

        if (pred && !pred.accuracy) {
          const actualOutcome = fm.homeScore > fm.awayScore ? 'home' : fm.awayScore > fm.homeScore ? 'away' : 'draw';
          const outcomeCorrect = pred.predictedOutcome === actualOutcome;
          const scoreCorrect = pred.predictedHomeScore === fm.homeScore && pred.predictedAwayScore === fm.awayScore;
          const bttsActual = fm.homeScore > 0 && fm.awayScore > 0;
          const bttsCorrect = pred.btts === bttsActual;
          const totalGoals = fm.homeScore + fm.awayScore;
          const ouLine = parseFloat(String(pred.overUnder || '2.5'));
          const overUnderCorrect = pred.overUnderPrediction === (totalGoals > ouLine ? 'over' : 'under');

          await db
            .update(matchPredictions)
            .set({
              accuracy: {
                outcomeCorrect,
                scoreCorrect,
                bttsCorrect,
                overUnderCorrect,
                actualHomeScore: fm.homeScore,
                actualAwayScore: fm.awayScore,
                actualOutcome,
              },
            })
            .where(eq(matchPredictions.id, pred.id));

          predictionsScored++;
          console.log(`[live-sync] Prediction scored: ${fm.home} vs ${fm.away} — outcome ${outcomeCorrect ? '✓' : '✗'}, score ${scoreCorrect ? '✓' : '✗'}, BTTS ${bttsCorrect ? '✓' : '✗'}`);
        }
      } catch (err) {
        console.error(`[live-sync] Prediction scoring error for ${fm.matchId}:`, err);
      }
    }

    console.log(
      `[live-sync] Complete: ${updatedCount} matches updated, ${analysisCount} analyses, ${tweetsSent} tweets, ${fbSent} FB posts, ${reportsGenerated} match reports, ${predictionsScored} predictions scored`
    );

    return NextResponse.json({
      message: 'Live sync complete',
      liveMatches: liveFixtures.length,
      updated: updatedCount,
      analysisGenerated: analysisCount,
      kickoffTweets: tweetsSent,
      kickoffFbPosts: fbSent,
      matchReports: reportsGenerated,
    });
  } catch (error) {
    console.error('[live-sync] Fatal error:', error);
    return NextResponse.json(
      { error: 'Live sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
