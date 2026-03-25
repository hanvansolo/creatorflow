import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Radio, Clock, Circle } from 'lucide-react';
import { db, competitions, competitionSeasons, matches, matchEvents, clubs, players } from '@/lib/db';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Live Scores - Football Matches In Play',
  'Real-time live football scores with goal scorers, match events, and minute-by-minute updates. Follow every match as it happens.',
  '/live',
  ['live scores', 'live football', 'real-time scores', 'football live', 'match tracker', 'goal alerts']
);

const LIVE_STATUSES = ['live', 'halftime', 'extra_time', 'penalties'];

async function getLiveMatches() {
  const liveMatchRows = await db.execute(sql`
    SELECT
      m.id,
      m.kickoff,
      m.status,
      m.minute,
      m.home_score,
      m.away_score,
      m.home_penalties,
      m.away_penalties,
      m.round,
      m.slug,
      hc.name as home_club_name,
      hc.short_name as home_club_short_name,
      hc.code as home_club_code,
      hc.primary_color as home_club_primary_color,
      hc.id as home_club_id,
      ac.name as away_club_name,
      ac.short_name as away_club_short_name,
      ac.code as away_club_code,
      ac.primary_color as away_club_primary_color,
      ac.id as away_club_id,
      comp.name as competition_name,
      comp.slug as competition_slug,
      comp.short_name as competition_short_name
    FROM matches m
    INNER JOIN clubs hc ON m.home_club_id = hc.id
    INNER JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
    ORDER BY comp.name ASC, m.kickoff ASC
  `);

  return (liveMatchRows as any[]) as Array<{
    id: string;
    kickoff: string;
    status: string;
    minute: number | null;
    home_score: number | null;
    away_score: number | null;
    home_penalties: number | null;
    away_penalties: number | null;
    round: string | null;
    slug: string;
    home_club_name: string;
    home_club_short_name: string | null;
    home_club_code: string | null;
    home_club_primary_color: string | null;
    home_club_id: string;
    away_club_name: string;
    away_club_short_name: string | null;
    away_club_code: string | null;
    away_club_primary_color: string | null;
    away_club_id: string;
    competition_name: string;
    competition_slug: string;
    competition_short_name: string | null;
  }>;
}

async function getLiveMatchEvents(matchIds: string[]) {
  if (matchIds.length === 0) return [];

  const events = await db
    .select({
      id: matchEvents.id,
      matchId: matchEvents.matchId,
      eventType: matchEvents.eventType,
      minute: matchEvents.minute,
      addedTime: matchEvents.addedTime,
      clubId: matchEvents.clubId,
      description: matchEvents.description,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerKnownAs: players.knownAs,
    })
    .from(matchEvents)
    .leftJoin(players, eq(matchEvents.playerId, players.id))
    .where(
      and(
        inArray(matchEvents.matchId, matchIds),
        inArray(matchEvents.eventType, ['goal', 'own_goal', 'penalty_scored'])
      )
    )
    .orderBy(asc(matchEvents.minute));

  return events;
}

async function getNextMatch() {
  const nextRows = await db.execute(sql`
    SELECT
      m.id,
      m.kickoff,
      m.slug,
      hc.name as home_club_name,
      hc.code as home_club_code,
      ac.name as away_club_name,
      ac.code as away_club_code,
      comp.name as competition_name,
      comp.short_name as competition_short_name
    FROM matches m
    INNER JOIN clubs hc ON m.home_club_id = hc.id
    INNER JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    WHERE m.status = 'scheduled' AND m.kickoff > NOW()
    ORDER BY m.kickoff ASC
    LIMIT 1
  `);

  const rows = (nextRows as any[]) as Array<{
    id: string;
    kickoff: string;
    slug: string;
    home_club_name: string;
    home_club_code: string | null;
    away_club_name: string;
    away_club_code: string | null;
    competition_name: string;
    competition_short_name: string | null;
  }>;

  return rows[0] || null;
}

function StatusLabel({ status, minute }: { status: string; minute?: number | null }) {
  if (status === 'halftime') {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase">
        Half Time
      </span>
    );
  }
  if (status === 'extra_time') {
    return (
      <span className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-semibold uppercase">
        Extra Time
      </span>
    );
  }
  if (status === 'penalties') {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-semibold uppercase">
        Penalties
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      {minute ? `${minute}'` : 'LIVE'}
    </span>
  );
}

function getCountdown(kickoff: string) {
  const diff = new Date(kickoff).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || 'Starting soon';
}

