import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Calendar,
  Ruler,
  Weight,
  Footprints,
  Banknote,
  FileText,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { db, players, clubs, playerSeasonStats, competitions, competitionSeasons } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { generateDriverMetadata, generateAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PlayerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = await db.query.players.findFirst({
    where: eq(players.slug, slug),
    with: { currentClub: true },
  });

  if (!player) {
    return { title: 'Player Not Found' };
  }

  const fullName = player.knownAs || `${player.firstName} ${player.lastName}`;

  return {
    ...generateDriverMetadata({
      title: fullName,
      description: `${fullName} player profile with career statistics, season stats, and club information.`,
      firstName: player.firstName,
      lastName: player.lastName,
      nationality: player.nationality || '',
      team: player.currentClub?.name,
      image: player.headshotUrl || undefined,
    }),
    alternates: generateAlternates(`/players/${slug}`),
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

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  if (num >= 1) return `${num.toFixed(1)}M`;
  return `${(num * 1000).toFixed(0)}K`;
}

async function getPlayerData(slug: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.slug, slug),
    with: { currentClub: true },
  });

  if (!player) return null;

  // Get season stats with competition info
  const stats = await db
    .select({
      statId: playerSeasonStats.id,
      appearances: playerSeasonStats.appearances,
      starts: playerSeasonStats.starts,
      minutesPlayed: playerSeasonStats.minutesPlayed,
      goals: playerSeasonStats.goals,
      assists: playerSeasonStats.assists,
      yellowCards: playerSeasonStats.yellowCards,
      redCards: playerSeasonStats.redCards,
      cleanSheets: playerSeasonStats.cleanSheets,
      averageRating: playerSeasonStats.averageRating,
      competitionName: competitions.name,
      competitionSlug: competitions.slug,
      clubName: clubs.name,
      clubSlug: clubs.slug,
      clubPrimaryColor: clubs.primaryColor,
    })
    .from(playerSeasonStats)
    .innerJoin(competitionSeasons, eq(playerSeasonStats.competitionSeasonId, competitionSeasons.id))
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .leftJoin(clubs, eq(playerSeasonStats.clubId, clubs.id))
    .where(eq(playerSeasonStats.playerId, player.id))
    .orderBy(desc(competitionSeasons.startDate));

  return { player, stats };
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 py-3 last:border-0">
      <Icon className="h-4 w-4 text-zinc-500" />
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;
  const data = await getPlayerData(slug);

  if (!data) {
    notFound();
  }

  const { player, stats } = data;
  const club = player.currentClub;
  const clubColor = club?.primaryColor || '#10b981';
  const fullName = player.knownAs || `${player.firstName} ${player.lastName}`;
  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : null;

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
            href="/players"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Players
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Player Headshot */}
            <div className="flex-shrink-0">
              {player.headshotUrl ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-zinc-800">
                  <Image
                    src={player.headshotUrl}
                    alt={fullName}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              ) : (
                <div
                  className="flex h-32 w-32 items-center justify-center rounded-2xl bg-zinc-800 text-3xl font-bold text-white"
                >
                  {player.firstName.charAt(0)}
                  {player.lastName.charAt(0)}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {player.shirtNumber && (
                  <span
                    className="text-4xl font-bold"
                    style={{ color: clubColor }}
                  >
                    {player.shirtNumber}
                  </span>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">{fullName}</h1>
                  {player.knownAs &&
                    player.knownAs !==
                      `${player.firstName} ${player.lastName}` && (
                      <p className="text-zinc-400">
                        {player.firstName} {player.lastName}
                      </p>
                    )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <span
                  className="rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${clubColor}20`,
                    color: clubColor,
                  }}
                >
                  {player.detailedPosition || player.position}
                </span>
                {player.nationality && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                    {player.nationality}
                  </span>
                )}
                {age !== null && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                    {age} years old
                  </span>
                )}
                {player.preferredFoot && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                    {player.preferredFoot.charAt(0).toUpperCase() +
                      player.preferredFoot.slice(1)}{' '}
                    foot
                  </span>
                )}
              </div>

              {/* Club link */}
              {club && (
                <Link
                  href={`/teams/${club.slug}`}
                  className="mt-4 inline-flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:bg-zinc-800/50"
                >
                  {club.logoUrl ? (
                    <Image
                      src={club.logoUrl}
                      alt={club.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: clubColor }}
                    >
                      {(club.shortName || club.name).slice(0, 3).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-white">
                    {club.name}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Season Stats */}
            {stats.length > 0 ? (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">
                  Season Statistics
                </h2>
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <Card key={stat.statId} className="overflow-hidden">
                      <div
                        className="h-1"
                        style={{
                          backgroundColor: stat.clubPrimaryColor || clubColor,
                        }}
                      />
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-400">
                            {stat.competitionName}
                          </p>
                          {stat.clubName && (
                            <Link
                              href={`/teams/${stat.clubSlug}`}
                              className="text-xs text-zinc-500 hover:text-emerald-400"
                            >
                              {stat.clubName}
                            </Link>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                          <div className="text-center">
                            <p className="text-xl font-bold text-white">
                              {stat.appearances ?? 0}
                            </p>
                            <p className="text-xs text-zinc-500">Apps</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-emerald-400">
                              {stat.goals ?? 0}
                            </p>
                            <p className="text-xs text-zinc-500">Goals</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-white">
                              {stat.assists ?? 0}
                            </p>
                            <p className="text-xs text-zinc-500">Assists</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-white">
                              {stat.minutesPlayed ?? 0}
                            </p>
                            <p className="text-xs text-zinc-500">Minutes</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-xl font-bold text-yellow-400">
                                {stat.yellowCards ?? 0}
                              </span>
                              <span className="text-zinc-600">/</span>
                              <span className="text-xl font-bold text-red-400">
                                {stat.redCards ?? 0}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500">Cards</p>
                          </div>
                          {stat.averageRating && (
                            <div className="text-center">
                              <p className="text-xl font-bold text-white">
                                {parseFloat(stat.averageRating).toFixed(1)}
                              </p>
                              <p className="text-xs text-zinc-500">Rating</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
                  <p className="text-zinc-400">
                    No season statistics available
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player Details */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 text-lg font-bold text-white">
                  Player Details
                </h3>
                <div className="space-y-0">
                  <InfoItem
                    icon={Shield}
                    label="Position"
                    value={player.detailedPosition || player.position}
                  />
                  {player.nationality && (
                    <InfoItem
                      icon={Shield}
                      label="Nationality"
                      value={player.nationality}
                    />
                  )}
                  {player.secondNationality && (
                    <InfoItem
                      icon={Shield}
                      label="2nd Nationality"
                      value={player.secondNationality}
                    />
                  )}
                  {player.dateOfBirth && (
                    <InfoItem
                      icon={Calendar}
                      label="Date of Birth"
                      value={`${new Date(player.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${age !== null ? ` (${age})` : ''}`}
                    />
                  )}
                  {player.height && (
                    <InfoItem
                      icon={Ruler}
                      label="Height"
                      value={`${player.height} cm`}
                    />
                  )}
                  {player.weight && (
                    <InfoItem
                      icon={Weight}
                      label="Weight"
                      value={`${player.weight} kg`}
                    />
                  )}
                  {player.preferredFoot && (
                    <InfoItem
                      icon={Footprints}
                      label="Preferred Foot"
                      value={
                        player.preferredFoot.charAt(0).toUpperCase() +
                        player.preferredFoot.slice(1)
                      }
                    />
                  )}
                  {player.shirtNumber && (
                    <InfoItem
                      icon={Shield}
                      label="Shirt Number"
                      value={`#${player.shirtNumber}`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Market Value & Contract */}
            {(player.marketValue || player.contractUntil) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Contract Info
                  </h3>
                  <div className="space-y-0">
                    {player.marketValue && (
                      <InfoItem
                        icon={Banknote}
                        label="Market Value"
                        value={`€${formatCurrency(player.marketValue)}`}
                      />
                    )}
                    {player.contractUntil && (
                      <InfoItem
                        icon={FileText}
                        label="Contract Until"
                        value={new Date(
                          player.contractUntil
                        ).toLocaleDateString('en-GB', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      />
                    )}
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
