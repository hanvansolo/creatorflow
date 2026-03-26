// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Trophy,
  MapPin,
  User,
  Calendar,
  Shield,
  Shirt,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  db,
  clubs,
  players,
  leagueStandings,
  competitionSeasons,
  competitions,
  matches,
} from '@/lib/db';
import { eq, and, or, desc } from 'drizzle-orm';
import { generateTeamMetadata, generateAlternates } from '@/lib/seo';
import type { PlayerPosition } from '@/types';

export const dynamic = 'force-dynamic';

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [club] = await db
    .select({
      name: clubs.name,
      country: clubs.country,
      stadium: clubs.stadium,
      logoUrl: clubs.logoUrl,
    })
    .from(clubs)
    .where(eq(clubs.slug, slug))
    .limit(1);

  if (!club) {
    return { title: 'Club Not Found' };
  }

  return {
    ...generateTeamMetadata({
      title: club.name,
      description: `${club.name} football club profile with current squad, league standings, and recent results.`,
      teamName: club.name,
      fullName: club.name,
      nationality: club.country || '',
      baseLocation: club.stadium || '',
      image: club.logoUrl || undefined,
    }),
    alternates: generateAlternates(`/teams/${slug}`),
  };
}

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const POSITION_ORDER: Record<PlayerPosition, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
};

const POSITION_LABELS: Record<PlayerPosition, string> = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
};