export default async function LivePage() {
  const liveMatches = await getLiveMatches();
  const matchIds = liveMatches.map((m) => m.id);
  const [events, nextMatch] = await Promise.all([
    getLiveMatchEvents(matchIds),
    matchIds.length === 0 ? getNextMatch() : Promise.resolve(null),
  ]);

  // Build events map: matchId -> goals[]
  const eventsMap = new Map<string, typeof events>();
  for (const event of events) {
    if (!eventsMap.has(event.matchId)) {
      eventsMap.set(event.matchId, []);
    }
    eventsMap.get(event.matchId)!.push(event);
  }

  // Group matches by competition
  const grouped = new Map<string, typeof liveMatches>();
  for (const match of liveMatches) {
    const key = match.competition_name || 'Other';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(match);
  }

  return (
    <div className="min-h-screen">
      {/* Auto-refresh: add client-side polling here for real-time updates */}
      {/* <meta httpEquiv="refresh" content="30" /> */}

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Radio className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Live Scores</h1>
              <p className="mt-1 text-zinc-400">
                {liveMatches.length > 0
                  ? `${liveMatches.length} match${liveMatches.length !== 1 ? 'es' : ''} in play`
                  : 'No matches currently live'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {liveMatches.length === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-12 text-center">
            <Circle className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-lg text-zinc-300">No live matches right now</p>
            {nextMatch && (
              <div className="mt-6 rounded-lg border border-zinc-700/50 bg-zinc-800 p-4 inline-block text-left">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Next match</p>
                <p className="text-white font-medium">
                  {nextMatch.home_club_name} vs {nextMatch.away_club_name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {nextMatch.competition_short_name || nextMatch.competition_name}
                </p>
                <div className="mt-2 flex items-center gap-2 text-emerald-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {getCountdown(nextMatch.kickoff)}
                  </span>
                </div>
              </div>
            )}
            <p className="mt-6 text-sm text-zinc-500">
              Check <Link href="/fixtures" className="text-emerald-400 hover:text-emerald-300 underline">fixtures</Link> for upcoming matches
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([competitionName, compMatches]) => (
              <div key={competitionName}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {competitionName}
                </h2>
                <div className="space-y-3">
                  {compMatches.map((match) => {
                    const matchGoals = eventsMap.get(match.id) || [];
                    const homeGoals = matchGoals.filter(
                      (e) => e.clubId === match.home_club_id
                    );
                    const awayGoals = matchGoals.filter(
                      (e) => e.clubId === match.away_club_id
                    );

                    return (
                      <div
                        key={match.id}
                        className="rounded-xl border border-emerald-500/20 bg-zinc-800/50 p-4 transition-colors hover:bg-zinc-800"
                      >
                        {/* Status bar */}
                        <div className="mb-3 flex items-center justify-between">
                          <StatusLabel
                            status={match.status}
                            minute={match.minute}
                          />
                          {match.round && (
                            <span className="text-xs text-zinc-500">{match.round}</span>
                          )}
                        </div>

                        {/* Match score */}
                        <div className="flex items-center justify-between gap-4">
                          {/* Home team */}
                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold text-white text-base sm:text-lg">
                                <span className="hidden sm:inline">{match.home_club_name}</span>
                                <span className="sm:hidden">
                                  {match.home_club_code || match.home_club_short_name || match.home_club_name}
                                </span>
                              </span>
                              {match.home_club_primary_color ? (
                                <span
                                  className="h-3.5 w-3.5 rounded-full shrink-0"
                                  style={{ backgroundColor: match.home_club_primary_color }}
                                />
                              ) : (
                                <span className="h-3.5 w-3.5 rounded-full shrink-0 bg-zinc-600" />
                              )}
                            </div>
                            {/* Home goal scorers */}
                            {homeGoals.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {homeGoals.map((goal) => (
                                  <p key={goal.id} className="text-xs text-zinc-400">
                                    {goal.playerKnownAs || goal.playerLastName || 'Goal'}{' '}
                                    {goal.minute}&apos;
                                    {goal.eventType === 'own_goal' && (
                                      <span className="text-red-400"> (OG)</span>
                                    )}
                                    {goal.eventType === 'penalty_scored' && (
                                      <span className="text-zinc-500"> (P)</span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Score */}
                          <div className="flex flex-col items-center min-w-[70px]">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">
                                {match.home_score ?? 0}
                              </span>
                              <span className="text-zinc-600 text-lg">-</span>
                              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">
                                {match.away_score ?? 0}
                              </span>
                            </div>
                            {match.status === 'penalties' &&
                              match.home_penalties !== null &&
                              match.away_penalties !== null && (
                                <span className="text-xs text-zinc-500 mt-0.5">
                                  ({match.home_penalties} - {match.away_penalties} pens)
                                </span>
                              )}
                          </div>

                          {/* Away team */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {match.away_club_primary_color ? (
                                <span
                                  className="h-3.5 w-3.5 rounded-full shrink-0"
                                  style={{ backgroundColor: match.away_club_primary_color }}
                                />
                              ) : (
                                <span className="h-3.5 w-3.5 rounded-full shrink-0 bg-zinc-600" />
                              )}
                              <span className="font-semibold text-white text-base sm:text-lg">
                                <span className="hidden sm:inline">{match.away_club_name}</span>
                                <span className="sm:hidden">
                                  {match.away_club_code || match.away_club_short_name || match.away_club_name}
                                </span>
                              </span>
                            </div>
                            {/* Away goal scorers */}
                            {awayGoals.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {awayGoals.map((goal) => (
                                  <p key={goal.id} className="text-xs text-zinc-400">
                                    {goal.playerKnownAs || goal.playerLastName || 'Goal'}{' '}
                                    {goal.minute}&apos;
                                    {goal.eventType === 'own_goal' && (
                                      <span className="text-red-400"> (OG)</span>
                                    )}
                                    {goal.eventType === 'penalty_scored' && (
                                      <span className="text-zinc-500"> (P)</span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TODO: Add client-side polling for real-time updates */}
        {/* Consider using SWR, React Query, or Server-Sent Events for live data */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Refresh the page for latest scores. Real-time updates coming soon.
        </p>
      </div>
    </div>
  );
}
