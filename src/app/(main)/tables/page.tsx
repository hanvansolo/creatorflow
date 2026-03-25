import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trophy, Shield } from 'lucide-react';
import { db, competitions, competitionSeasons, leagueStandings, clubs, seasons } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'League Tables - Football Standings 2025/26',
  'Full league tables for the Premier League, La Liga, Serie A, Bundesliga, and Ligue 1. Points, goal difference, form, and qualification zones.',
  '/tables',
  ['league table', 'Premier League table', 'football standings', 'La Liga table', 'Serie A table', 'Bundesliga table']
);

async function getCompetitions() {
  const comps = await db
    .select({
      id: competitions.id,
      name: competitions.name,
      slug: competitions.slug,
      shortName: competitions.shortName,
      country: competitions.country,
      logoUrl: competitions.logoUrl,
    })
    .from(competitions)
    .where(and(eq(competitions.type, 'league'), eq(competitions.isActive, true)))
    .orderBy(asc(competitions.tier), asc(competitions.name));

  return comps;
}

async function getStandings(competitionSlug: string) {
  // Find the competition
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.slug, competitionSlug))
    .limit(1);

  if (!competition) return { standings: [], competition: null };

  // Find the current season's competition season
  const [compSeason] = await db
    .select({
      id: competitionSeasons.id,
      competitionId: competitionSeasons.competitionId,
      seasonId: competitionSeasons.seasonId,
      status: competitionSeasons.status,
      currentMatchday: competitionSeasons.currentMatchday,
      totalMatchdays: competitionSeasons.totalMatchdays,
    })
    .from(competitionSeasons)
    .innerJoin(seasons, eq(competitionSeasons.seasonId, seasons.id))
    .where(
      and(
        eq(competitionSeasons.competitionId, competition.id),
        eq(seasons.isCurrent, true)
      )
    )
    .limit(1);

  if (!compSeason) return { standings: [], competition };

  // Get standings with club info
  const standingsData = await db
    .select({
      id: leagueStandings.id,
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
      group: leagueStandings.group,
      clubId: leagueStandings.clubId,
      clubName: clubs.name,
      clubShortName: clubs.shortName,
      clubSlug: clubs.slug,
      clubCode: clubs.code,
      clubPrimaryColor: clubs.primaryColor,
      clubLogoUrl: clubs.logoUrl,
    })
    .from(leagueStandings)
    .innerJoin(clubs, eq(leagueStandings.clubId, clubs.id))
    .where(eq(leagueStandings.competitionSeasonId, compSeason.id))
    .orderBy(asc(leagueStandings.position));

  return {
    standings: standingsData,
    competition,
    matchday: compSeason.currentMatchday,
    totalMatchdays: compSeason.totalMatchdays,
  };
}

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: 'bg-emerald-500 text-white',
    D: 'bg-amber-500 text-white',
    L: 'bg-red-500 text-white',
  };
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${colors[result] || 'bg-zinc-600 text-zinc-300'}`}
    >
      {result}
    </span>
  );
}

function getPositionBorder(position: number, totalTeams: number) {
  // Champions League spots (top 4)
  if (position <= 4) return 'border-l-2 border-l-blue-500';
  // Europa League spots (5-6)
  if (position <= 6) return 'border-l-2 border-l-orange-500';
  // Relegation zone (bottom 3)
  if (position > totalTeams - 3) return 'border-l-2 border-l-red-500';
  return 'border-l-2 border-l-transparent';
}

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const params = await searchParams;
  const competitionSlug = params.competition || 'premier-league';

  const [allCompetitions, { standings, competition, matchday, totalMatchdays }] =
    await Promise.all([getCompetitions(), getStandings(competitionSlug)]);

  const totalTeams = standings.length;

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
            <Trophy className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">League Tables</h1>
              {competition && matchday && (
                <p className="mt-1 text-zinc-400">
                  {competition.name} &middot; Matchday {matchday}
                  {totalMatchdays ? ` of ${totalMatchdays}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Competition selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {allCompetitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/tables?competition=${comp.slug}`}
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

        {/* Standings table */}
        {standings.length === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-lg text-zinc-400">
              {competition
                ? 'No standings data available yet for this competition.'
                : 'Competition not found. Select a league above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50 bg-zinc-800/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50 text-left text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-3 pl-4 pr-2 w-10">#</th>
                  <th className="py-3 px-2">Club</th>
                  <th className="py-3 px-2 text-center">P</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">W</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">D</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">L</th>
                  <th className="py-3 px-2 text-center hidden md:table-cell">GF</th>
                  <th className="py-3 px-2 text-center hidden md:table-cell">GA</th>
                  <th className="py-3 px-2 text-center">GD</th>
                  <th className="py-3 px-2 text-center font-bold">Pts</th>
                  <th className="py-3 px-2 pr-4 hidden lg:table-cell">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => {
                  const formArray = Array.isArray(row.form) ? (row.form as string[]) : [];
                  const last5 = formArray.slice(-5);

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-zinc-700/30 transition-colors hover:bg-zinc-700/20 ${getPositionBorder(row.position, totalTeams)}`}
                    >
                      <td className="py-3 pl-4 pr-2 text-zinc-400 font-medium">
                        {row.position}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          {row.clubPrimaryColor ? (
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: row.clubPrimaryColor }}
                            />
                          ) : (
                            <span className="h-3 w-3 rounded-full shrink-0 bg-zinc-600" />
                          )}
                          <span className="font-medium text-white whitespace-nowrap">
                            <span className="hidden sm:inline">{row.clubName}</span>
                            <span className="sm:hidden">{row.clubCode || row.clubShortName || row.clubName}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-zinc-300">{row.played ?? 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 hidden sm:table-cell">{row.won ?? 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 hidden sm:table-cell">{row.drawn ?? 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 hidden sm:table-cell">{row.lost ?? 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 hidden md:table-cell">{row.goalsFor ?? 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 hidden md:table-cell">{row.goalsAgainst ?? 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 font-medium">
                        {(row.goalDifference ?? 0) > 0 ? `+${row.goalDifference}` : row.goalDifference ?? 0}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-white">{row.points ?? 0}</td>
                      <td className="py-3 px-2 pr-4 hidden lg:table-cell">
                        <div className="flex gap-1">
                          {last5.map((result, i) => (
                            <FormBadge key={i} result={result} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {standings.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded bg-blue-500" />
              Champions League
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded bg-orange-500" />
              Europa League
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded bg-red-500" />
              Relegation
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
