import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { db, competitions, competitionSeasons, matches, clubs, seasons } from '@/lib/db';
import { eq, and, gte, lte, asc, sql, inArray } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import type { MatchStatus } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Fixtures & Results - Football Match Schedule',
  'Upcoming football fixtures, live scores, and recent results. Premier League, Champions League, La Liga, Serie A, and more.',
  '/fixtures',
  ['football fixtures', 'match schedule', 'football results', 'Premier League fixtures', 'upcoming matches', 'football scores']
);

interface MatchRow {
  id: string;
  kickoff: Date;
  status: string | null;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  round: string | null;
  slug: string;
  homeClubName: string;
  homeClubShortName: string | null;
  homeClubCode: string | null;
  homeClubPrimaryColor: string | null;
  awayClubName: string;
  awayClubShortName: string | null;
  awayClubCode: string | null;
  awayClubPrimaryColor: string | null;
  competitionName: string;
  competitionSlug: string;
  competitionShortName: string | null;
}

async function getCompetitions() {
  const comps = await db
    .select({
      id: competitions.id,
      name: competitions.name,
      slug: competitions.slug,
      shortName: competitions.shortName,
    })
    .from(competitions)
    .where(eq(competitions.isActive, true))
    .orderBy(asc(competitions.tier), asc(competitions.name));

  return comps;
}

