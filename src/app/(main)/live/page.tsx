// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db, matches } from '@/lib/db';
import { sql, gt, inArray } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { Radio, ArrowRight, Zap, Calendar, Trophy, Goal } from 'lucide-react';
import { COMPETITIONS } from '@/lib/constants/competitions';
import { CompetitionSelector } from '@/components/competitions';

const ALL_COMPETITIONS = COMPETITIONS.map(c => ({
  name: c.name,
  slug: c.slug,
  shortName: c.shortName,
  type: c.type,
  country: c.country,
  countryCode: c.countryCode,
  description: c.description,
}));

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Live Scores - Football',
  'Real-time football live scores across all major leagues. Goals, cards, substitutions, and match events as they happen.',
  '/live',
  ['live scores', 'football live', 'real-time scores', 'live football', 'match updates']
);

interface LiveMatch {
  id: string;
  kickoff: string;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  home_name: string;
  home_slug: string;
  home_code: string | null;
  home_color: string | null;
  home_logo: string | null;
  away_name: string;
  away_slug: string;
  away_code: string | null;
  away_color: string | null;
  away_logo: string | null;
  competition_name: string;
  competition_slug: string;
  competition_logo: string | null;
}

interface MatchEvent {
  match_id: string;
  event_type: string;
  minute: number;
  added_time: number | null;
  player_name: string | null;
  club_id: string;
}

async function getLiveMatches(): Promise<LiveMatch[]> {
  try {
    const rows = await db.execute(sql`
      SELECT
        m.id, m.kickoff, m.status, m.minute, m.home_score, m.away_score,
        m.home_score_ht, m.away_score_ht,
        hc.name as home_name, hc.slug as home_slug, hc.code as home_code, hc.primary_color as home_color, hc.logo_url as home_logo,
        ac.name as away_name, ac.slug as away_slug, ac.code as away_code, ac.primary_color as away_color, ac.logo_url as away_logo,
        comp.name as competition_name, comp.slug as competition_slug, comp.logo_url as competition_logo
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY comp.name, m.kickoff
    `);
    return (rows as any[]) as LiveMatch[];
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    return [];
  }
}

async function getMatchEvents(matchIds: string[]): Promise<MatchEvent[]> {
  if (matchIds.length === 0) return [];
  try {
    const rows = await db.execute(sql`
      SELECT
        me.match_id, me.event_type, me.minute, me.added_time, me.club_id,
        COALESCE(p.known_as, p.first_name || ' ' || p.last_name) as player_name
      FROM match_events me
      LEFT JOIN players p ON me.player_id = p.id
      WHERE me.match_id = ANY(${matchIds})
      ORDER BY me.minute, me.added_time
    `);
    return (rows as any[]) as MatchEvent[];
  } catch (error) {
    console.error('Failed to fetch match events:', error);
    return [];
  }
}

