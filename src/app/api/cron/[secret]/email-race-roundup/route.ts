import { NextRequest, NextResponse } from 'next/server';
import { db, races, circuits, raceResults, drivers, teams, newsArticles, newsSources } from '@/lib/db';
import { eq, desc, gte, lte, asc } from 'drizzle-orm';
import { raceRoundupEmail, type RaceInfo, type RaceResult, type ArticleSummary } from '@/lib/email/templates';
import { sendToAllSubscribers } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the most recent race that happened in the last 2 days
    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 2);

    const recentRaces = await db
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
      .where(lte(races.raceDatetime, now))
      .orderBy(desc(races.raceDatetime))
      .limit(1);

    if (recentRaces.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No recent races' });
    }

    const race = recentRaces[0];

    // Only send if race was within last 2 days
    if (race.raceDatetime && race.raceDatetime < twoDaysAgo) {
      return NextResponse.json({ skipped: true, reason: `Most recent race (${race.name}) was more than 2 days ago` });
    }

    // Get race results
    const results = await db
      .select({
        position: raceResults.position,
        driverFirstName: drivers.firstName,
        driverLastName: drivers.lastName,
        teamName: teams.name,
        time: raceResults.fastestLapTime,
        status: raceResults.status,
      })
      .from(raceResults)
      .leftJoin(drivers, eq(raceResults.driverId, drivers.id))
      .leftJoin(teams, eq(raceResults.teamId, teams.id))
      .where(eq(raceResults.raceId, race.id))
      .orderBy(asc(raceResults.position))
      .limit(10);

    // Get related news articles from around the race
    const raceDay = race.raceDatetime || now;
    const dayBefore = new Date(raceDay);
    dayBefore.setDate(dayBefore.getDate() - 1);

    const articles = await db
      .select({
        title: newsArticles.title,
        slug: newsArticles.slug,
        summary: newsArticles.summary,
        sourceName: newsSources.name,
      })
      .from(newsArticles)
      .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
      .where(gte(newsArticles.publishedAt, dayBefore))
      .orderBy(desc(newsArticles.voteScore))
      .limit(5);

    const raceInfo: RaceInfo = {
      name: race.name,
      circuitName: race.circuitName || '',
      country: race.country || '',
      raceDate: race.raceDatetime?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) || '',
      round: race.round,
      slug: race.slug,
    };

    const raceResultsFormatted: RaceResult[] = results.map(r => ({
      position: r.position || 0,
      driver: `${r.driverFirstName || ''} ${r.driverLastName || ''}`.trim(),
      team: r.teamName || '',
      time: r.status === 'Finished' ? undefined : r.status || undefined,
    }));

    const storySummaries: ArticleSummary[] = articles.map(a => ({
      title: a.title,
      slug: a.slug,
      summary: a.summary?.slice(0, 120) || '',
      source: a.sourceName || '',
      publishedAt: '',
    }));

    const { subject, html } = raceRoundupEmail(raceInfo, raceResultsFormatted, storySummaries);
    const result = await sendToAllSubscribers(subject, html);

    return NextResponse.json({ success: true, ...result, race: race.name, resultsCount: results.length });
  } catch (error) {
    console.error('Race roundup email error:', error);
    return NextResponse.json({ error: 'Failed to send race roundup' }, { status: 500 });
  }
}
