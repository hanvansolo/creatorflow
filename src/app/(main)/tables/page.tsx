// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db, leagueStandings, clubs, competitionSeasons, competitions, seasons } from '@/lib/db';
import { eq, and, asc, sql } from 'drizzle-orm';
import { COMPETITIONS } from '@/lib/constants/competitions';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, ArrowRight, LayoutGrid } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'League Tables - Football Standings',
  'Live league tables for Premier League, La Liga, Serie A, Bundesliga, Champions League and more.',
  '/tables',
  ['league table', 'football standings', 'Premier League table', 'La Liga table', 'Serie A table']
);

interface PageProps {
  searchParams: Promise<{ competition?: string }>;
}

async function getActiveCompetitionSlugs(): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ slug: competitions.slug })
      .from(leagueStandings)
      .innerJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
      .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
      .groupBy(competitions.slug);
    return new Set(rows.map(r => r.slug));
  } catch {
    return new Set();
  }
}

async function getStandings(competitionSlug: string) {
  try {
    const rows = await db
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
        clubName: clubs.name,
        clubSlug: clubs.slug,
        clubCode: clubs.code,
        clubLogo: clubs.logoUrl,
        clubPrimaryColor: clubs.primaryColor,
        competitionType: competitions.type,
      })
      .from(leagueStandings)
      .innerJoin(clubs, eq(leagueStandings.clubId, clubs.id))
      .innerJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
      .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
      .innerJoin(seasons, eq(competitionSeasons.seasonId, seasons.id))
      .where(
        and(
          eq(competitions.slug, competitionSlug),
          eq(seasons.isCurrent, true)
        )
      )
      .orderBy(asc(leagueStandings.position));

    return rows;
  } catch (error) {
    console.error('Failed to fetch standings:', error);
    return [];
  }
}

