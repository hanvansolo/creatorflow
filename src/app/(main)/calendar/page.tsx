import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FlaskConical, MapPin, ChevronRight } from 'lucide-react';
import { RaceWeekendCard } from '@/components/calendar/RaceWeekendCard';
import { CountdownTimer } from '@/components/calendar/CountdownTimer';
import { TimezoneCard } from '@/components/calendar/TimezoneCard';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { db, races, circuits, seasons, testingEvents, raceSessions, broadcastChannels, sessionBroadcasts } from '@/lib/db';
import { eq, asc, inArray } from 'drizzle-orm';
import type { RaceStatus } from '@/types';
import { createPageMetadata } from '@/lib/seo';
import { format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

const CURRENT_YEAR = 2026;

export const metadata: Metadata = createPageMetadata(
  `Football Fixtures ${CURRENT_YEAR}`,
  `Complete football ${CURRENT_YEAR} season fixtures with all match dates, kick-off times, and venue information. Plan your football viewing schedule.`,
  '/calendar',
  ['football fixtures', 'football schedule', 'match calendar 2026', 'kick-off times', 'football match times']
);

async function getCalendarData() {
  // Get the current season
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.year, CURRENT_YEAR))
    .limit(1);

  if (!season) {
    return { races: [], season: null, sessionsByRace: {} as Record<string, never[]>, broadcastsBySession: {} as Record<string, never[]> };
  }

  // Get all races for this season with extended circuit info
  const seasonRaces = await db
    .select({
      id: races.id,
      seasonId: races.seasonId,
      circuitId: races.circuitId,
      round: races.round,
      name: races.name,
      slug: races.slug,
      isSprintWeekend: races.isSprintWeekend,
      raceDatetime: races.raceDatetime,
      status: races.status,
      circuit: {
        id: circuits.id,
        name: circuits.name,
        slug: circuits.slug,
        country: circuits.country,
        countryCode: circuits.countryCode,
        lengthMeters: circuits.lengthMeters,
        turns: circuits.turns,
        drsZones: circuits.drsZones,
        lapRecordTime: circuits.lapRecordTime,
        lapRecordDriver: circuits.lapRecordDriver,
        lapRecordYear: circuits.lapRecordYear,
        circuitType: circuits.circuitType,
        direction: circuits.direction,
        firstGrandPrixYear: circuits.firstGrandPrixYear,
        layoutImageUrl: circuits.layoutImageUrl,
      },
    })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.seasonId, season.id))
    .orderBy(asc(races.round));

  // Get all race IDs
  const raceIds = seasonRaces.map(r => r.id);

  // Fetch all sessions for these races
  const allSessions = raceIds.length > 0 ? await db
    .select({
      id: raceSessions.id,
      raceId: raceSessions.raceId,
      sessionType: raceSessions.sessionType,
      sessionName: raceSessions.sessionName,
      startDatetime: raceSessions.startDatetime,
      endDatetime: raceSessions.endDatetime,
    })
    .from(raceSessions)
    .where(inArray(raceSessions.raceId, raceIds))
    .orderBy(asc(raceSessions.startDatetime))
  : [];

  // Group sessions by race ID
  const sessionsByRace: Record<string, typeof allSessions> = {};
  for (const session of allSessions) {
    if (!session.raceId) continue;
    if (!sessionsByRace[session.raceId]) {
      sessionsByRace[session.raceId] = [];
    }
    sessionsByRace[session.raceId].push(session);
  }

  // Fetch broadcast channels for all sessions
  const sessionIds = allSessions.map(s => s.id);
  const broadcastsData = sessionIds.length > 0 ? await db
    .select({
      sessionId: sessionBroadcasts.raceSessionId,
      channel: {
        id: broadcastChannels.id,
        name: broadcastChannels.name,
        slug: broadcastChannels.slug,
        logoUrl: broadcastChannels.logoUrl,
        isStreaming: broadcastChannels.isStreaming,
        region: broadcastChannels.region,
      },
    })
    .from(sessionBroadcasts)
    .innerJoin(broadcastChannels, eq(sessionBroadcasts.channelId, broadcastChannels.id))
    .where(inArray(sessionBroadcasts.raceSessionId, sessionIds))
  : [];

  // Group broadcasts by session ID
  const broadcastsBySession: Record<string, typeof broadcastsData[0]['channel'][]> = {};
  for (const b of broadcastsData) {
    if (!b.sessionId) continue;
    if (!broadcastsBySession[b.sessionId]) {
      broadcastsBySession[b.sessionId] = [];
    }
    broadcastsBySession[b.sessionId].push(b.channel);
  }

  return { races: seasonRaces, season, sessionsByRace, broadcastsBySession };
}

async function getTestingEventsForSeason() {
  const events = await db
    .select({
      id: testingEvents.id,
      name: testingEvents.name,
      slug: testingEvents.slug,
      startDate: testingEvents.startDate,
      endDate: testingEvents.endDate,
      totalDays: testingEvents.totalDays,
      status: testingEvents.status,
      circuitName: circuits.name,
      country: circuits.country,
    })
    .from(testingEvents)
    .leftJoin(circuits, eq(testingEvents.circuitId, circuits.id))
    .leftJoin(seasons, eq(testingEvents.seasonId, seasons.id))
    .where(eq(seasons.year, CURRENT_YEAR))
    .orderBy(asc(testingEvents.startDate));

  return events;
}

