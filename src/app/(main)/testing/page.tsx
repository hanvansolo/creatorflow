import { Metadata } from 'next';
import Link from 'next/link';
import { FlaskConical, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { db, testingEvents, circuits, seasons } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Pre-Season - Results & Analysis',
  'Football pre-season results, friendly match reports, and squad performance analysis. Track fitness and squad development progress.',
  '/testing',
  ['football pre-season', 'pre-season friendlies', 'football results', 'pre-season results', 'squad updates']
);

async function getTestingEvents() {
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
      seasonYear: seasons.year,
    })
    .from(testingEvents)
    .leftJoin(circuits, eq(testingEvents.circuitId, circuits.id))
    .leftJoin(seasons, eq(testingEvents.seasonId, seasons.id))
    .orderBy(desc(testingEvents.startDate));

  return events;
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case 'live':
      return <Badge variant="danger">LIVE</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge variant="outline">Upcoming</Badge>;
  }
}

export default async function TestingPage() {
  const events = await getTestingEvents();

  return (
    <div className="min-h-screen">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Pre-Season Testing</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            Lap times, long run pace, team performance analysis, and reliability tracking from official F1 pre-season tests.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-16">
            <FlaskConical className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">No testing events yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Testing data will appear here once the pre-season schedule is announced.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/testing/${event.slug}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:bg-zinc-800/50"
              >
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    {getStatusBadge(event.status)}
                    {event.seasonYear && (
                      <Badge variant="outline">{event.seasonYear}</Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">{event.name}</h2>
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
                      {event.startDate} — {event.endDate} ({event.totalDays} days)
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
