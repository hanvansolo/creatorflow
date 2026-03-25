import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trophy, Flag, Medal, Timer, Zap, MapPin, Calendar, Users, GitCompareArrows } from 'lucide-react';
import { db, drivers, teams, driverStandings, seasons } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { F1_TEAMS } from '@/lib/constants/teams';
import { CountryFlag } from '@/components/ui/CountryFlag';
import {
  generateDriverMetadata,
  generateAlternates,
  SITE_CONFIG,
  generateDriverStructuredData,
  jsonLd,
  JsonLdScript,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface DriverPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DriverPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [driver] = await db
    .select({
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      nationality: drivers.nationality,
      headshotUrl: drivers.headshotUrl,
      biography: drivers.biography,
    })
    .from(drivers)
    .where(eq(drivers.slug, slug))
    .limit(1);

  if (!driver) {
    return { title: 'Driver Not Found' };
  }

  // Get team name
  const [driverWithTeam] = await db
    .select({ teamName: teams.name })
    .from(drivers)
    .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
    .where(eq(drivers.slug, slug))
    .limit(1);

  return {
    ...generateDriverMetadata({
      title: `${driver.firstName} ${driver.lastName}`,
      description: driver.biography?.slice(0, 160) || `${driver.firstName} ${driver.lastName} F1 driver profile, statistics, and career history.`,
      firstName: driver.firstName,
      lastName: driver.lastName,
      nationality: driver.nationality || '',
      team: driverWithTeam?.teamName || undefined,
      image: driver.headshotUrl || undefined,
    }),
    alternates: generateAlternates(`/drivers/${slug}`),
  };
}

