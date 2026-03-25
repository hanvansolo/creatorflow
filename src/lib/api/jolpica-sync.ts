import { db, drivers, teams, driverStandings, constructorStandings, raceResults, races, circuits, seasons } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
  fetchCurrentDriverStandings,
  fetchCurrentConstructorStandings,
  fetchSeasonResults,
  fetchSeasonSchedule,
} from './jolpica-f1';

// Driver code mapping (Jolpica uses various driverId formats)
const DRIVER_CODE_MAP: Record<string, string> = {
  'max_verstappen': 'VER',
  'norris': 'NOR',
  'leclerc': 'LEC',
  'hamilton': 'HAM',
  'russell': 'RUS',
  'piastri': 'PIA',
  'sainz': 'SAI',
  'alonso': 'ALO',
  'stroll': 'STR',
  'gasly': 'GAS',
  'ocon': 'OCO',
  'albon': 'ALB',
  'hulkenberg': 'HUL',
  'tsunoda': 'TSU',
  'ricciardo': 'RIC',
  'magnussen': 'MAG',
  'bottas': 'BOT',
  'zhou': 'ZHO',
  'perez': 'PER',
  'lawson': 'LAW',
  'bearman': 'BEA',
  'colapinto': 'COL',
  'doohan': 'DOO',
  'sargeant': 'SAR',
  'de_vries': 'DEV',
  'hadjar': 'HAD',
  'antonelli': 'ANT',
  'bortoleto': 'BOR',
  'lindblad': 'LIN',
};

// Team mapping (Jolpica constructorId -> our slug)
const TEAM_SLUG_MAP: Record<string, string> = {
  'red_bull': 'red-bull',
  'mclaren': 'mclaren',
  'ferrari': 'ferrari',
  'mercedes': 'mercedes',
  'aston_martin': 'aston-martin',
  'alpine': 'alpine',
  'williams': 'williams',
  'rb': 'racing-bulls',
  'alphatauri': 'racing-bulls',
  'haas': 'haas',
  'sauber': 'audi',
  'alfa': 'audi',
  'kick_sauber': 'audi',
};

export interface SyncResult {
  driverStandingsUpdated: number;
  constructorStandingsUpdated: number;
  raceResultsUpdated: number;
  errors: string[];
}

/**
 * Sync current season standings from Jolpica-F1 API
 * This is the PRIMARY source of truth for standings data
 */
