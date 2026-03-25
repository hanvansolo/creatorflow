import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FlaskConical, Calendar, MapPin, Thermometer } from 'lucide-react';
import { db, testingEvents, testingSessions, testingResults, circuits, seasons, drivers, teams, broadcastChannels, sessionBroadcasts } from '@/lib/db';
import { eq, asc, and, inArray } from 'drizzle-orm';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { TestingLeaderboard } from '@/components/testing/TestingLeaderboard';
import { DaySelector } from '@/components/testing/DaySelector';
import { TestingScheduleSection } from '@/components/testing/TestingScheduleSection';
import { F1_TEAMS } from '@/lib/constants/teams';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ day?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const [event] = await db
    .select({ name: testingEvents.name })
    .from(testingEvents)
    .where(eq(testingEvents.slug, eventSlug))
    .limit(1);

  return {
    title: event ? `${event.name} | Footy Feed` : 'Testing Event',
    description: event ? `Results and analysis from ${event.name}` : 'Football pre-season event results',
  };
}

async function getEventData(slug: string, dayFilter?: string) {
  const [event] = await db
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
    .where(eq(testingEvents.slug, slug))
    .limit(1);

  if (!event) return null;

  // Get all sessions
  const sessions = await db
    .select()
    .from(testingSessions)
    .where(eq(testingSessions.eventId, event.id))
    .orderBy(asc(testingSessions.day), asc(testingSessions.startTime));

  // Fetch broadcast channels for all sessions
  const sessionIds = sessions.map(s => s.id);
  const broadcastsData = sessionIds.length > 0 ? await db
    .select({
      sessionId: sessionBroadcasts.testingSessionId,
      channel: {
        id: broadcastChannels.id,
        name: broadcastChannels.name,
        slug: broadcastChannels.slug,
        logoUrl: broadcastChannels.logoUrl,
        isStreaming: broadcastChannels.isStreaming,
      },
    })
    .from(sessionBroadcasts)
    .innerJoin(broadcastChannels, eq(sessionBroadcasts.channelId, broadcastChannels.id))
    .where(inArray(sessionBroadcasts.testingSessionId, sessionIds))
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


  // Get results for filtered sessions (for leaderboard, etc.)
  const filteredSessionIds = dayFilter
    ? sessions.filter(s => s.day === parseInt(dayFilter)).map(s => s.id)
    : sessions.map(s => s.id);

  if (filteredSessionIds.length === 0) {
    return { event, sessions, results: [], dayInfo: buildDayInfo(sessions), broadcastsBySession };
  }

  // Get all results across filtered sessions
  const allResults = [];
  for (const sid of filteredSessionIds) {
    const sessionResults = await db
      .select({
        bestLapTime: testingResults.bestLapTime,
        bestLapTimeMs: testingResults.bestLapTimeMs,
        totalLaps: testingResults.totalLaps,
        longRunPace: testingResults.longRunPace,
        longRunPaceMs: testingResults.longRunPaceMs,
        longRunLaps: testingResults.longRunLaps,
        tyreCompound: testingResults.tyreCompound,
        reliabilityIssues: testingResults.reliabilityIssues,
        notes: testingResults.notes,
        position: testingResults.position,
        gapToLeader: testingResults.gapToLeader,
        sector1: testingResults.sector1,
        sector2: testingResults.sector2,
        sector3: testingResults.sector3,
        driverCode: drivers.code,
        driverFirstName: drivers.firstName,
        driverLastName: drivers.lastName,
        teamSlug: teams.slug,
        teamName: teams.name,
      })
      .from(testingResults)
      .innerJoin(drivers, eq(testingResults.driverId, drivers.id))
      .innerJoin(teams, eq(testingResults.teamId, teams.id))
      .where(eq(testingResults.sessionId, sid))
      .orderBy(asc(testingResults.position));

    allResults.push(...sessionResults);
  }

  return { event, sessions, results: allResults, dayInfo: buildDayInfo(sessions), broadcastsBySession };
}