async function getClubData(slug: string) {
  const [club] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.slug, slug))
    .limit(1);

  if (!club) return null;

  // Get squad
  const squad = await db
    .select()
    .from(players)
    .where(and(eq(players.currentClubId, club.id), eq(players.isActive, true)));

  // Get league standings for this club
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
      competitionSlug: competitions.slug,
    })
    .from(leagueStandings)
    .innerJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .where(eq(leagueStandings.clubId, club.id));

  // Get last 5 matches
  const recentMatches = await db.query.matches.findMany({
    where: or(eq(matches.homeClubId, club.id), eq(matches.awayClubId, club.id)),
    with: {
      homeClub: true,
      awayClub: true,
    },
    orderBy: desc(matches.kickoff),
    limit: 5,
  });

  return { club, squad, standings, recentMatches };
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
      <p className="text-2xl font-bold" style={{ color: color || '#fff' }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const data = await getClubData(slug);

  if (!data) {
    notFound();
  }

  const { club, squad, standings, recentMatches } = data;
  const clubColor = club.primaryColor || '#10b981';

  // Group players by position
  const grouped = squad.reduce(
    (acc, player) => {
      const pos = player.position as PlayerPosition;
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(player);
      return acc;
    },
    {} as Record<PlayerPosition, typeof squad>
  );

  // Sort positions in order
  const sortedPositions = (Object.keys(grouped) as PlayerPosition[]).sort(
    (a, b) => (POSITION_ORDER[a] ?? 99) - (POSITION_ORDER[b] ?? 99)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="border-b border-zinc-800"
        style={{
          background: `linear-gradient(to bottom, ${clubColor}15, transparent)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/teams"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clubs
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Club Logo */}
            <div className="flex-shrink-0">
              {club.logoUrl ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-zinc-800 p-2">
                  <Image
                    src={club.logoUrl}
                    alt={club.name}
                    fill
                    className="object-contain p-2"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                  style={{ backgroundColor: clubColor }}
                >
                  {(club.shortName || club.name).slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{club.name}</h1>
              {club.shortName && (
                <p className="text-lg text-zinc-400">{club.shortName}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
                {club.stadium && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {club.stadium}
                  </span>
                )}
                {club.manager && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {club.manager}
                  </span>
                )}
                {club.founded && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Est. {club.founded}
                  </span>
                )}
                {club.country && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {club.country}
                  </span>
                )}
              </div>

              {/* Color swatches */}
              {(club.primaryColor || club.secondaryColor) && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Club colours:</span>
                  {club.primaryColor && (
                    <span
                      className="h-5 w-5 rounded-full border border-zinc-700"
                      style={{ backgroundColor: club.primaryColor }}
                    />
                  )}
                  {club.secondaryColor && (
                    <span
                      className="h-5 w-5 rounded-full border border-zinc-700"
                      style={{ backgroundColor: club.secondaryColor }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-2">
            {/* League Standings */}
            {standings.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">
                  League Position
                </h2>
                <div className="space-y-4">
                  {standings.map((standing, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div
                        className="h-1"
                        style={{ backgroundColor: clubColor }}
                      />
                      <CardContent className="p-4">
                        <p className="mb-3 text-sm font-medium text-zinc-400">
                          {standing.competitionName}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                          <StatBox
                            label="Position"
                            value={standing.position ?? '-'}
                            color={clubColor}
                          />
                          <StatBox label="Points" value={standing.points ?? 0} />
                          <StatBox label="Played" value={standing.played ?? 0} />
                          <StatBox label="Won" value={standing.won ?? 0} />
                          <StatBox
                            label="GD"
                            value={
                              (standing.goalDifference ?? 0) > 0
                                ? `+${standing.goalDifference}`
                                : String(standing.goalDifference ?? 0)
                            }
                          />
                        </div>
                        {/* Form */}
                        {standing.form != null &&
                          Array.isArray(standing.form) &&
                          (standing.form as string[]).length > 0 ? (
                            <div className="mt-3 flex items-center gap-1">
                              <span className="mr-2 text-xs text-zinc-500">
                                Form:
                              </span>
                              {(standing.form as string[]).map((result, j) => (
                                <span
                                  key={j}
                                  className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                                    result === 'W'
                                      ? 'bg-emerald-600/20 text-emerald-400'
                                      : result === 'D'
                                        ? 'bg-zinc-600/20 text-zinc-400'
                                        : 'bg-red-600/20 text-red-400'
                                  }`}
                                >
                                  {result}
                                </span>
                              ))}
                            </div>
                          ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Squad */}
            {squad.length > 0 ? (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">
                  Squad ({squad.length} players)
                </h2>
                <div className="space-y-6">
                  {sortedPositions.map((pos) => (
                    <div key={pos}>
                      <h3
                        className="mb-2 text-sm font-semibold uppercase tracking-wider"
                        style={{ color: clubColor }}
                      >
                        {POSITION_LABELS[pos] || pos} ({grouped[pos].length})
                      </h3>
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs text-zinc-500">
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Player</th>
                              <th className="hidden px-3 py-2 text-left sm:table-cell">
                                Nationality
                              </th>
                              <th className="px-3 py-2 text-left">Age</th>
                              <th className="hidden px-3 py-2 text-left sm:table-cell">
                                Position
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {grouped[pos]
                              .sort(
                                (a, b) =>
                                  (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
                              )
                              .map((player) => (
                                <tr
                                  key={player.id}
                                  className="transition-colors hover:bg-zinc-800/50"
                                >
                                  <td className="px-3 py-2">
                                    <span
                                      className="text-sm font-bold"
                                      style={{ color: clubColor }}
                                    >
                                      {player.shirtNumber ?? '-'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Link
                                      href={`/players/${player.slug}`}
                                      className="text-sm font-medium text-white hover:text-emerald-400"
                                    >
                                      {player.knownAs ||
                                        `${player.firstName} ${player.lastName}`}
                                    </Link>
                                  </td>
                                  <td className="hidden px-3 py-2 text-sm text-zinc-400 sm:table-cell">
                                    {player.nationality || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-zinc-400">
                                    {player.dateOfBirth
                                      ? calculateAge(player.dateOfBirth)
                                      : '-'}
                                  </td>
                                  <td className="hidden px-3 py-2 text-sm text-zinc-400 sm:table-cell">
                                    {player.detailedPosition || player.position}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Shirt className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
                  <p className="text-zinc-400">No squad data available</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Club Info */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 text-lg font-bold text-white">
                  Club Information
                </h3>
                <div className="space-y-0 divide-y divide-zinc-800">
                  {club.stadium && (
                    <div className="flex items-center gap-3 py-3">
                      <MapPin className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="text-xs text-zinc-500">Stadium</p>
                        <p className="text-sm text-white">{club.stadium}</p>
                      </div>
                    </div>
                  )}
                  {club.manager && (
                    <div className="flex items-center gap-3 py-3">
                      <User className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="text-xs text-zinc-500">Manager</p>
                        <p className="text-sm text-white">{club.manager}</p>
                      </div>
                    </div>
                  )}
                  {club.founded && (
                    <div className="flex items-center gap-3 py-3">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="text-xs text-zinc-500">Founded</p>
                        <p className="text-sm text-white">{club.founded}</p>
                      </div>
                    </div>
                  )}
                  {club.country && (
                    <div className="flex items-center gap-3 py-3">
                      <Shield className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="text-xs text-zinc-500">Country</p>
                        <p className="text-sm text-white">{club.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Matches */}
            {recentMatches.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Recent Matches
                  </h3>
                  <div className="space-y-3">
                    {recentMatches.map((match) => {
                      const isHome = match.homeClubId === club.id;
                      const opponent = isHome ? match.awayClub : match.homeClub;
                      const clubScore = isHome
                        ? match.homeScore
                        : match.awayScore;
                      const opponentScore = isHome
                        ? match.awayScore
                        : match.homeScore;
                      const hasScore =
                        clubScore !== null && opponentScore !== null;
                      const result = hasScore
                        ? clubScore! > opponentScore!
                          ? 'W'
                          : clubScore! < opponentScore!
                            ? 'L'
                            : 'D'
                        : null;

                      return (
                        <div
                          key={match.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                        >
                          {result && (
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                                result === 'W'
                                  ? 'bg-emerald-600/20 text-emerald-400'
                                  : result === 'D'
                                    ? 'bg-zinc-600/20 text-zinc-400'
                                    : 'bg-red-600/20 text-red-400'
                              }`}
                            >
                              {result}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">
                              {isHome ? 'vs' : '@'}{' '}
                              {opponent?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(match.kickoff).toLocaleDateString(
                                'en-GB',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                          {hasScore && (
                            <span className="text-sm font-bold text-white">
                              {clubScore} - {opponentScore}
                            </span>
                          )}
                          {!hasScore && (
                            <span className="text-xs text-zinc-500">
                              {match.status}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