function groupByCompetition(matches: LiveMatch[]): Record<string, LiveMatch[]> {
  const groups: Record<string, LiveMatch[]> = {};
  for (const m of matches) {
    const key = m.competition_name || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}

interface PageProps {
  searchParams: Promise<{ competition?: string }>;
}

export default async function LiveScoresPage({ searchParams }: PageProps) {
  const { competition } = await searchParams;

  // Count live matches from DB
  const liveStatuses = ['live', 'halftime', 'extra_time', 'penalties'];
  const liveCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(inArray(matches.status, liveStatuses));
  const liveCount = Number(liveCountResult[0]?.count || 0);

  // Find next upcoming match if none live
  let nextMatch: { kickoff: Date } | null = null;
  if (liveCount === 0) {
    const upcoming = await db.query.matches.findFirst({
      where: gt(matches.kickoff, new Date()),
      orderBy: (matches, { asc }) => [asc(matches.kickoff)],
      columns: { kickoff: true },
    });
    nextMatch = upcoming || null;
  }

  // Calculate time until next match
  let timeUntilNext = '';
  if (nextMatch) {
    const diff = new Date(nextMatch.kickoff).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      timeUntilNext = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      timeUntilNext = `${hours}h ${minutes}m`;
    } else {
      timeUntilNext = `${minutes} minutes`;
    }
  }

  // Fetch live match details and events
  const allLiveMatches = await getLiveMatches();
  const liveMatches = competition
    ? allLiveMatches.filter(m => m.competition_slug === competition)
    : allLiveMatches;
  const matchIds = liveMatches.map(m => m.id);
  const events = await getMatchEvents(matchIds);
  const grouped = groupByCompetition(liveMatches);
  const competitionNames = Object.keys(grouped);

  // Build events lookup by match ID
  const eventsByMatch: Record<string, MatchEvent[]> = {};
  for (const evt of events) {
    if (!eventsByMatch[evt.match_id]) eventsByMatch[evt.match_id] = [];
    eventsByMatch[evt.match_id].push(evt);
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with prominent LIVE indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Radio className="h-5 w-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">Live Scores</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-zinc-400 text-sm">Real-time scores and match events across all leagues</p>
            </div>
          </div>
        </div>

        {/* Match count / status banner */}
        <div className="mb-6 rounded-lg border border-zinc-700/40 bg-zinc-800/60 px-5 py-4">
          {liveCount > 0 ? (
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {liveCount} match{liveCount !== 1 ? 'es' : ''} live right now
                </p>
                {/* TODO: Add client-side polling for auto-refresh (e.g., revalidate every 30s or use SWR/React Query) */}
                <p className="text-xs text-zinc-400">Refresh the page for the latest scores</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-300">No live matches right now</p>
                <p className="text-xs text-zinc-400">
                  {timeUntilNext
                    ? `Next match in ${timeUntilNext}`
                    : 'Check the fixtures page for upcoming matches'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Competition selector */}
        <CompetitionSelector
          competitions={ALL_COMPETITIONS}
          selectedSlug={competition || ''}
          basePath="/live"
        />

        {/* Live matches grouped by competition */}
        {competitionNames.length > 0 ? (
          <div className="space-y-6">
            {competitionNames.map((compName) => (
              <div key={compName} className="rounded-xl overflow-hidden border border-emerald-500/20">
                {/* Competition header */}
                <div className="flex items-center gap-2.5 bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-700/50">
                  {grouped[compName][0]?.competition_logo && (
                    <Image
                      src={grouped[compName][0].competition_logo!}
                      alt={compName}
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain"
                    />
                  )}
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{compName}</span>
                </div>

                {/* Match cards */}
                <div className="divide-y divide-zinc-800/50">
                  {grouped[compName].map((match) => {
                    const matchGoals = eventsByMatch[match.id] || [];
                    const homeGoals = matchGoals.filter(e => e.club_id === match.home_slug ? false : true); // filter below
                    // Need club IDs not slugs — use raw approach
                    // Goals are already linked by club_id but we display by home/away name

                    return (
                      <div
                        key={match.id}
                        className="bg-zinc-900 hover:bg-zinc-800/50 transition-colors border-l-2 border-l-emerald-500 px-4 py-4"
                      >
                        {/* Match header with minute */}
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>
                            {match.status === 'halftime' ? 'HT' : match.status === 'extra_time' ? 'ET' : match.status === 'penalties' ? 'PEN' : `${match.minute || 0}'`}
                          </span>
                        </div>

                        {/* Teams and score */}
                        <div className="flex items-center justify-center">
                          {/* Home team */}
                          <div className="flex items-center gap-2.5 flex-1 justify-end">
                            <span className="text-sm font-semibold text-white text-right truncate">
                              <span className="hidden sm:inline">{match.home_name}</span>
                              <span className="sm:hidden">{match.home_code || match.home_name?.slice(0, 3).toUpperCase()}</span>
                            </span>
                            {match.home_logo ? (
                              <Image src={match.home_logo} alt={match.home_name} width={28} height={28} className="h-7 w-7 object-contain shrink-0" />
                            ) : (
                              <span className="h-5 w-5 rounded-full shrink-0" style={{ backgroundColor: match.home_color || '#52525b' }} />
                            )}
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-3 mx-5">
                            <span className="text-2xl font-bold text-emerald-400">{match.home_score ?? 0}</span>
                            <span className="text-zinc-600 text-sm">-</span>
                            <span className="text-2xl font-bold text-emerald-400">{match.away_score ?? 0}</span>
                          </div>

                          {/* Away team */}
                          <div className="flex items-center gap-2.5 flex-1">
                            {match.away_logo ? (
                              <Image src={match.away_logo} alt={match.away_name} width={28} height={28} className="h-7 w-7 object-contain shrink-0" />
                            ) : (
                              <span className="h-5 w-5 rounded-full shrink-0" style={{ backgroundColor: match.away_color || '#52525b' }} />
                            )}
                            <span className="text-sm font-semibold text-white truncate">
                              <span className="hidden sm:inline">{match.away_name}</span>
                              <span className="sm:hidden">{match.away_code || match.away_name?.slice(0, 3).toUpperCase()}</span>
                            </span>
                          </div>
                        </div>

                        {/* Half-time score */}
                        {match.home_score_ht != null && match.away_score_ht != null && (
                          <p className="text-center text-[10px] text-zinc-500 mt-1">
                            HT: {match.home_score_ht} - {match.away_score_ht}
                          </p>
                        )}

                        {/* Match timeline — all events */}
                        {matchGoals.length > 0 && (
                          <div className="mt-3 flex flex-col items-center gap-0.5">
                            {matchGoals.map((evt, i) => {
                              const isGoal = ['goal', 'own_goal', 'penalty_scored'].includes(evt.event_type);
                              const isCard = ['yellow_card', 'second_yellow', 'red_card'].includes(evt.event_type);
                              const isSub = evt.event_type === 'substitution';
                              const isVar = evt.event_type === 'var_decision';

                              let icon = <Goal className="h-3 w-3 text-emerald-500/70" />;
                              let label = '';
                              if (evt.event_type === 'own_goal') { icon = <Goal className="h-3 w-3 text-red-400/70" />; label = '(OG)'; }
                              else if (evt.event_type === 'penalty_scored') { icon = <Goal className="h-3 w-3 text-emerald-500/70" />; label = '(P)'; }
                              else if (evt.event_type === 'penalty_missed') { icon = <span className="h-3 w-3 text-[10px] text-red-400">✗</span>; label = '(Pen missed)'; }
                              else if (evt.event_type === 'yellow_card') { icon = <span className="inline-block h-3 w-2 rounded-[1px] bg-yellow-400" />; }
                              else if (evt.event_type === 'second_yellow') { icon = <span className="inline-block h-3 w-2 rounded-[1px] bg-yellow-400 ring-1 ring-red-500" />; }
                              else if (evt.event_type === 'red_card') { icon = <span className="inline-block h-3 w-2 rounded-[1px] bg-red-500" />; }
                              else if (isSub) { icon = <span className="text-[10px] text-emerald-400">↔</span>; }
                              else if (isVar) { icon = <span className="text-[9px] font-bold text-blue-400">VAR</span>; }

                              return (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                                <span className="text-zinc-600 w-6 text-right font-mono text-[10px]">
                                  {evt.minute}&apos;{evt.added_time ? `+${evt.added_time}` : ''}
                                </span>
                                {icon}
                                <span>
                                  {evt.player_name || 'Unknown'}
                                  {label && <span className={`ml-1 ${evt.event_type === 'own_goal' ? 'text-red-400' : 'text-amber-400'}`}>{label}</span>}
                                </span>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : liveCount === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-6 py-16 text-center">
            <Radio className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">No matches are currently being played.</p>
            <p className="text-xs text-zinc-500 mt-1">
              {timeUntilNext
                ? `The next match kicks off in ${timeUntilNext}.`
                : 'Check the fixtures page for upcoming matches.'}
            </p>
          </div>
        ) : null}

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/fixtures"
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                View full fixtures
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
          <Link
            href="/tables"
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                League tables
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