export async function syncCurrentStandings(seasonYear: number = new Date().getFullYear()): Promise<SyncResult> {
  const result: SyncResult = {
    driverStandingsUpdated: 0,
    constructorStandingsUpdated: 0,
    raceResultsUpdated: 0,
    errors: [],
  };

  try {
    // Get our season ID
    const [season] = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.year, seasonYear))
      .limit(1);

    if (!season) {
      result.errors.push(`Season ${seasonYear} not found in database`);
      return result;
    }

    // Fetch driver standings from Jolpica
    console.log('Fetching driver standings from Jolpica-F1...');
    const jolpicaDriverStandings = await fetchCurrentDriverStandings();

    for (const standing of jolpicaDriverStandings) {
      const driverCode = standing.Driver?.code || DRIVER_CODE_MAP[standing.Driver?.driverId];
      if (!driverCode) {
        console.log(`  Unknown driver: ${standing.Driver?.driverId}`);
        continue;
      }

      // Find driver in our database
      const [driver] = await db
        .select({ id: drivers.id })
        .from(drivers)
        .where(eq(drivers.code, driverCode))
        .limit(1);

      if (!driver) {
        console.log(`  Driver not in DB: ${driverCode}`);
        continue;
      }

      // Upsert driver standing
      const [existing] = await db
        .select({ id: driverStandings.id })
        .from(driverStandings)
        .where(and(
          eq(driverStandings.seasonId, season.id),
          eq(driverStandings.driverId, driver.id),
          // No raceId = season standing
        ))
        .limit(1);

      const standingData = {
        seasonId: season.id,
        driverId: driver.id,
        position: parseInt(standing.position),
        points: standing.points,
        wins: parseInt(standing.wins) || 0,
      };

      if (existing) {
        await db.update(driverStandings)
          .set(standingData)
          .where(eq(driverStandings.id, existing.id));
      } else {
        await db.insert(driverStandings).values(standingData);
      }

      result.driverStandingsUpdated++;
      console.log(`  P${standing.position}: ${driverCode} - ${standing.points} pts`);
    }

    // Fetch constructor standings from Jolpica
    console.log('\nFetching constructor standings from Jolpica-F1...');
    const jolpicaConstructorStandings = await fetchCurrentConstructorStandings();

    for (const standing of jolpicaConstructorStandings) {
      const teamSlug = TEAM_SLUG_MAP[standing.Constructor?.constructorId] || standing.Constructor?.constructorId;

      // Find team in our database
      const [team] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.slug, teamSlug))
        .limit(1);

      if (!team) {
        console.log(`  Team not in DB: ${teamSlug}`);
        continue;
      }

      // Upsert constructor standing
      const [existing] = await db
        .select({ id: constructorStandings.id })
        .from(constructorStandings)
        .where(and(
          eq(constructorStandings.seasonId, season.id),
          eq(constructorStandings.teamId, team.id),
        ))
        .limit(1);

      const standingData = {
        seasonId: season.id,
        teamId: team.id,
        position: parseInt(standing.position),
        points: standing.points,
        wins: parseInt(standing.wins) || 0,
      };

      if (existing) {
        await db.update(constructorStandings)
          .set(standingData)
          .where(eq(constructorStandings.id, existing.id));
      } else {
        await db.insert(constructorStandings).values(standingData);
      }

      result.constructorStandingsUpdated++;
      console.log(`  P${standing.position}: ${standing.Constructor?.name} - ${standing.points} pts`);
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync failed: ${errorMsg}`);
    console.error('Standings sync error:', error);
  }

  return result;
}

/**
 * Sync race results for a specific season from Jolpica-F1 API
 */
export async function syncSeasonResults(year: number): Promise<SyncResult> {
  const result: SyncResult = {
    driverStandingsUpdated: 0,
    constructorStandingsUpdated: 0,
    raceResultsUpdated: 0,
    errors: [],
  };

  try {
    console.log(`Fetching ${year} race results from Jolpica-F1...`);
    const seasonResults = await fetchSeasonResults(year);

    // Get our season ID
    const [season] = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.year, year))
      .limit(1);

    if (!season) {
      result.errors.push(`Season ${year} not found`);
      return result;
    }

    for (const race of seasonResults) {
      console.log(`  Processing: ${race.raceName}`);

      // Find race in our database
      const [dbRace] = await db
        .select({ id: races.id })
        .from(races)
        .where(and(
          eq(races.seasonId, season.id),
          eq(races.round, parseInt(race.round))
        ))
        .limit(1);

      if (!dbRace) {
        console.log(`    Race not found in DB, skipping`);
        continue;
      }

      // Process each result
      for (const raceResult of race.Results || []) {
        const driverCode = raceResult.Driver?.code || DRIVER_CODE_MAP[raceResult.Driver?.driverId];
        if (!driverCode) continue;

        const [driver] = await db
          .select({ id: drivers.id })
          .from(drivers)
          .where(eq(drivers.code, driverCode))
          .limit(1);

        if (!driver) continue;

        const teamSlug = TEAM_SLUG_MAP[raceResult.Constructor?.constructorId] || raceResult.Constructor?.constructorId;
        const [team] = await db
          .select({ id: teams.id })
          .from(teams)
          .where(eq(teams.slug, teamSlug))
          .limit(1);

        // Check if result exists
        const [existing] = await db
          .select({ id: raceResults.id })
          .from(raceResults)
          .where(and(
            eq(raceResults.raceId, dbRace.id),
            eq(raceResults.driverId, driver.id)
          ))
          .limit(1);

        const resultData = {
          raceId: dbRace.id,
          driverId: driver.id,
          teamId: team?.id,
          position: raceResult.position === 'R' ? null : parseInt(raceResult.position),
          gridPosition: parseInt(raceResult.grid),
          points: raceResult.points,
          status: raceResult.status,
          fastestLap: raceResult.FastestLap?.rank === '1',
          fastestLapTime: raceResult.FastestLap?.Time?.time || null,
        };

        if (existing) {
          await db.update(raceResults)
            .set(resultData)
            .where(eq(raceResults.id, existing.id));
        } else {
          await db.insert(raceResults).values(resultData);
        }

        result.raceResultsUpdated++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Results sync failed: ${errorMsg}`);
    console.error('Results sync error:', error);
  }

  return result;
}

/**
 * Full sync - standings + recent results
 * Call this before generating predictions for most accurate data
 */
export async function fullDataSync(): Promise<{
  standings: SyncResult;
  currentYearResults: SyncResult;
  previousYearResults: SyncResult;
}> {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  console.log('=== Starting Full Jolpica-F1 Data Sync ===\n');

  // Sync current standings
  console.log('--- Syncing Current Standings ---');
  const standings = await syncCurrentStandings(currentYear);

  // Sync current year results
  console.log('\n--- Syncing Current Year Results ---');
  const currentYearResults = await syncSeasonResults(currentYear);

  // Sync previous year results (for historical data)
  console.log('\n--- Syncing Previous Year Results ---');
  const previousYearResults = await syncSeasonResults(previousYear);

  console.log('\n=== Sync Complete ===');
  console.log(`Driver standings: ${standings.driverStandingsUpdated}`);
  console.log(`Constructor standings: ${standings.constructorStandingsUpdated}`);
  console.log(`Race results (${currentYear}): ${currentYearResults.raceResultsUpdated}`);
  console.log(`Race results (${previousYear}): ${previousYearResults.raceResultsUpdated}`);

  return {
    standings,
    currentYearResults,
    previousYearResults,
  };
}
