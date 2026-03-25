import type {
  Session,
  Interval,
  Position,
  Lap,
  Stint,
  PitStop,
  RaceControlMessage,
  Driver,
  Weather,
} from './types';
import { getOpenF1AuthHeaders } from './token';

const OPENF1_BASE = 'https://api.openf1.org/v1';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

type QueryParams = Record<string, string | number | boolean | undefined>;

async function fetchOpenF1<T>(
  endpoint: string,
  params: QueryParams = {}
): Promise<T> {
  const url = new URL(`${OPENF1_BASE}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const authHeaders = await getOpenF1AuthHeaders();

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    headers: {
      Accept: 'application/json',
      ...authHeaders,
    },
    cache: 'no-store', // No caching for live data
  });

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Session endpoints
export async function getSessions(params: {
  session_key?: number | 'latest';
  meeting_key?: number;
  session_name?: string;
  session_type?: string;
  year?: number;
} = {}): Promise<Session[]> {
  return fetchOpenF1<Session[]>('/sessions', params);
}

export async function getLatestSession(): Promise<Session | null> {
  const sessions = await getSessions({ session_key: 'latest' });
  return sessions[0] || null;
}

export async function getCurrentSession(): Promise<Session | null> {
  // Get the most recent session
  const sessions = await getSessions({ session_key: 'latest' });
  if (sessions.length === 0) return null;

  const session = sessions[0];

  // Check if session is currently active (between start and end)
  const now = new Date();
  const start = new Date(session.date_start);
  const end = new Date(session.date_end);

  // Add some buffer time (sessions can start early or run late)
  const bufferMs = 30 * 60 * 1000; // 30 minutes
  const adjustedStart = new Date(start.getTime() - bufferMs);
  const adjustedEnd = new Date(end.getTime() + bufferMs);

  if (now >= adjustedStart && now <= adjustedEnd) {
    return session;
  }

  return null;
}

// Intervals (gap to leader)
export async function getIntervals(sessionKey: number): Promise<Interval[]> {
  return fetchOpenF1<Interval[]>('/intervals', { session_key: sessionKey });
}

export async function getLatestIntervals(sessionKey: number): Promise<Interval[]> {
  // Get only the most recent interval for each driver
  const intervals = await getIntervals(sessionKey);

  // Group by driver and take the latest
  const latestByDriver = new Map<number, Interval>();
  for (const interval of intervals) {
    const existing = latestByDriver.get(interval.driver_number);
    if (!existing || new Date(interval.date) > new Date(existing.date)) {
      latestByDriver.set(interval.driver_number, interval);
    }
  }

  return Array.from(latestByDriver.values());
}

// Positions
export async function getPositions(sessionKey: number): Promise<Position[]> {
  return fetchOpenF1<Position[]>('/position', { session_key: sessionKey });
}

export async function getLatestPositions(sessionKey: number): Promise<Position[]> {
  const positions = await getPositions(sessionKey);

  // Group by driver and take the latest
  const latestByDriver = new Map<number, Position>();
  for (const position of positions) {
    const existing = latestByDriver.get(position.driver_number);
    if (!existing || new Date(position.date) > new Date(existing.date)) {
      latestByDriver.set(position.driver_number, position);
    }
  }

  return Array.from(latestByDriver.values()).sort((a, b) => a.position - b.position);
}

// Laps
export async function getLaps(
  sessionKey: number,
  params: { driver_number?: number; lap_number?: number } = {}
): Promise<Lap[]> {
  return fetchOpenF1<Lap[]>('/laps', { session_key: sessionKey, ...params });
}

export async function getLatestLaps(sessionKey: number): Promise<Map<number, Lap>> {
  const laps = await getLaps(sessionKey);

  // Group by driver and take the latest lap
  const latestByDriver = new Map<number, Lap>();
  for (const lap of laps) {
    const existing = latestByDriver.get(lap.driver_number);
    if (!existing || lap.lap_number > existing.lap_number) {
      latestByDriver.set(lap.driver_number, lap);
    }
  }

  return latestByDriver;
}

// Stints (tire information)
export async function getStints(sessionKey: number): Promise<Stint[]> {
  return fetchOpenF1<Stint[]>('/stints', { session_key: sessionKey });
}

export async function getCurrentStints(sessionKey: number): Promise<Map<number, Stint>> {
  const stints = await getStints(sessionKey);

  // Group by driver and take the current stint (highest stint_number or null lap_end)
  const currentByDriver = new Map<number, Stint>();
  for (const stint of stints) {
    const existing = currentByDriver.get(stint.driver_number);
    if (!existing || stint.stint_number > existing.stint_number) {
      currentByDriver.set(stint.driver_number, stint);
    }
  }

  return currentByDriver;
}

// Pit stops
export async function getPitStops(sessionKey: number): Promise<PitStop[]> {
  return fetchOpenF1<PitStop[]>('/pit', { session_key: sessionKey });
}

// Race control messages
export async function getRaceControl(sessionKey: number): Promise<RaceControlMessage[]> {
  return fetchOpenF1<RaceControlMessage[]>('/race_control', { session_key: sessionKey });
}

export async function getRecentRaceControl(
  sessionKey: number,
  limit: number = 20
): Promise<RaceControlMessage[]> {
  const messages = await getRaceControl(sessionKey);
  // Sort by date descending and take latest
  return messages
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Drivers
export async function getDrivers(sessionKey: number): Promise<Driver[]> {
  return fetchOpenF1<Driver[]>('/drivers', { session_key: sessionKey });
}

// Weather
export async function getWeather(sessionKey: number): Promise<Weather[]> {
  return fetchOpenF1<Weather[]>('/weather', { session_key: sessionKey });
}

export async function getLatestWeather(sessionKey: number): Promise<Weather | null> {
  const weather = await getWeather(sessionKey);
  if (weather.length === 0) return null;

  // Return the most recent weather reading
  return weather.reduce((latest, current) =>
    new Date(current.date) > new Date(latest.date) ? current : latest
  );
}

// Fetch all live data in one call (for efficiency)
export async function fetchAllLiveData(sessionKey: number): Promise<{
  positions: Position[];
  intervals: Interval[];
  stints: Stint[];
  pitStops: PitStop[];
  raceControl: RaceControlMessage[];
  weather: Weather | null;
  laps: Lap[];
}> {
  const [positions, intervals, stints, pitStops, raceControl, weather, laps] = await Promise.all([
    getLatestPositions(sessionKey),
    getLatestIntervals(sessionKey),
    getStints(sessionKey),
    getPitStops(sessionKey),
    getRecentRaceControl(sessionKey, 30),
    getLatestWeather(sessionKey),
    getLaps(sessionKey),
  ]);

  return { positions, intervals, stints, pitStops, raceControl, weather, laps };
}