async function getDriver(slug: string) {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.slug, slug))
    .limit(1);

  if (!driver) return null;

  // Get current team
  let currentTeam = null;
  if (driver.currentTeamId) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, driver.currentTeamId))
      .limit(1);
    currentTeam = team;
  }

  // Get 2026 season standings
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.year, 2026))
    .limit(1);

  let seasonStats = null;
  if (season) {
    const [standing] = await db
      .select()
      .from(driverStandings)
      .where(and(
        eq(driverStandings.seasonId, season.id),
        eq(driverStandings.driverId, driver.id)
      ))
      .limit(1);

    if (standing) {
      seasonStats = {
        position: standing.position,
        points: parseFloat(standing.points || '0'),
        wins: standing.wins || 0,
        podiums: standing.podiums || 0,
      };
    }
  }

  return { driver, currentTeam, seasonStats };
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: color ? `${color}20` : '#27272a' }}
        >
          <Icon className="h-5 w-5" style={{ color: color || '#a1a1aa' }} />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function DriverPage({ params }: DriverPageProps) {
  const { slug } = await params;
  const data = await getDriver(slug);

  if (!data) {
    notFound();
  }

  const { driver, currentTeam, seasonStats } = data;
  const teamSlug = currentTeam?.slug as keyof typeof F1_TEAMS;
  const teamColor = teamSlug ? F1_TEAMS[teamSlug]?.primaryColor : '#666';

  const age = driver.dateOfBirth
    ? Math.floor((Date.now() - new Date(driver.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="border-b border-zinc-800"
        style={{ background: `linear-gradient(to bottom, ${teamColor}15, transparent)` }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/standings"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Standings
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Driver Image */}
            <div className="flex-shrink-0">
              {driver.headshotUrl ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-zinc-800">
                  <Image
                    src={driver.headshotUrl}
                    alt={`${driver.firstName} ${driver.lastName}`}
                    fill
                    className="object-cover object-top"
                    sizes="128px"
                  />
                </div>
              ) : (
                <div
                  className="flex h-32 w-32 items-center justify-center rounded-2xl bg-zinc-800 text-3xl font-bold text-zinc-400"
                >
                  {driver.code || `${driver.firstName[0]}${driver.lastName[0]}`}
                </div>
              )}
            </div>

            {/* Driver Info */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                {driver.number && (
                  <span
                    className="font-bold -translate-y-0.5"
                    style={{ color: teamColor, lineHeight: 1, fontSize: '5rem' }}
                  >
                    #{driver.number}
                  </span>
                )}
                <div className="flex flex-col justify-center">
                  <h1 className="text-3xl font-bold leading-tight text-white">
                    {driver.firstName} <span style={{ color: teamColor }}>{driver.lastName}</span>
                  </h1>
                  {currentTeam && (
                    <Link
                      href={`/teams/${currentTeam.slug}`}
                      className="text-lg leading-tight text-zinc-400 hover:text-white"
                    >
                      {currentTeam.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                {driver.nationality && (
                  <div className="flex items-center gap-1.5">
                    <CountryFlag nationality={driver.nationality} size="sm" />
                    {driver.nationality}
                  </div>
                )}
                {age && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {age} years old
                  </div>
                )}
                {driver.placeOfBirth && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {driver.placeOfBirth}
                  </div>
                )}
              </div>
            </div>

            {/* Short Bio */}
            {driver.biography && (
              <div className="hidden md:flex flex-1 items-center justify-center px-6">
                <div className="max-w-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Bio</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                    {driver.biography}
                  </p>
                  <Link
                    href={`/drivers/${slug}/bio`}
                    className="mt-1 inline-block text-sm font-medium hover:underline"
                    style={{ color: teamColor }}
                  >
                    Read more
                  </Link>
                </div>
              </div>
            )}

            {/* Season Position */}
            {seasonStats && (
              <div className="flex-shrink-0 text-center md:text-right">
                <p className="text-sm text-zinc-400">2026 Championship</p>
                <p className="text-5xl font-bold" style={{ color: teamColor }}>
                  P{seasonStats.position}
                </p>
                <p className="text-lg text-zinc-300">{seasonStats.points} pts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 2026 Season Stats */}
        {seasonStats && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">2026 Season</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={Trophy} label="Position" value={`P${seasonStats.position}`} color={teamColor} />
              <StatCard icon={Zap} label="Points" value={seasonStats.points} color={teamColor} />
              <StatCard icon={Flag} label="Wins" value={seasonStats.wins} color="#eab308" />
              <StatCard icon={Medal} label="Podiums" value={seasonStats.podiums} color="#f97316" />
            </div>
          </div>
        )}

        {/* Career Stats */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-white">Career Statistics</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              icon={Trophy}
              label="Championships"
              value={driver.worldChampionships || 0}
              color={driver.worldChampionships ? '#eab308' : undefined}
            />
            <StatCard icon={Flag} label="Race Wins" value={driver.raceWins || 0} />
            <StatCard icon={Medal} label="Podiums" value={driver.podiums || 0} />
            <StatCard icon={Timer} label="Pole Positions" value={driver.polePositions || 0} />
            <StatCard icon={Zap} label="Fastest Laps" value={driver.fastestLaps || 0} />
            <StatCard icon={Trophy} label="Career Points" value={parseFloat(driver.careerPoints || '0')} />
          </div>
        </div>

        {/* Compare Link */}
        <div className="mb-8">
          <Link
            href={`/compare?d1=${slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare with another driver
          </Link>
        </div>

        {/* Current Team */}
        {currentTeam && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-white">Current Team</h2>
            <Link
              href={`/teams/${currentTeam.slug}`}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/50"
            >
              {currentTeam.carImageUrl ? (
                <div className="relative h-12 w-24 overflow-hidden rounded-lg bg-zinc-800">
                  <Image
                    src={currentTeam.carImageUrl}
                    alt={currentTeam.name}
                    fill
                    className="object-contain"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div
                  className="flex h-12 w-24 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: teamColor }}
                >
                  {currentTeam.name.slice(0, 3).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-white">{currentTeam.name}</p>
                {currentTeam.powerUnit && (
                  <p className="text-sm text-zinc-400">{currentTeam.powerUnit} Power Unit</p>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