function buildDayInfo(sessions: { day: number; sessionName: string }[]) {
  const dayMap = new Map<number, number>();
  for (const s of sessions) {
    dayMap.set(s.day, (dayMap.get(s.day) || 0) + 1);
  }
  return Array.from(dayMap.entries()).map(([day, count]) => ({
    day,
    label: `Day ${day}`,
    sessionCount: count,
  }));
}

export default async function TestingEventPage({ params, searchParams }: Props) {
  const { eventSlug } = await params;
  const { day } = await searchParams;
  const data = await getEventData(eventSlug, day);

  if (!data) notFound();

  const { event, sessions, results, dayInfo, broadcastsBySession } = data;

  // Transform sessions for the schedule component
  const scheduleSessions = sessions.map(s => ({
    id: s.id,
    sessionName: s.sessionName,
    startDatetime: s.startTime?.toISOString() || new Date(s.sessionDate + 'T09:00:00Z').toISOString(),
    endDatetime: s.endTime?.toISOString() || null,
  }));

  // Aggregate: best time per driver across filtered sessions
  const driverBest = new Map<string, typeof results[0] & { aggregatedLaps: number }>();
  for (const r of results) {
    const code = r.driverCode || '';
    const existing = driverBest.get(code);
    if (!existing || (r.bestLapTimeMs && (!existing.bestLapTimeMs || r.bestLapTimeMs < existing.bestLapTimeMs))) {
      driverBest.set(code, { ...r, aggregatedLaps: (existing?.aggregatedLaps || 0) + (r.totalLaps || 0) });
    } else if (existing) {
      existing.aggregatedLaps += r.totalLaps || 0;
    }
  }

  const sortedDrivers = [...driverBest.values()].sort(
    (a, b) => (a.bestLapTimeMs || 999999) - (b.bestLapTimeMs || 999999)
  );

  // Recalculate positions and gaps
  const fastestMs = sortedDrivers[0]?.bestLapTimeMs || 0;
  const leaderboardEntries = sortedDrivers.map((d, i) => ({
    position: i + 1,
    driverCode: d.driverCode || '',
    driverName: `${d.driverFirstName} ${d.driverLastName}`,
    teamName: d.teamName,
    teamColor: d.teamSlug ? (F1_TEAMS[d.teamSlug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666',
    bestLapTime: d.bestLapTime,
    gapToLeader: i === 0 ? null : `+${((d.bestLapTimeMs! - fastestMs) / 1000).toFixed(3)}`,
    totalLaps: d.aggregatedLaps,
    tyreCompound: d.tyreCompound,
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/testing"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All Testing Events
          </Link>
          <div className="flex items-center gap-2 mb-2">
            {event.status === 'live' && <Badge variant="danger">LIVE</Badge>}
            {event.status === 'completed' && <Badge variant="secondary">Completed</Badge>}
            {event.status === 'upcoming' && <Badge variant="outline">Upcoming</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">{event.name}</h1>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
            {event.circuitName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
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
              <Calendar className="h-4 w-4" />
              {event.startDate} — {event.endDate}
            </span>
          </div>

          {/* Day Selector */}
          {dayInfo.length > 1 && (
            <div className="mt-4">
              <DaySelector days={dayInfo} eventSlug={eventSlug} />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Session Schedule with times and broadcasts */}
        {scheduleSessions.length > 0 && (
          <div className="mb-8">
            <TestingScheduleSection
              sessions={scheduleSessions}
              broadcasts={broadcastsBySession}
              title="Session Times"
            />
          </div>
        )}

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-16">
            <FlaskConical className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">
              {event.status === 'upcoming' ? 'Testing hasn\'t started yet' : 'No results for this day'}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {event.status === 'upcoming'
                ? 'Timing data will appear here once sessions begin.'
                : 'Try selecting a different day or view all days.'}
            </p>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-xl font-bold text-white">
              {day ? `Day ${day} Lap Times` : 'Lap Times'}
            </h2>
            <TestingLeaderboard entries={leaderboardEntries} />
          </div>
        )}
      </div>
    </div>
  );
}
