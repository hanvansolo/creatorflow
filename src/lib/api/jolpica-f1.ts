import type { JolpicaResponse, JolpicaRaceResult } from '@/types/predictions';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

/**
 * Fetch all race results for a season
 */
export async function fetchSeasonResults(year: number): Promise<JolpicaRaceResult[]> {
  const url = `${JOLPICA_BASE_URL}/${year}/results.json?limit=1000`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status} ${response.statusText}`);
  }

  const data: JolpicaResponse = await response.json();
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch results for multiple seasons
 */
export async function fetchMultipleSeasonResults(
  years: number[]
): Promise<Map<number, JolpicaRaceResult[]>> {
  const results = new Map<number, JolpicaRaceResult[]>();

  for (const year of years) {
    console.log(`Fetching ${year} season results...`);
    try {
      const seasonResults = await fetchSeasonResults(year);
      results.set(year, seasonResults);
      console.log(`  -> ${seasonResults.length} races fetched`);

      // Rate limiting - be nice to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to fetch ${year}:`, error);
    }
  }

  return results;
}

/**
 * Fetch current driver standings
 */
export async function fetchCurrentDriverStandings() {
  const url = `${JOLPICA_BASE_URL}/current/driverStandings.json`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
}

/**
 * Fetch current constructor standings
 */
export async function fetchCurrentConstructorStandings() {
  const url = `${JOLPICA_BASE_URL}/current/constructorStandings.json`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
}

/**
 * Fetch all drivers
 */
export async function fetchAllDrivers() {
  const url = `${JOLPICA_BASE_URL}/drivers.json?limit=1000`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData.DriverTable.Drivers;
}

/**
 * Fetch all constructors
 */
export async function fetchAllConstructors() {
  const url = `${JOLPICA_BASE_URL}/constructors.json?limit=1000`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData.ConstructorTable.Constructors;
}

/**
 * Fetch race schedule for a season
 */
export async function fetchSeasonSchedule(year: number) {
  const url = `${JOLPICA_BASE_URL}/${year}.json`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch all circuits
 */
export async function fetchAllCircuits() {
  const url = `${JOLPICA_BASE_URL}/circuits.json?limit=100`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status}`);
  }

  const data = await response.json();
  return data.MRData.CircuitTable.Circuits;
}