function getPositionBorder(position: number, type: string) {
  if (type !== 'league') return '';
  if (position <= 4) return 'border-l-2 border-l-blue-500';
  if (position <= 6) return 'border-l-2 border-l-orange-500';
  // Bottom 3 — assumes 20-team league
  if (position >= 18) return 'border-l-2 border-l-red-500';
  return '';
}

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: 'bg-emerald-500/20 text-emerald-400',
    D: 'bg-amber-500/20 text-amber-400',
    L: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${colors[result] || 'bg-zinc-700 text-zinc-400'}`}>
      {result}
    </span>
  );
}

export default async function TablesPage({ searchParams }: PageProps) {
  const { competition } = await searchParams;
  const activeSlugs = await getActiveCompetitionSlugs();

  // Only show competitions that have standings data
  const LEAGUE_COMPETITIONS = COMPETITIONS.filter(c => c.type === 'league' && activeSlugs.has(c.slug));
  const CUP_COMPETITIONS = COMPETITIONS.filter(c => c.type === 'cup' && activeSlugs.has(c.slug));
  const INTL_COMPETITIONS = COMPETITIONS.filter(c => c.type === 'international' && activeSlugs.has(c.slug));

  // Default to first available competition
  const defaultSlug = LEAGUE_COMPETITIONS[0]?.slug || CUP_COMPETITIONS[0]?.slug || INTL_COMPETITIONS[0]?.slug || 'premier-league';
  const selectedSlug = competition || defaultSlug;
  const selected = COMPETITIONS.find(c => c.slug === selectedSlug) || COMPETITIONS[0];
  const standings = await getStandings(selectedSlug);

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">League Tables</h1>
              <p className="text-zinc-400 text-sm">Live standings across all major competitions</p>
            </div>
          </div>
        </div>

        {/* Competition selector — grouped by type */}
        <div className="mb-8 space-y-4">
          {/* Leagues row */}
          {LEAGUE_COMPETITIONS.length > 0 && <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Leagues</h3>
            <div className="flex flex-wrap gap-2">
              {LEAGUE_COMPETITIONS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/tables?competition=${comp.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedSlug === comp.slug
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName}
                </Link>
              ))}
            </div>
          </div>}

          {/* Cups row */}
          {CUP_COMPETITIONS.length > 0 && <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Cups</h3>
            <div className="flex flex-wrap gap-2">
              {CUP_COMPETITIONS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/tables?competition=${comp.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedSlug === comp.slug
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName}
                </Link>
              ))}
            </div>
          </div>}

          {/* International row */}
          {INTL_COMPETITIONS.length > 0 && <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">International</h3>
            <div className="flex flex-wrap gap-2">
              {INTL_COMPETITIONS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/tables?competition=${comp.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedSlug === comp.slug
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName}
                </Link>
              ))}
            </div>
          </div>}
        </div>

        {/* Selected competition info */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
            <p className="text-xs text-zinc-400">{selected.description}</p>
          </div>
          <LayoutGrid className="h-5 w-5 text-zinc-500" />
        </div>

        {/* Standings Table */}
        {standings.length > 0 ? (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/80 border-b border-zinc-700/50">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">#</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Club</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">P</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">W</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">D</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">L</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">GF</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">GA</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-10">GD</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 w-12">Pts</th>
                    <th className="hidden md:table-cell px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {standings.map((row) => {
                    const formArr = (row.form as string[] | null) || [];
                    const lastFive = formArr.slice(-5);
                    return (
                      <tr
                        key={row.clubSlug}
                        className={`bg-zinc-900 hover:bg-zinc-800/50 transition-colors ${getPositionBorder(row.position, row.competitionType)}`}
                      >
                        <td className="px-3 py-2.5 text-center text-zinc-400 font-medium">{row.position}</td>
                        <td className="px-3 py-2.5">
                          <Link href={`/teams/${row.clubSlug}`} className="flex items-center gap-2.5 group">
                            {row.clubLogo ? (
                              <Image
                                src={row.clubLogo}
                                alt={row.clubName}
                                width={24}
                                height={24}
                                className="h-6 w-6 object-contain"
                              />
                            ) : (
                              <div
                                className="h-6 w-6 rounded-full"
                                style={{ backgroundColor: row.clubPrimaryColor || '#52525b' }}
                              />
                            )}
                            <span className="hidden sm:inline text-zinc-200 font-medium group-hover:text-emerald-400 transition-colors">
                              {row.clubName}
                            </span>
                            <span className="sm:hidden text-zinc-200 font-medium group-hover:text-emerald-400 transition-colors">
                              {row.clubCode || row.clubName?.slice(0, 3).toUpperCase()}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-center text-zinc-300">{row.played}</td>
                        <td className="px-3 py-2.5 text-center text-zinc-300">{row.won}</td>
                        <td className="px-3 py-2.5 text-center text-zinc-300">{row.drawn}</td>
                        <td className="px-3 py-2.5 text-center text-zinc-300">{row.lost}</td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-center text-zinc-400">{row.goalsFor}</td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-center text-zinc-400">{row.goalsAgainst}</td>
                        <td className="px-3 py-2.5 text-center text-zinc-300">
                          {(row.goalDifference ?? 0) > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-3 py-2.5 text-center text-white font-bold">{row.points}</td>
                        <td className="hidden md:table-cell px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {lastFive.map((result, i) => (
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
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-6 py-16 text-center">
            <Trophy className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">No standings data available for this competition yet.</p>
            <p className="text-xs text-zinc-500 mt-1">Standings are updated after each matchday.</p>
          </div>
        )}

        {/* Legend — only show for league type */}
        {standings.length > 0 && selected.type === 'league' && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30 px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Key:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-400">Champions League</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-orange-500" />
              <span className="text-xs text-zinc-400">Europa League</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-red-500" />
              <span className="text-xs text-zinc-400">Relegation</span>
            </div>
          </div>
        )}

        {/* Related links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/fixtures?competition=${selected.slug}`}
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
              View Fixtures
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
          <Link
            href="/teams"
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
              View Teams
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