async function getFixtures(competitionSlug?: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Aliases for home and away clubs
  const homeClub = clubs;
  // We need a SQL alias approach for away club
  // Use two separate joins with aliased selects

  const conditions = [
    gte(matches.kickoff, weekAgo),
    lte(matches.kickoff, twoWeeksAhead),
  ];

  // If filtering by competition, find the competition first
  if (competitionSlug) {
    const [comp] = await db
      .select({ id: competitions.id })
      .from(competitions)
      .where(eq(competitions.slug, competitionSlug))
      .limit(1);

    if (comp) {
      const compSeasonIds = await db
        .select({ id: competitionSeasons.id })
        .from(competitionSeasons)
        .innerJoin(seasons, eq(competitionSeasons.seasonId, seasons.id))
        .where(
          and(
            eq(competitionSeasons.competitionId, comp.id),
            eq(seasons.isCurrent, true)
          )
        );

      if (compSeasonIds.length > 0) {
        conditions.push(
          inArray(
            matches.competitionSeasonId,
            compSeasonIds.map((cs) => cs.id)
          )
        );
      }
    }
  }

  // Query matches - we'll do a raw approach to get both home and away clubs
  const matchRows = await db.execute(sql`
    SELECT
      m.id,
      m.kickoff,
      m.status,
      m.minute,
      m.home_score,
      m.away_score,
      m.round,
      m.slug,
      hc.name as home_club_name,
      hc.short_name as home_club_short_name,
      hc.code as home_club_code,
      hc.primary_color as home_club_primary_color,
      ac.name as away_club_name,
      ac.short_name as away_club_short_name,
      ac.code as away_club_code,
      ac.primary_color as away_club_primary_color,
      comp.name as competition_name,
      comp.slug as competition_slug,
      comp.short_name as competition_short_name
    FROM matches m
    INNER JOIN clubs hc ON m.home_club_id = hc.id
    INNER JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    WHERE m.kickoff >= ${weekAgo.toISOString()}
      AND m.kickoff <= ${twoWeeksAhead.toISOString()}
      ${competitionSlug ? sql`AND comp.slug = ${competitionSlug}` : sql``}
    ORDER BY m.kickoff ASC
  `);

  return (matchRows.rows || []) as unknown as Array<{
    id: string;
    kickoff: string;
    status: string | null;
    minute: number | null;
    home_score: number | null;
    away_score: number | null;
    round: string | null;
    slug: string;
    home_club_name: string;
    home_club_short_name: string | null;
    home_club_code: string | null;
    home_club_primary_color: string | null;
    away_club_name: string;
    away_club_short_name: string | null;
    away_club_code: string | null;
    away_club_primary_color: string | null;
    competition_name: string;
    competition_slug: string;
    competition_short_name: string | null;
  }>;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function StatusBadge({ status, minute }: { status: string; minute?: number | null }) {
  const liveStatuses = ['live', 'halftime', 'extra_time', 'penalties'];
  if (liveStatuses.includes(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {status === 'halftime'
          ? 'HT'
          : status === 'extra_time'
            ? 'ET'
            : status === 'penalties'
              ? 'PEN'
              : minute
                ? `${minute}'`
                : 'LIVE'}
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span className="text-xs font-medium text-zinc-500 uppercase">FT</span>
    );
  }
  if (status === 'postponed') {
    return (
      <span className="text-xs font-medium text-amber-500 uppercase">PPD</span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="text-xs font-medium text-red-500 uppercase">CAN</span>
    );
  }
  return null;
}

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const params = await searchParams;
  const competitionSlug = params.competition;

  const [allCompetitions, matchData] = await Promise.all([
    getCompetitions(),
    getFixtures(competitionSlug),
  ]);

  // Group matches by date
  const grouped = new Map<string, typeof matchData>();
  for (const match of matchData) {
    const dateKey = new Date(match.kickoff).toDateString();
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(match);
  }

  return (
    <div className="min-h-screen">
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
            <Calendar className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Fixtures & Results</h1>
              <p className="mt-1 text-zinc-400">
                Past 7 days and upcoming 14 days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Competition filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/fixtures"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              !competitionSlug
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            All
          </Link>
          {allCompetitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/fixtures?competition=${comp.slug}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                comp.slug === competitionSlug
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {comp.shortName || comp.name}
            </Link>
          ))}
        </div>

        {/* Match list grouped by date */}
        {matchData.length === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-lg text-zinc-400">
              No fixtures found for this period.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateKey, dayMatches]) => (
              <div key={dateKey}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  {formatDate(dayMatches[0].kickoff)}
                </h2>
                <div className="space-y-2">
                  {dayMatches.map((match) => {
                    const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(
                      match.status || ''
                    );
                    const isFinished = match.status === 'finished';
                    const hasScore = match.home_score !== null && match.away_score !== null;

                    return (
                      <div
                        key={match.id}
                        className={`rounded-xl border bg-zinc-800/50 p-4 transition-colors hover:bg-zinc-800 ${
                          isLive
                            ? 'border-emerald-500/30'
                            : 'border-zinc-700/50'
                        }`}
                      >
                        {/* Competition name */}
                        <div className="mb-2 text-xs text-zinc-500">
                          {match.competition_short_name || match.competition_name}
                          {match.round ? ` \u00b7 ${match.round}` : ''}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          {/* Home team */}
                          <div className="flex flex-1 items-center justify-end gap-2 text-right">
                            <span className="font-medium text-white text-sm sm:text-base">
                              <span className="hidden sm:inline">{match.home_club_name}</span>
                              <span className="sm:hidden">
                                {match.home_club_code || match.home_club_short_name || match.home_club_name}
                              </span>
                            </span>
                            {match.home_club_primary_color ? (
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: match.home_club_primary_color }}
                              />
                            ) : (
                              <span className="h-3 w-3 rounded-full shrink-0 bg-zinc-600" />
                            )}
                          </div>

                          {/* Score / Time */}
                          <div className="flex flex-col items-center min-w-[80px]">
                            {hasScore ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xl font-bold ${
                                    isLive ? 'text-emerald-400' : 'text-white'
                                  }`}
                                >
                                  {match.home_score}
                                </span>
                                <span className="text-zinc-500">-</span>
                                <span
                                  className={`text-xl font-bold ${
                                    isLive ? 'text-emerald-400' : 'text-white'
                                  }`}
                                >
                                  {match.away_score}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-zinc-300">
                                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                <span className="text-sm font-medium">
                                  {formatTime(match.kickoff)}
                                </span>
                              </div>
                            )}
                            <StatusBadge
                              status={match.status || 'scheduled'}
                              minute={match.minute}
                            />
                          </div>

                          {/* Away team */}
                          <div className="flex flex-1 items-center gap-2">
                            {match.away_club_primary_color ? (
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: match.away_club_primary_color }}
                              />
                            ) : (
                              <span className="h-3 w-3 rounded-full shrink-0 bg-zinc-600" />
                            )}
                            <span className="font-medium text-white text-sm sm:text-base">
                              <span className="hidden sm:inline">{match.away_club_name}</span>
                              <span className="sm:hidden">
                                {match.away_club_code || match.away_club_short_name || match.away_club_name}
                              </span>
                            </span>
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
      </div>
    </div>
  );
}
