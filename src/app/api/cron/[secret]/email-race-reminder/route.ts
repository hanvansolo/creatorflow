import { NextRequest, NextResponse } from 'next/server';
import { db, races, circuits, raceSessions } from '@/lib/db';
import { eq, gte, lte, asc } from 'drizzle-orm';
import { raceReminderEmail, type RaceInfo } from '@/lib/email/templates';
import { sendToAllSubscribers } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find races happening in the next 3 days (to catch Thursday sends for Sunday races)
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const upcomingRaces = await db
      .select({
        id: races.id,
        name: races.name,
        slug: races.slug,
        round: races.round,
        raceDatetime: races.raceDatetime,
        circuitName: circuits.name,
        country: circuits.country,
      })
      .from(races)
      .leftJoin(circuits, eq(races.circuitId, circuits.id))
      .where(
        gte(races.raceDatetime, now),
      )
      .orderBy(asc(races.raceDatetime))
      .limit(1);

    if (upcomingRaces.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No upcoming races' });
    }

    const race = upcomingRaces[0];

    // Check if race is within 3 days
    if (race.raceDatetime && race.raceDatetime > threeDaysFromNow) {
      return NextResponse.json({ skipped: true, reason: `Next race (${race.name}) is more than 3 days away` });
    }

    // Get sessions
    const sessions = await db
      .select({
        name: raceSessions.sessionName,
        dateTime: raceSessions.startDatetime,
      })
      .from(raceSessions)
      .where(eq(raceSessions.raceId, race.id))
      .orderBy(asc(raceSessions.startDatetime));

    const raceInfo: RaceInfo = {
      name: race.name,
      circuitName: race.circuitName || '',
      country: race.country || '',
      raceDate: race.raceDatetime?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) || '',
      round: race.round,
      slug: race.slug,
      sessions: sessions.map(s => ({
        name: s.name,
        dateTime: s.dateTime?.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' || '',
      })),
    };

    const { subject, html } = raceReminderEmail(raceInfo);
    const result = await sendToAllSubscribers(subject, html);

    return NextResponse.json({ success: true, ...result, race: race.name });
  } catch (error) {
    console.error('Race reminder email error:', error);
    return NextResponse.json({ error: 'Failed to send race reminder' }, { status: 500 });
  }
}
