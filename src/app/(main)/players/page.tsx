import { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  db,
  playerSeasonStats,
  players,
  clubs,
  competitions,
  competitionSeasons,
} from '@/lib/db';
import { eq, desc, asc } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Player Stats - Top Scorers, Assists & Cards',
  'Top football player statistics including leading scorers, assist providers, and disciplinary records across all major leagues.',
  '/players',
  ['top scorers', 'top assists', 'player stats', 'football statistics', 'goals', 'assists', 'yellow cards', 'red cards']
);

type StatView = 'goals' | 'assists' | 'cards';

interface PlayersPageProps {
  searchParams: Promise<{ view?: string; competition?: string }>;
}

async function getPlayerStats(view: StatView, competitionSlug?: string) {
  // Build the base query with joins
  let compSeasonFilter: string | undefined;

  if (competitionSlug) {
    const [comp] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.slug, competitionSlug))
      .limit(1);

    if (comp) {
      const [compSeason] = await db
        .select()
        .from(competitionSeasons)
        .where(eq(competitionSeasons.competitionId, comp.id))
        .orderBy(desc(competitionSeasons.startDate))
        .limit(1);

      if (compSeason) {
        compSeasonFilter = compSeason.id;
      }
    }
  }

  const orderColumn =
    view === 'assists'
      ? desc(playerSeasonStats.assists)
      : view === 'cards'
        ? desc(playerSeasonStats.yellowCards)
        : desc(playerSeasonStats.goals);

  const baseQuery = db
    .select({
      statId: playerSeasonStats.id,
      appearances: playerSeasonStats.appearances,
      goals: playerSeasonStats.goals,
      assists: playerSeasonStats.assists,
      yellowCards: playerSeasonStats.yellowCards,
      redCards: playerSeasonStats.redCards,
      minutesPlayed: playerSeasonStats.minutesPlayed,
      averageRating: playerSeasonStats.averageRating,
      playerId: players.id,
      playerSlug: players.slug,
      firstName: players.firstName,
      lastName: players.lastName,
      knownAs: players.knownAs,
      position: players.position,
      nationality: players.nationality,
      clubId: clubs.id,
      clubName: clubs.name,
      clubSlug: clubs.slug,
      clubShortName: clubs.shortName,
      clubPrimaryColor: clubs.primaryColor,
    })
    .from(playerSeasonStats)
    .innerJoin(players, eq(playerSeasonStats.playerId, players.id))
    .leftJoin(clubs, eq(playerSeasonStats.clubId, clubs.id));

  if (compSeasonFilter) {
    return baseQuery
      .where(eq(playerSeasonStats.competitionSeasonId, compSeasonFilter))
      .orderBy(orderColumn)
      .limit(20);
  }

  return baseQuery.orderBy(orderColumn).limit(20);
}

async function getCompetitions() {
  return db
    .select()
    .from(competitions)
    .where(eq(competitions.isActive, true))
    .orderBy(asc(competitions.name));
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const { view: rawView, competition } = await searchParams;
  const view: StatView =
    rawView === 'assists' || rawView === 'cards' ? rawView : 'goals';

  const [statsData, allCompetitions] = await Promise.all([
    getPlayerStats(view, competition),
    getCompetitions(),
  ]);

  const views: { key: StatView; label: string; icon: typeof Trophy }[] = [
    { key: 'goals', label: 'Top Scorers', icon: Trophy },
    { key: 'assists', label: 'Top Assists', icon: Target },
    { key: 'cards', label: 'Most Cards', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Player Statistics</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            Top performers across the major football leagues
          </p>

          {/* View tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {views.map((v) => {
              const Icon = v.icon;
              const params = new URLSearchParams();
              if (v.key !== 'goals') params.set('view', v.key);
              if (competition) params.set('competition', competition);
              const href = `/players${params.toString() ? `?${params.toString()}` : ''}`;

              return (
                <Link
                  key={v.key}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    view === v.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {v.label}
                </Link>
              );
            })}
          </div>

          {/* Competition filter */}
          {allCompetitions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/players${view !== 'goals' ? `?view=${view}` : ''}`}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  !competition
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                All Leagues
              </Link>
              {allCompetitions.map((comp) => {
                const params = new URLSearchParams();
                if (view !== 'goals') params.set('view', view);
                params.set('competition', comp.slug);

                return (
                  <Link
                    key={comp.id}
                    href={`/players?${params.toString()}`}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      competition === comp.slug
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {comp.shortName || comp.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {statsData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No player stats available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left">Club</th>
                  <th className="hidden px-4 py-3 text-center sm:table-cell">
                    Apps
                  </th>
                  <th className="px-4 py-3 text-center">
                    {view === 'cards' ? 'YC' : 'Goals'}
                  </th>
                  <th className="px-4 py-3 text-center">
                    {view === 'cards' ? 'RC' : 'Assists'}
                  </th>
                  {view !== 'cards' && (
                    <th className="hidden px-4 py-3 text-center md:table-cell">
                      Rating
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {statsData.map((row, index) => {
                  const clubColor = row.clubPrimaryColor || '#666';
                  const displayName =
                    row.knownAs || `${row.firstName} ${row.lastName}`;

                  return (
                    <tr
                      key={row.statId}
                      className="transition-colors hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-bold ${
                            index < 3 ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/players/${row.playerSlug}`}
                          className="text-sm font-medium text-white hover:text-emerald-400"
                        >
                          {displayName}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {row.position}
                          {row.nationality ? ` | ${row.nationality}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: clubColor }}
                          />
                          {row.clubSlug ? (
                            <Link
                              href={`/teams/${row.clubSlug}`}
                              className="text-sm text-zinc-300 hover:text-emerald-400"
                            >
                              {row.clubShortName || row.clubName || '-'}
                            </Link>
                          ) : (
                            <span className="text-sm text-zinc-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-center text-sm text-zinc-400 sm:table-cell">
                        {row.appearances ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-white">
                          {view === 'cards'
                            ? (row.yellowCards ?? 0)
                            : (row.goals ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-zinc-400">
                        {view === 'cards'
                          ? (row.redCards ?? 0)
                          : (row.assists ?? 0)}
                      </td>
                      {view !== 'cards' && (
                        <td className="hidden px-4 py-3 text-center text-sm text-zinc-400 md:table-cell">
                          {row.averageRating
                            ? parseFloat(row.averageRating).toFixed(1)
                            : '-'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
