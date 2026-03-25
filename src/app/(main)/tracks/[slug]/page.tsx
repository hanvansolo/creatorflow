import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Ruler,
  CornerUpRight,
  Calendar,
  Clock,
  Compass,
  Trophy,
  Map,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { WeatherChart } from '@/components/weather/WeatherChart';
import { TrackLayoutViewer } from '@/components/tracks/TrackLayoutViewer';
import { TrackHistory } from '@/components/tracks/TrackHistory';
import { db, circuits, races, seasons, raceSessions } from '@/lib/db';
import { eq, and, desc, gt, asc } from 'drizzle-orm';
import { generateCircuitMetadata, generateAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [circuit] = await db
    .select({
      name: circuits.name,
      officialName: circuits.officialName,
      country: circuits.country,
      location: circuits.location,
      layoutImageUrl: circuits.layoutImageUrl,
    })
    .from(circuits)
    .where(eq(circuits.slug, slug))
    .limit(1);

  if (!circuit) {
    return { title: 'Circuit Not Found' };
  }

  return {
    ...generateCircuitMetadata({
      title: circuit.name,
      description: `${circuit.officialName || circuit.name} circuit guide. Located in ${circuit.location || ''}, ${circuit.country}. Track layout, lap records, and race history.`,
      circuitName: circuit.name,
      officialName: circuit.officialName || circuit.name,
      country: circuit.country,
      location: circuit.location || '',
      image: circuit.layoutImageUrl || undefined,
    }),
    alternates: generateAlternates(`/tracks/${slug}`),
  };
}

async function getCircuit(slug: string) {
  const [circuit] = await db
    .select()
    .from(circuits)
    .where(eq(circuits.slug, slug))
    .limit(1);

  if (!circuit) return null;

  // Get races at this circuit
  const circuitRaces = await db
    .select({
      id: races.id,
      name: races.name,
      round: races.round,
      raceDatetime: races.raceDatetime,
      status: races.status,
      seasonYear: seasons.year,
    })
    .from(races)
    .innerJoin(seasons, eq(races.seasonId, seasons.id))
    .where(eq(races.circuitId, circuit.id))
    .orderBy(desc(seasons.year), desc(races.round))
    .limit(10);

  // Get next upcoming race at this circuit
  const now = new Date();
  const [nextRaceData] = await db
    .select({
      id: races.id,
      name: races.name,
      round: races.round,
      raceDatetime: races.raceDatetime,
      isSprintWeekend: races.isSprintWeekend,
      status: races.status,
      seasonYear: seasons.year,
    })
    .from(races)
    .innerJoin(seasons, eq(races.seasonId, seasons.id))
    .where(
      and(
        eq(races.circuitId, circuit.id),
        gt(races.raceDatetime, now)
      )
    )
    .orderBy(asc(races.raceDatetime))
    .limit(1);

  // Get all sessions for the next race
  let nextRace = null;
  if (nextRaceData) {
    const sessions = await db
      .select({
        sessionType: raceSessions.sessionType,
        sessionName: raceSessions.sessionName,
        startDatetime: raceSessions.startDatetime,
      })
      .from(raceSessions)
      .where(eq(raceSessions.raceId, nextRaceData.id))
      .orderBy(asc(raceSessions.startDatetime));

    nextRace = {
      ...nextRaceData,
      sessions,
    };
  }

  return { circuit, races: circuitRaces, nextRace };
}