function getTestingStatusBadge(status: string | null) {
  switch (status) {
    case 'live':
      return <Badge variant="danger">LIVE</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge variant="outline">Upcoming</Badge>;
  }
}

export default async function CalendarPage() {
  const [{ races: calendarRaces, season, sessionsByRace, broadcastsBySession }, testEvents] = await Promise.all([
    getCalendarData(),
    getTestingEventsForSeason(),
  ]);

  const now = new Date();
  const upcomingRaces = calendarRaces.filter(
    (race) => new Date(race.raceDatetime) > now
  );
  const completedRaces = calendarRaces.filter(
    (race) => new Date(race.raceDatetime) <= now
  );
  const nextRace = upcomingRaces[0];
  const sprintWeekends = calendarRaces.filter((r) => r.isSprintWeekend).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Football Fixtures {CURRENT_YEAR}</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            Complete fixture schedule for the {CURRENT_YEAR} football season
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {calendarRaces.length === 0 ? (
          <Card className="bg-zinc-900/50">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-zinc-600" />
              <h2 className="mt-4 text-xl font-semibold text-white">
                {CURRENT_YEAR} Calendar Coming Soon
              </h2>
              <p className="mt-2 text-zinc-400">
                The {CURRENT_YEAR} race calendar has not been published yet.
                Check back later for the full schedule.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Calendar */}
            <div className="lg:col-span-2">
              {/* Pre-Season Testing */}
              {testEvents.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <FlaskConical className="h-5 w-5 text-emerald-500" />
                    Pre-Season Testing
                  </h2>
                  <div className="space-y-3">
                    {testEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/testing/${event.slug}`}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/50"
                      >
                        <div>
                          <div className="mb-1.5 flex items-center gap-2">
                            {getTestingStatusBadge(event.status)}
                          </div>
                          <h3 className="font-bold text-white">{event.name}</h3>
                          <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-zinc-400">
                            {event.circuitName && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.circuitName}
                                {event.country && (
                                  <>
                                    , {event.country}
                                    <CountryFlag nationality={event.country} size="sm" />
                                  </>
                                )}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {format(parseISO(event.startDate), 'MMM d')} — {format(parseISO(event.endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Races */}
              <div className="space-y-4">
                {calendarRaces.map((race) => {
                  // Get sessions for this race and transform them
                  const raceSessions = (sessionsByRace[race.id] || []).map(s => ({
                    id: s.id,
                    sessionName: s.sessionName,
                    sessionType: s.sessionType,
                    startDatetime: s.startDatetime.toISOString(),
                    endDatetime: s.endDatetime?.toISOString() || null,
                  }));

                  // Get broadcasts for these sessions
                  const sessionBroadcasts: Record<string, typeof broadcastsBySession[string]> = {};
                  for (const session of raceSessions) {
                    if (broadcastsBySession[session.id]) {
                      sessionBroadcasts[session.id] = broadcastsBySession[session.id];
                    }
                  }

                  return (
                    <RaceWeekendCard
                      key={race.id}
                      race={{
                        id: race.id,
                        seasonId: race.seasonId || '',
                        circuitId: race.circuitId || '',
                        circuit: race.circuit ? {
                          id: race.circuit.id,
                          name: race.circuit.name,
                          slug: race.circuit.slug || '',
                          country: race.circuit.country,
                          countryCode: race.circuit.countryCode || '',
                          lengthMeters: race.circuit.lengthMeters || undefined,
                          turns: race.circuit.turns || undefined,
                          drsZones: race.circuit.drsZones || undefined,
                          lapRecordTime: race.circuit.lapRecordTime || undefined,
                          lapRecordDriver: race.circuit.lapRecordDriver || undefined,
                          lapRecordYear: race.circuit.lapRecordYear || undefined,
                          circuitType: (race.circuit.circuitType as 'street' | 'permanent' | 'semi-permanent') || undefined,
                          direction: (race.circuit.direction as 'clockwise' | 'anti-clockwise') || undefined,
                          firstGrandPrixYear: race.circuit.firstGrandPrixYear || undefined,
                          layoutImageUrl: race.circuit.layoutImageUrl || undefined,
                        } : undefined,
                        round: race.round,
                        name: race.name,
                        slug: race.slug,
                        isSprintWeekend: race.isSprintWeekend || false,
                        raceDatetime: race.raceDatetime.toISOString(),
                        status: (race.status || 'scheduled') as RaceStatus,
                      }}
                      sessions={raceSessions}
                      broadcasts={sessionBroadcasts}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Next Race Countdown */}
              {nextRace && (
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950">
                  <CardHeader className="text-center">
                    <Badge variant="success" className="mx-auto mb-2 w-fit">
                      Next Race
                    </Badge>
                    <CardTitle>{nextRace.name}</CardTitle>
                    <p className="text-sm text-zinc-400">
                      {nextRace.circuit?.name}
                    </p>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <CountdownTimer
                      targetDate={nextRace.raceDatetime.toISOString()}
                      size="md"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Timezone/Location Selector */}
              <TimezoneCard />

              {/* Season Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{CURRENT_YEAR} Season</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Races</span>
                    <span className="font-bold text-white">{calendarRaces.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Sprint Weekends</span>
                    <span className="font-bold text-white">{sprintWeekends}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Completed</span>
                    <span className="font-bold text-white">{completedRaces.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Remaining</span>
                    <span className="font-bold text-white">{upcomingRaces.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
