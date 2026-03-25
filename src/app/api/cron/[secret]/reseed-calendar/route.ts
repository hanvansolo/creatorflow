import { NextRequest, NextResponse } from 'next/server';
import { db, races, circuits, seasons, raceSessions, driverStandings, constructorStandings, weatherData, fantasyTransactions } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

// 2026 Football Calendar - Official Schedule
// Source: footy-feed.com
const CALENDAR_2026 = [
  { round: 1, name: 'Australian Grand Prix', country: 'Australia', circuitSlug: 'albert-park', circuitName: 'Albert Park Circuit', date: '2026-03-08', time: '05:00:00', isSprintWeekend: false },
  { round: 2, name: 'Chinese Grand Prix', country: 'China', circuitSlug: 'shanghai', circuitName: 'Shanghai International Circuit', date: '2026-03-15', time: '07:00:00', isSprintWeekend: true },
  { round: 3, name: 'Japanese Grand Prix', country: 'Japan', circuitSlug: 'suzuka', circuitName: 'Suzuka International Racing Course', date: '2026-03-29', time: '06:00:00', isSprintWeekend: false },
  { round: 4, name: 'Miami Grand Prix', country: 'United States', circuitSlug: 'miami', circuitName: 'Miami International Autodrome', date: '2026-05-03', time: '20:00:00', isSprintWeekend: true },
  { round: 5, name: 'Canadian Grand Prix', country: 'Canada', circuitSlug: 'montreal', circuitName: 'Circuit Gilles Villeneuve', date: '2026-05-24', time: '18:00:00', isSprintWeekend: false },
  { round: 6, name: 'Monaco Grand Prix', country: 'Monaco', circuitSlug: 'monaco', circuitName: 'Circuit de Monaco', date: '2026-06-07', time: '13:00:00', isSprintWeekend: false },
  { round: 7, name: 'Barcelona-Catalunya Grand Prix', country: 'Spain', circuitSlug: 'barcelona', circuitName: 'Circuit de Barcelona-Catalunya', date: '2026-06-14', time: '13:00:00', isSprintWeekend: false },
  { round: 8, name: 'Austrian Grand Prix', country: 'Austria', circuitSlug: 'red-bull-ring', circuitName: 'Red Bull Ring', date: '2026-06-28', time: '13:00:00', isSprintWeekend: false },
  { round: 9, name: 'British Grand Prix', country: 'United Kingdom', circuitSlug: 'silverstone', circuitName: 'Silverstone Circuit', date: '2026-07-05', time: '14:00:00', isSprintWeekend: false },
  { round: 10, name: 'Belgian Grand Prix', country: 'Belgium', circuitSlug: 'spa', circuitName: 'Circuit de Spa-Francorchamps', date: '2026-07-19', time: '13:00:00', isSprintWeekend: true },
  { round: 11, name: 'Hungarian Grand Prix', country: 'Hungary', circuitSlug: 'hungaroring', circuitName: 'Hungaroring', date: '2026-07-26', time: '13:00:00', isSprintWeekend: false },
  { round: 12, name: 'Dutch Grand Prix', country: 'Netherlands', circuitSlug: 'zandvoort', circuitName: 'Circuit Zandvoort', date: '2026-08-23', time: '13:00:00', isSprintWeekend: false },
  { round: 13, name: 'Italian Grand Prix', country: 'Italy', circuitSlug: 'monza', circuitName: 'Autodromo Nazionale Monza', date: '2026-09-06', time: '13:00:00', isSprintWeekend: false },
  { round: 14, name: 'Spanish Grand Prix', country: 'Spain', circuitSlug: 'madrid', circuitName: 'Circuito de Madrid', date: '2026-09-13', time: '13:00:00', isSprintWeekend: false },
  { round: 15, name: 'Azerbaijan Grand Prix', country: 'Azerbaijan', circuitSlug: 'baku', circuitName: 'Baku City Circuit', date: '2026-09-26', time: '11:00:00', isSprintWeekend: false },
  { round: 16, name: 'Singapore Grand Prix', country: 'Singapore', circuitSlug: 'marina-bay', circuitName: 'Marina Bay Street Circuit', date: '2026-10-11', time: '12:00:00', isSprintWeekend: false },
  { round: 17, name: 'United States Grand Prix', country: 'United States', circuitSlug: 'cota', circuitName: 'Circuit of The Americas', date: '2026-10-25', time: '19:00:00', isSprintWeekend: true },
  { round: 18, name: 'Mexico City Grand Prix', country: 'Mexico', circuitSlug: 'mexico-city', circuitName: 'Autodromo Hermanos Rodriguez', date: '2026-11-01', time: '20:00:00', isSprintWeekend: false },
  { round: 19, name: 'Brazilian Grand Prix', country: 'Brazil', circuitSlug: 'interlagos', circuitName: 'Autodromo Jose Carlos Pace', date: '2026-11-08', time: '17:00:00', isSprintWeekend: true },
  { round: 20, name: 'Las Vegas Grand Prix', country: 'United States', circuitSlug: 'las-vegas', circuitName: 'Las Vegas Street Circuit', date: '2026-11-21', time: '06:00:00', isSprintWeekend: false },
  { round: 21, name: 'Qatar Grand Prix', country: 'Qatar', circuitSlug: 'losail', circuitName: 'Losail International Circuit', date: '2026-11-29', time: '16:00:00', isSprintWeekend: true },
  { round: 22, name: 'Abu Dhabi Grand Prix', country: 'United Arab Emirates', circuitSlug: 'yas-marina', circuitName: 'Yas Marina Circuit', date: '2026-12-06', time: '13:00:00', isSprintWeekend: false },
];

