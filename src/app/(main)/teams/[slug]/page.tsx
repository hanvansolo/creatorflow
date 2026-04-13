// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Shield, MapPin, Calendar, Users, ArrowRight, Newspaper, GitCompareArrows, Trophy, Shirt, Swords, BarChart3, Target, TrendingUp } from 'lucide-react';
import { db, clubs, venues, newsArticles, players, leagueStandings, competitionSeasons, competitions, matches, seasons } from '@/lib/db';
import { eq, ilike, or, desc, sql, and, asc } from 'drizzle-orm';
import { getOrLoadSquad } from '@/lib/api/player-loader';
import { getTeamStatistics } from '@/lib/api/football-api';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
const POSITION_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  GK: { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', label: 'Goalkeepers' },
  DEF: { color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', label: 'Defenders' },
  MID: { color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', label: 'Midfielders' },
  FWD: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Forwards' },
};

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  });

  if (!club) return { title: 'Club Not Found | Footy Feed' };

  return createPageMetadata(
    `${club.name} - Squad, Stats & Fixtures`,
    `${club.name} squad, player stats, fixtures, results, and league standings. ${club.stadium ? `Home ground: ${club.stadium}.` : ''}`,
    `/teams/${slug}`,
    [club.name, club.shortName || '', 'squad', 'fixtures', 'stats'].filter(Boolean)
  );
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  });

  if (!club) notFound();

  // Fetch venue info for stadium capacity
  let venue = null;
  if (club.stadium) {
    venue = await db.query.venues.findFirst({
      where: ilike(venues.name, `%${club.stadium}%`),
    });
  }

  // Fetch squad players — on-demand loader fetches from API if not cached
  const allSquad = await getOrLoadSquad(club.id);
  const squad = allSquad
    .filter((p: any) => p.isActive !== false)
    .sort((a: any, b: any) => {
      const posOrder = ['GK', 'DEF', 'MID', 'FWD'];
      const posA = posOrder.indexOf(a.position) >= 0 ? posOrder.indexOf(a.position) : 99;
      const posB = posOrder.indexOf(b.position) >= 0 ? posOrder.indexOf(b.position) : 99;
      if (posA !== posB) return posA - posB;
      return (a.lastName || '').localeCompare(b.lastName || '');
    });

  // Fetch league standings for this club
  const standings = await db
    .select({
      position: leagueStandings.position,
      played: leagueStandings.played,
      won: leagueStandings.won,
      drawn: leagueStandings.drawn,
      lost: leagueStandings.lost,
      goalsFor: leagueStandings.goalsFor,
      goalsAgainst: leagueStandings.goalsAgainst,
      goalDifference: leagueStandings.goalDifference,
      points: leagueStandings.points,
      form: leagueStandings.form,
      competitionName: competitions.name,
      competitionShortName: competitions.shortName,
    })
    .from(leagueStandings)
    .innerJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .where(eq(leagueStandings.clubId, club.id));

  // Fetch last 5 matches using raw SQL for multiple club joins
  const recentMatches = await db.execute(sql`
    SELECT
      m.id,
      m.kickoff,
      m.home_score,
      m.away_score,
      m.status,
      m.home_club_id,
      m.away_club_id,
      hc.name AS home_club_name,
      hc.slug AS home_club_slug,
      hc.logo_url AS home_club_logo,
      ac.name AS away_club_name,
      ac.slug AS away_club_slug,
      ac.logo_url AS away_club_logo
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    WHERE (m.home_club_id = ${club.id} OR m.away_club_id = ${club.id})
      AND m.status = 'finished'
    ORDER BY m.kickoff DESC
    LIMIT 5
  `) as any[];

  // Fetch related news articles mentioning the club
  const relatedNews = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
    })
    .from(newsArticles)
    .where(
      or(
        ilike(newsArticles.title, `%${club.name}%`),
        club.shortName ? ilike(newsArticles.title, `%${club.shortName}%`) : undefined,
        sql`${club.name} = ANY(${newsArticles.tags})`
      )
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(3);

  // Fetch team statistics from API-Football
  let teamStats: any = null;
  if (club.apiFootballId && standings.length > 0) {
    try {
      // Get the league's apiFootballId and season from the first standing's competition
      const compSeasonInfo = await db
        .select({
          leagueApiId: competitions.apiFootballId,
          seasonYear: competitionSeasons.apiFootballSeason,
        })
        .from(leagueStandings)
        .innerJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
        .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
        .where(eq(leagueStandings.clubId, club.id))
        .limit(1);

      if (compSeasonInfo.length > 0 && compSeasonInfo[0].leagueApiId && compSeasonInfo[0].seasonYear) {
        const statsResult = await getTeamStatistics(
          club.apiFootballId,
          compSeasonInfo[0].seasonYear,
          compSeasonInfo[0].leagueApiId
        );
        if (statsResult && statsResult.length > 0) {
          teamStats = statsResult[0];
        }
      }
    } catch (e) {
      // Silently fail — stats sections just won't render
      console.error('Failed to fetch team statistics:', e);
    }
  }

  const primaryColor = club.primaryColor || '#059669';
  const secondaryColor = club.secondaryColor || '#10b981';

  // Group squad by position
  const squadByPosition: Record<string, typeof squad> = {};
  for (const pos of POSITION_ORDER) {
    const posPlayers = squad.filter((p) => p.position === pos);
    if (posPlayers.length > 0) squadByPosition[pos] = posPlayers;
  }

  // Helper to determine match result for this club
  function getResult(match: any): { label: string; color: string } {
    const isHome = match.home_club_id === club.id;
    const hs = match.home_score ?? 0;
    const as_ = match.away_score ?? 0;
    if (hs === as_) return { label: 'D', color: 'bg-zinc-500' };
    if (isHome) return hs > as_ ? { label: 'W', color: 'bg-emerald-500' } : { label: 'L', color: 'bg-red-500' };
    return as_ > hs ? { label: 'W', color: 'bg-emerald-500' } : { label: 'L', color: 'bg-red-500' };
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Full-width gradient banner */}
      <div
        className="relative h-36 sm:h-44"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30 0%, ${secondaryColor}15 50%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
      </div>

      <div className="mx-auto max-w-5xl px-4 -mt-20 relative z-10 sm:px-6 lg:px-8 pb-12">
        {/* Back link */}
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Teams
        </Link>

        {/* Club header */}
        <div className="mb-6 flex items-center gap-5">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-zinc-900/80 backdrop-blur-sm shadow-xl"
            style={{ borderColor: primaryColor }}
          >
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={club.name} className="h-14 w-14 object-contain" />
            ) : (
              <Shield className="h-10 w-10" style={{ color: primaryColor }} />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{club.name}</h1>
            {club.manager && (
              <p className="text-sm text-zinc-400 mt-0.5">Manager: {club.manager}</p>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {club.founded && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Founded</span>
              </div>
              <p className="text-lg font-semibold text-white">{club.founded}</p>
            </div>
          )}
          {club.stadium && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Stadium</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{club.stadium}</p>
            </div>
          )}
          {venue?.capacity && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Capacity</span>
              </div>
              <p className="text-lg font-semibold text-white">{venue.capacity.toLocaleString()}</p>
            </div>
          )}
          {club.country && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Country</span>
              </div>
              <p className="text-sm font-semibold text-white">{club.country}</p>
            </div>
          )}
        </div>

        {/* League Standing */}
        {standings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">League Standing</h2>
            </div>
            <div className="space-y-3">
              {standings.map((s, i) => (
                <div key={i} className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-4">
                  <p className="text-xs font-medium text-emerald-400 mb-3">{s.competitionName}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Pos</p>
                      <p className="text-xl font-bold text-white">{s.position}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Pts</p>
                      <p className="text-xl font-bold text-emerald-400">{s.points}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Played</p>
                      <p className="text-lg font-semibold text-white">{s.played}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">W</p>
                      <p className="text-lg font-semibold text-emerald-400">{s.won}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">D</p>
                      <p className="text-lg font-semibold text-zinc-300">{s.drawn}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">L</p>
                      <p className="text-lg font-semibold text-red-400">{s.lost}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">GD</p>
                      <p className={`text-lg font-semibold ${(s.goalDifference ?? 0) > 0 ? 'text-emerald-400' : (s.goalDifference ?? 0) < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {(s.goalDifference ?? 0) > 0 ? '+' : ''}{s.goalDifference}
                      </p>
                    </div>
                  </div>
                  {/* Form badges */}
                  {s.form && Array.isArray(s.form) && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Form</span>
                      {(s.form as string[]).map((result, fi) => (
                        <span
                          key={fi}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white ${
                            result === 'W' ? 'bg-emerald-500' : result === 'D' ? 'bg-zinc-500' : 'bg-red-500'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Season Overview Cards */}
        {teamStats && teamStats.fixtures && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Season Statistics</h2>
            </div>

            {/* Key stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Played</p>
                <p className="text-2xl font-bold text-white">{teamStats.fixtures.played.total}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Won</p>
                <p className="text-2xl font-bold text-emerald-400">{teamStats.fixtures.wins.total}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Drew</p>
                <p className="text-2xl font-bold text-zinc-300">{teamStats.fixtures.draws.total}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Lost</p>
                <p className="text-2xl font-bold text-red-400">{teamStats.fixtures.loses.total}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Win %</p>
                <p className="text-2xl font-bold text-white">
                  {teamStats.fixtures.played.total > 0
                    ? Math.round((teamStats.fixtures.wins.total / teamStats.fixtures.played.total) * 100)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Goals For</p>
                <p className="text-2xl font-bold text-emerald-400">{teamStats.goals.for.total.total}</p>
                <p className="text-xs text-zinc-500">avg {teamStats.goals.for.average.total}/game</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Goals Against</p>
                <p className="text-2xl font-bold text-red-400">{teamStats.goals.against.total.total}</p>
                <p className="text-xs text-zinc-500">avg {teamStats.goals.against.average.total}/game</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Goal Diff</p>
                {(() => {
                  const gd = teamStats.goals.for.total.total - teamStats.goals.against.total.total;
                  return (
                    <p className={`text-2xl font-bold ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                      {gd > 0 ? '+' : ''}{gd}
                    </p>
                  );
                })()}
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Clean Sheets</p>
                <p className="text-2xl font-bold text-white">{teamStats.clean_sheet.total}</p>
                <p className="text-xs text-zinc-500">{teamStats.failed_to_score.total} failed to score</p>
              </div>
            </div>

            {/* Form badges */}
            {teamStats.form && (
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Season Form</p>
                <div className="flex flex-wrap gap-1">
                  {teamStats.form.split('').map((r: string, i: number) => (
                    <span
                      key={i}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white ${
                        r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-zinc-500' : 'bg-red-500'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Win % Home vs Away */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Home Win %</p>
                <p className="text-xl font-bold text-emerald-400">
                  {teamStats.fixtures.played.home > 0
                    ? Math.round((teamStats.fixtures.wins.home / teamStats.fixtures.played.home) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-zinc-500">{teamStats.fixtures.wins.home}W from {teamStats.fixtures.played.home} games</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Away Win %</p>
                <p className="text-xl font-bold text-blue-400">
                  {teamStats.fixtures.played.away > 0
                    ? Math.round((teamStats.fixtures.wins.away / teamStats.fixtures.played.away) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-zinc-500">{teamStats.fixtures.wins.away}W from {teamStats.fixtures.played.away} games</p>
              </div>
            </div>
          </div>
        )}

        {/* Goals by Time Period */}
        {teamStats && teamStats.goals && teamStats.goals.for.minute && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Goals by Time Period</h2>
            </div>
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-4">
              <div className="space-y-3">
                {['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'].map((period) => {
                  const scored = teamStats.goals.for.minute[period]?.total ?? 0;
                  const conceded = teamStats.goals.against.minute[period]?.total ?? 0;
                  const maxGoals = Math.max(
                    ...['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'].flatMap((p) => [
                      teamStats.goals.for.minute[p]?.total ?? 0,
                      teamStats.goals.against.minute[p]?.total ?? 0,
                    ])
                  );
                  const maxBarWidth = maxGoals > 0 ? maxGoals : 1;
                  return (
                    <div key={period} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-12 text-right font-mono">{period}'</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 rounded-sm bg-emerald-500/80"
                            style={{ width: `${(scored / maxBarWidth) * 100}%`, minWidth: scored > 0 ? '8px' : '0' }}
                          />
                          <span className="text-xs text-emerald-400 font-medium w-5">{scored}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 rounded-sm bg-red-500/60"
                            style={{ width: `${(conceded / maxBarWidth) * 100}%`, minWidth: conceded > 0 ? '8px' : '0' }}
                          />
                          <span className="text-xs text-red-400 font-medium w-5">{conceded}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-700/40">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/80" />
                  <span className="text-[10px] text-zinc-400">Scored</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-red-500/60" />
                  <span className="text-[10px] text-zinc-400">Conceded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home vs Away Split */}
        {teamStats && teamStats.fixtures && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Home vs Away</h2>
            </div>
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-700/40">
                    <th className="py-2.5 px-4 text-left"></th>
                    <th className="py-2.5 px-3 text-center">P</th>
                    <th className="py-2.5 px-3 text-center">W</th>
                    <th className="py-2.5 px-3 text-center">D</th>
                    <th className="py-2.5 px-3 text-center">L</th>
                    <th className="py-2.5 px-3 text-center">GF</th>
                    <th className="py-2.5 px-3 text-center">GA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-2.5 px-4 font-medium text-emerald-400">Home</td>
                    <td className="py-2.5 px-3 text-center text-white">{teamStats.fixtures.played.home}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">{teamStats.fixtures.wins.home}</td>
                    <td className="py-2.5 px-3 text-center text-zinc-300">{teamStats.fixtures.draws.home}</td>
                    <td className="py-2.5 px-3 text-center text-red-400">{teamStats.fixtures.loses.home}</td>
                    <td className="py-2.5 px-3 text-center text-white">{teamStats.goals.for.total.home}</td>
                    <td className="py-2.5 px-3 text-center text-zinc-300">{teamStats.goals.against.total.home}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-blue-400">Away</td>
                    <td className="py-2.5 px-3 text-center text-white">{teamStats.fixtures.played.away}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">{teamStats.fixtures.wins.away}</td>
                    <td className="py-2.5 px-3 text-center text-zinc-300">{teamStats.fixtures.draws.away}</td>
                    <td className="py-2.5 px-3 text-center text-red-400">{teamStats.fixtures.loses.away}</td>
                    <td className="py-2.5 px-3 text-center text-white">{teamStats.goals.for.total.away}</td>
                    <td className="py-2.5 px-3 text-center text-zinc-300">{teamStats.goals.against.total.away}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Biggest Results */}
        {teamStats && teamStats.biggest && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Biggest Results</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {teamStats.biggest.wins.home && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Biggest Home Win</p>
                  <p className="text-lg font-bold text-emerald-400">{teamStats.biggest.wins.home}</p>
                </div>
              )}
              {teamStats.biggest.wins.away && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Biggest Away Win</p>
                  <p className="text-lg font-bold text-emerald-400">{teamStats.biggest.wins.away}</p>
                </div>
              )}
              {teamStats.biggest.loses.home && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Biggest Home Loss</p>
                  <p className="text-lg font-bold text-red-400">{teamStats.biggest.loses.home}</p>
                </div>
              )}
              {teamStats.biggest.loses.away && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Biggest Away Loss</p>
                  <p className="text-lg font-bold text-red-400">{teamStats.biggest.loses.away}</p>
                </div>
              )}
              {teamStats.biggest.streak.wins > 0 && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Longest Win Streak</p>
                  <p className="text-lg font-bold text-emerald-400">{teamStats.biggest.streak.wins} games</p>
                </div>
              )}
              {(teamStats.biggest.streak.wins + teamStats.biggest.streak.draws) > 0 && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Longest Unbeaten</p>
                  <p className="text-lg font-bold text-blue-400">
                    {(() => {
                      // The API gives streak.wins and streak.draws separately
                      // For longest unbeaten, we show the form string length minus losses
                      const form = teamStats.form || '';
                      let maxUnbeaten = 0;
                      let current = 0;
                      for (const c of form) {
                        if (c !== 'L') { current++; maxUnbeaten = Math.max(maxUnbeaten, current); }
                        else { current = 0; }
                      }
                      return maxUnbeaten > 0 ? `${maxUnbeaten} games` : '-';
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Most Used Formations */}
        {teamStats && teamStats.lineups && teamStats.lineups.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Most Used Formations</h2>
            </div>
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-4 space-y-3">
              {(() => {
                const totalPlayed = teamStats.lineups.reduce((sum: number, l: any) => sum + l.played, 0);
                return teamStats.lineups.map((lineup: any, i: number) => {
                  const pct = totalPlayed > 0 ? Math.round((lineup.played / totalPlayed) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-white w-16">{lineup.formation}</span>
                      <div className="flex-1 h-6 bg-zinc-700/30 rounded-sm overflow-hidden relative">
                        <div
                          className="h-full bg-emerald-500/40 rounded-sm"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs text-zinc-300 font-medium">
                          {lineup.played} games ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Penalty Record */}
        {teamStats && teamStats.penalty && teamStats.penalty.total > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Penalty Record</h2>
            </div>
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Scored</p>
                  <p className="text-2xl font-bold text-emerald-400">{teamStats.penalty.scored.total}</p>
                  <p className="text-xs text-zinc-500">{teamStats.penalty.scored.percentage}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Missed</p>
                  <p className="text-2xl font-bold text-red-400">{teamStats.penalty.missed.total}</p>
                  <p className="text-xs text-zinc-500">{teamStats.penalty.missed.percentage}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{teamStats.penalty.total}</p>
                  <p className="text-xs text-zinc-500">
                    {teamStats.penalty.total > 0
                      ? `${Math.round((teamStats.penalty.scored.total / teamStats.penalty.total) * 100)}% accuracy`
                      : '-'}
                  </p>
                </div>
              </div>
              {/* Visual accuracy bar */}
              <div className="mt-4">
                <div className="h-3 bg-zinc-700/30 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${teamStats.penalty.total > 0 ? (teamStats.penalty.scored.total / teamStats.penalty.total) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${teamStats.penalty.total > 0 ? (teamStats.penalty.missed.total / teamStats.penalty.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Swords className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Recent Results</h2>
            </div>
            <div className="space-y-2">
              {recentMatches.map((m: any) => {
                const result = getResult(m);
                const isHome = m.home_club_id === club.id;
                const opponent = isHome
                  ? { name: m.away_club_name, slug: m.away_club_slug, logo: m.away_club_logo }
                  : { name: m.home_club_name, slug: m.home_club_slug, logo: m.home_club_logo };
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white ${result.color}`}>
                      {result.label}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-zinc-500">{isHome ? 'vs' : '@'}</span>
                      {opponent.logo && (
                        <img src={opponent.logo} alt="" className="h-5 w-5 object-contain" />
                      )}
                      <Link href={`/teams/${opponent.slug}`} className="text-sm font-medium text-zinc-200 hover:text-white transition-colors truncate">
                        {opponent.name}
                      </Link>
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {m.home_score} - {m.away_score}
                    </span>
                    <span className="text-xs text-zinc-500 hidden sm:block">
                      {new Date(m.kickoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Squad */}
        {Object.keys(squadByPosition).length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shirt className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Squad</h2>
              <span className="text-xs text-zinc-500 ml-1">{squad.length} players</span>
            </div>
            <div className="space-y-6">
              {POSITION_ORDER.map((pos) => {
                const group = squadByPosition[pos];
                if (!group) return null;
                const style = POSITION_STYLES[pos];
                return (
                  <div key={pos}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${style.bg} ${style.color}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-zinc-500">{group.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-700/40">
                            <th className="py-2 px-2 text-left w-10">#</th>
                            <th className="py-2 px-2 text-left">Name</th>
                            <th className="py-2 px-2 text-left hidden sm:table-cell">Nationality</th>
                            <th className="py-2 px-2 text-center hidden sm:table-cell">Age</th>
                            <th className="py-2 px-2 text-left hidden md:table-cell">Position</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((p) => (
                            <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors">
                              <td className="py-2.5 px-2 text-zinc-400 font-medium">{p.shirtNumber ?? '-'}</td>
                              <td className="py-2.5 px-2">
                                <Link href={`/players/${p.slug}`} className="font-medium text-zinc-200 hover:text-emerald-400 transition-colors">
                                  {p.knownAs || `${p.firstName} ${p.lastName}`}
                                </Link>
                              </td>
                              <td className="py-2.5 px-2 text-zinc-400 hidden sm:table-cell">{p.nationality || '-'}</td>
                              <td className="py-2.5 px-2 text-center text-zinc-400 hidden sm:table-cell">{calcAge(p.dateOfBirth) ?? '-'}</td>
                              <td className="py-2.5 px-2 text-zinc-400 hidden md:table-cell">{p.detailedPosition || pos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Squad data is being synced. Check back soon.</p>
          </div>
        )}

        {/* Related news */}
        {relatedNews.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Latest News</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group rounded-lg bg-zinc-800/60 border border-zinc-700/40 overflow-hidden hover:border-emerald-500/30 transition-colors"
                >
                  {article.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                      {article.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1.5">
                      {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Compare link */}
        <div className="mt-6">
          <Link
            href={`/compare?team1=${slug}`}
            className="group inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-3 hover:border-emerald-500/30 transition-colors"
          >
            <GitCompareArrows className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
              Compare with another team
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
