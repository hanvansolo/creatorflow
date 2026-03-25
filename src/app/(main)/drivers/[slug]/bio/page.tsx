import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trophy, Flag, Medal, Timer, Zap, Calendar, MapPin } from 'lucide-react';
import { db, drivers, teams, driverStandings, seasons } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { F1_TEAMS } from '@/lib/constants/teams';
import { CountryFlag } from '@/components/ui/CountryFlag';

export const dynamic = 'force-dynamic';

interface BioPageProps {
  params: Promise<{ slug: string }>;
}

interface Milestone {
  year: number;
  event: string;
  detail?: string;
}

export async function generateMetadata({ params }: BioPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [driver] = await db
    .select({ firstName: drivers.firstName, lastName: drivers.lastName })
    .from(drivers)
    .where(eq(drivers.slug, slug))
    .limit(1);

  if (!driver) {
    return { title: 'Driver Not Found' };
  }

  return {
    title: `${driver.firstName} ${driver.lastName} - Biography | Footy Feed`,
    description: `Full biography and career history of ${driver.firstName} ${driver.lastName}`,
  };
}

async function getDriverBio(slug: string) {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.slug, slug))
    .limit(1);

  if (!driver) return null;

  let currentTeam = null;
  if (driver.currentTeamId) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, driver.currentTeamId))
      .limit(1);
    currentTeam = team;
  }

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

function StatHighlight({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
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
  );
}

export default async function DriverBioPage({ params }: BioPageProps) {
  const { slug } = await params;
  const data = await getDriverBio(slug);

  if (!data) {
    notFound();
  }

  const { driver, currentTeam, seasonStats } = data;
  const teamSlug = currentTeam?.slug as keyof typeof F1_TEAMS;
  const teamColor = teamSlug ? F1_TEAMS[teamSlug]?.primaryColor : '#666';

  const age = driver.dateOfBirth
    ? Math.floor((Date.now() - new Date(driver.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const careerImages = (driver.careerImages as string[] | null) || [];
  const milestones = (driver.careerMilestones as Milestone[] | null) || [];

  // Split biography into paragraphs
  const bioParagraphs = driver.biography
    ? driver.biography.split('\n\n').filter((p: string) => p.trim().length > 0)
    : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="border-b border-zinc-800"
        style={{ background: `linear-gradient(to bottom, ${teamColor}15, transparent)` }}
      >
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/drivers/${slug}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Driver Profile
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
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-zinc-800 text-3xl font-bold text-zinc-400">
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
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Full Biography */}
        {bioParagraphs.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-white">Career History</h2>
            <div className="space-y-4">
              {bioParagraphs.map((paragraph: string, index: number) => (
                <p key={index} className="text-zinc-300 leading-relaxed text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Career Timeline */}
        {milestones.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-white">Career Timeline</h2>
            <div className="relative border-l-2 border-zinc-800 pl-6 space-y-5">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative">
                  <div
                    className="absolute -left-[32px] top-1.5 h-3.5 w-3.5 rounded-full"
                    style={{
                      backgroundColor: teamColor,
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold" style={{ color: teamColor }}>
                      {milestone.year}
                    </p>
                    <p className="text-zinc-200 font-medium">{milestone.event}</p>
                    {milestone.detail && (
                      <p className="text-sm text-zinc-500">{milestone.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Career Achievements */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Career Statistics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatHighlight
              icon={Trophy}
              label="Championships"
              value={driver.worldChampionships || 0}
              color={driver.worldChampionships ? '#eab308' : undefined}
            />
            <StatHighlight icon={Flag} label="Race Wins" value={driver.raceWins || 0} color={teamColor} />
            <StatHighlight icon={Medal} label="Podiums" value={driver.podiums || 0} color="#f97316" />
            <StatHighlight icon={Timer} label="Pole Positions" value={driver.polePositions || 0} color="#3b82f6" />
            <StatHighlight icon={Zap} label="Fastest Laps" value={driver.fastestLaps || 0} color="#a855f7" />
            <StatHighlight
              icon={Trophy}
              label="Career Points"
              value={parseFloat(driver.careerPoints || '0')}
              color="#22c55e"
            />
          </div>
        </div>

        {/* 2026 Season */}
        {seasonStats && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-white">2026 Season</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatHighlight icon={Trophy} label="Position" value={`P${seasonStats.position}`} color={teamColor} />
              <StatHighlight icon={Zap} label="Points" value={seasonStats.points} color={teamColor} />
              <StatHighlight icon={Flag} label="Wins" value={seasonStats.wins} color="#eab308" />
              <StatHighlight icon={Medal} label="Podiums" value={seasonStats.podiums} color="#f97316" />
            </div>
          </div>
        )}

        {/* Career Gallery */}
        {careerImages.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-white">Career Gallery</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {careerImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`${driver.firstName} ${driver.lastName} - career photo ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Team */}
        {currentTeam && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Current Team</h2>
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