async function getOrCreateCircuit(circuitData: { slug: string; name: string; country: string }) {
  const [existing] = await db
    .select()
    .from(circuits)
    .where(eq(circuits.slug, circuitData.slug))
    .limit(1);

  if (existing) return existing.id;

  const [newCircuit] = await db
    .insert(circuits)
    .values({
      name: circuitData.name,
      slug: circuitData.slug,
      country: circuitData.country,
    })
    .returning();

  return newCircuit.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create 2026 season
    let [season] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.year, 2026))
      .limit(1);

    if (!season) {
      [season] = await db
        .insert(seasons)
        .values({
          year: 2026,
          name: '2026 FIA Formula One World Championship',
          isCurrent: true,
        })
        .returning();
    }

    // Clear existing 2026 races and all dependent data
    const existingRaces = await db
      .select({ id: races.id })
      .from(races)
      .where(eq(races.seasonId, season.id));

    if (existingRaces.length > 0) {
      const raceIds = existingRaces.map(r => r.id);

      // Delete from tables that reference races without onDelete cascade
      await db.delete(driverStandings).where(inArray(driverStandings.raceId, raceIds));
      await db.delete(constructorStandings).where(inArray(constructorStandings.raceId, raceIds));
      await db.delete(weatherData).where(inArray(weatherData.raceId, raceIds));
      await db.delete(fantasyTransactions).where(inArray(fantasyTransactions.raceId, raceIds));

      // Delete race sessions
      for (const race of existingRaces) {
        await db.delete(raceSessions).where(eq(raceSessions.raceId, race.id));
      }

      // Now safe to delete races (remaining FKs have onDelete cascade)
      await db.delete(races).where(eq(races.seasonId, season.id));
    }

    // Seed races
    let racesAdded = 0;

    for (const raceData of CALENDAR_2026) {
      const circuitId = await getOrCreateCircuit({
        slug: raceData.circuitSlug,
        name: raceData.circuitName,
        country: raceData.country,
      });

      const raceDatetime = new Date(`${raceData.date}T${raceData.time}Z`);
      const slug = `${raceData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-2026`;

      const [newRace] = await db
        .insert(races)
        .values({
          seasonId: season.id,
          circuitId,
          round: raceData.round,
          name: raceData.name,
          slug,
          isSprintWeekend: raceData.isSprintWeekend,
          raceDatetime,
          status: 'scheduled',
        })
        .returning();

      // Add race sessions
      const sessionTypes = raceData.isSprintWeekend
        ? [
            { type: 'FP1', name: 'Free Practice 1', dayOffset: -2, time: '11:30:00' },
            { type: 'SQ', name: 'Sprint Qualifying', dayOffset: -2, time: '15:30:00' },
            { type: 'Sprint', name: 'Sprint', dayOffset: -1, time: '11:00:00' },
            { type: 'Qualifying', name: 'Qualifying', dayOffset: -1, time: '15:00:00' },
            { type: 'Race', name: 'Race', dayOffset: 0, time: raceData.time },
          ]
        : [
            { type: 'FP1', name: 'Free Practice 1', dayOffset: -2, time: '11:30:00' },
            { type: 'FP2', name: 'Free Practice 2', dayOffset: -2, time: '15:00:00' },
            { type: 'FP3', name: 'Free Practice 3', dayOffset: -1, time: '10:30:00' },
            { type: 'Qualifying', name: 'Qualifying', dayOffset: -1, time: '14:00:00' },
            { type: 'Race', name: 'Race', dayOffset: 0, time: raceData.time },
          ];

      for (const session of sessionTypes) {
        const sessionDate = new Date(raceDatetime);
        sessionDate.setDate(sessionDate.getDate() + session.dayOffset);
        const [hours, minutes] = session.time.split(':');
        sessionDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

        await db.insert(raceSessions).values({
          raceId: newRace.id,
          sessionType: session.type,
          sessionName: session.name,
          startDatetime: sessionDate,
          status: 'scheduled',
        });
      }

      racesAdded++;
    }

    const sprintCount = CALENDAR_2026.filter(r => r.isSprintWeekend).length;

    return NextResponse.json({
      success: true,
      racesAdded,
      sprintWeekends: sprintCount,
      totalRaces: CALENDAR_2026.length,
    });
  } catch (error) {
    console.error('Calendar reseed failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