export default async function CircuitPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCircuit(slug);

  if (!data) {
    notFound();
  }

  const { circuit, races: circuitRaces, nextRace } = data;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/tracks"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All Tracks
            </Link>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <CountryFlag nationality={circuit.country} size="lg" />
              <div>
                <h1 className="text-3xl font-bold text-white">{circuit.name}</h1>
                {circuit.officialName && circuit.officialName !== circuit.name && (
                  <p className="text-zinc-400">{circuit.officialName}</p>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-zinc-400">
              <MapPin className="h-4 w-4" />
              <span>{circuit.location ? `${circuit.location}, ` : ''}{circuit.country}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Track Layout */}
            {circuit.layoutImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-emerald-500" />
                    Track Layout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrackLayoutViewer
                    thumbnailUrl={circuit.layoutImageUrl}
                    circuitName={circuit.name}
                  />
                  {/* Sector Legend */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-8 rounded bg-emerald-500" />
                      <span className="text-zinc-400">Sector 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-8 rounded bg-blue-500" />
                      <span className="text-zinc-400">Sector 2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-8 rounded bg-yellow-500" />
                      <span className="text-zinc-400">Sector 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-white" />
                      <span className="text-zinc-400">Start/Finish</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Circuit Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Circuit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {circuit.lengthMeters && (
                    <div className="rounded-lg bg-zinc-800/50 p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Ruler className="h-4 w-4" />
                        Track Length
                      </div>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {(circuit.lengthMeters / 1000).toFixed(3)} km
                      </p>
                    </div>
                  )}

                  {circuit.turns && (
                    <div className="rounded-lg bg-zinc-800/50 p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <CornerUpRight className="h-4 w-4" />
                        Corners
                      </div>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {circuit.turns}
                      </p>
                    </div>
                  )}

                  {circuit.firstGrandPrixYear && (
                    <div className="rounded-lg bg-zinc-800/50 p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="h-4 w-4" />
                        First Grand Prix
                      </div>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {circuit.firstGrandPrixYear}
                      </p>
                    </div>
                  )}

                  {circuit.circuitType && (
                    <div className="rounded-lg bg-zinc-800/50 p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <MapPin className="h-4 w-4" />
                        Circuit Type
                      </div>
                      <p className="mt-1 text-xl font-bold text-white capitalize">
                        {circuit.circuitType}
                      </p>
                    </div>
                  )}

                  {circuit.direction && (
                    <div className="rounded-lg bg-zinc-800/50 p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Compass className="h-4 w-4" />
                        Direction
                      </div>
                      <p className="mt-1 text-xl font-bold text-white capitalize">
                        {circuit.direction}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lap Record */}
            {circuit.lapRecordTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    Lap Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6">
                    <p className="text-4xl font-bold font-mono text-white">
                      {circuit.lapRecordTime}
                    </p>
                    {circuit.lapRecordDriver && (
                      <p className="mt-2 text-lg text-zinc-300">
                        {circuit.lapRecordDriver}
                        {circuit.lapRecordYear && (
                          <span className="text-zinc-500"> ({circuit.lapRecordYear})</span>
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Track History */}
            <TrackHistory circuitSlug={circuit.slug} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Next Race */}
            {nextRace && (
              <Link href={`/predictions/${nextRace.id}`} className="block">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-orange-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Flag className="h-4 w-4 text-emerald-500" />
                      Next Race
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-white">{nextRace.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-zinc-400">
                        {nextRace.seasonYear} · Round {nextRace.round}
                      </p>
                      {nextRace.isSprintWeekend && (
                        <Badge variant="warning" className="text-xs">
                          Sprint
                        </Badge>
                      )}
                    </div>
                    {nextRace.sessions && nextRace.sessions.length > 0 && (
                      <div className="mt-4 space-y-2 text-sm">
                        {nextRace.sessions.map((session) => (
                          <div key={session.sessionType} className="flex justify-between text-zinc-400">
                            <span>{session.sessionName}</span>
                            <span className="text-white">
                              {new Date(session.startDatetime).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              <span className="text-zinc-500">
                                {new Date(session.startDatetime).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Weather Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Historical Weather</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WeatherChart circuitSlug={circuit.slug} className="border-0 rounded-none" />
              </CardContent>
            </Card>

            {/* Circuit Type Badges */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {circuit.circuitType && (
                    <Badge
                      variant={
                        circuit.circuitType === 'street'
                          ? 'warning'
                          : circuit.circuitType === 'permanent'
                            ? 'success'
                            : 'default'
                      }
                    >
                      {circuit.circuitType} circuit
                    </Badge>
                  )}
                  {circuit.direction && (
                    <Badge variant="secondary">
                      {circuit.direction === 'clockwise' ? 'Clockwise' : 'Anti-clockwise'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Races */}
            {circuitRaces.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Race History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {circuitRaces.map((race) => (
                      <Link
                        key={race.id}
                        href={`/calendar/${race.id}`}
                        className="block rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white text-sm">{race.name}</p>
                            <p className="text-xs text-zinc-500">
                              {race.seasonYear} · Round {race.round}
                            </p>
                          </div>
                          {race.status === 'completed' && (
                            <Badge variant="secondary" className="text-[10px]">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
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
