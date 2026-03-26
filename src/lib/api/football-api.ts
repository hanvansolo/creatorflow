/**
 * API-Football client (via RapidAPI)
 * https://www.api-football.com/documentation-v3
 */

const API_BASE = 'https://v3.football.api-sports.io';

function getHeaders(): Record<string, string> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error('API_FOOTBALL_KEY environment variable is not set');

  return {
    'x-apisports-key': apiKey,
    'Content-Type': 'application/json',
  };
}

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T;
}

async function apiFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 0 }, // no cache for API calls
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ===== TYPES =====

export interface ApiLeague {
  league: {
    id: number;
    name: string;
    type: string; // "League" | "Cup"
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

export interface ApiTeam {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  } | null;
}

export interface ApiPlayer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: { date: string; place: string; country: string };
    nationality: string;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; season: number };
    games: {
      appearences: number | null; // typo in API
      lineups: number | null;
      minutes: number | null;
      position: string | null;
      rating: string | null;
      captain: boolean;
    };
    goals: { total: number | null; assists: number | null; saves: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    shots: { total: number | null; on: number | null };
    penalty: { scored: number | null; missed: number | null };
    cards: { yellow: number | null; red: number | null };
    fouls: { drawn: number | null; committed: number | null };
  }>;
}

export interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string; city: string };
    status: {
      long: string;
      short: string; // "NS" "1H" "HT" "2H" "FT" "ET" "P" "PEN" "AET" "BT" "SUSP" "INT" "PST" "CANC" "ABD" "AWD" "WO" "LIVE"
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface ApiFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string; // "Goal" "Card" "subst" "Var"
  detail: string; // "Normal Goal" "Penalty" "Own Goal" "Yellow Card" "Red Card" "Second Yellow card" "Substitution 1" etc.
  comments: string | null;
}

export interface ApiStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  update: string;
}

export interface ApiLineup {
  team: { id: number; name: string; logo: string; colors: unknown };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string; grid: null } }>;
}

export interface ApiTransfer {
  player: { id: number; name: string };
  update: string;
  transfers: Array<{
    date: string;
    type: string; // "Free" | "Loan" | "N/A" | "€30M" etc
    teams: {
      in: { id: number; name: string; logo: string };
      out: { id: number; name: string; logo: string };
    };
  }>;
}

// ===== API METHODS =====

/** Get available leagues/competitions */
export async function getLeagues(params: { id?: number; season?: number; country?: string } = {}) {
  return apiFetch<ApiLeague[]>('/leagues', params as Record<string, string | number>);
}

/** Get teams for a league + season */
export async function getTeams(leagueId: number, season: number) {
  return apiFetch<ApiTeam[]>('/teams', { league: leagueId, season });
}

/** Get squad/players for a team */
export async function getSquad(teamId: number) {
  return apiFetch<Array<{ team: { id: number; name: string; logo: string }; players: Array<{ id: number; name: string; age: number; number: number | null; position: string; photo: string }> }>>('/players/squads', { team: teamId });
}

/** Get detailed player stats for a season */
export async function getPlayerStats(playerId: number, season: number) {
  return apiFetch<ApiPlayer[]>('/players', { id: playerId, season });
}

/** Get players for a team in a season (paginated) */
export async function getTeamPlayers(teamId: number, season: number, page = 1) {
  return apiFetch<ApiPlayer[]>('/players', { team: teamId, season, page });
}

/** Get fixtures for a league + season */
export async function getFixtures(params: {
  league?: number;
  season?: number;
  team?: number;
  date?: string; // YYYY-MM-DD
  from?: string;
  to?: string;
  live?: string; // "all" for live matches
  status?: string; // "NS-1H-HT-2H-ET-P-FT" etc
  last?: number;
  next?: number;
}) {
  return apiFetch<ApiFixture[]>('/fixtures', params as Record<string, string | number>);
}

/** Get live fixtures across all leagues */
export async function getLiveFixtures() {
  return apiFetch<ApiFixture[]>('/fixtures', { live: 'all' });
}

/** Get events (goals, cards, subs) for a fixture */
export async function getFixtureEvents(fixtureId: number) {
  return apiFetch<ApiFixtureEvent[]>('/fixtures/events', { fixture: fixtureId });
}

/** Get statistics for a fixture */
export async function getFixtureStatistics(fixtureId: number) {
  return apiFetch<Array<{ team: { id: number; name: string }; statistics: Array<{ type: string; value: number | string | null }> }>>('/fixtures/statistics', { fixture: fixtureId });
}

/** Get lineups for a fixture */
export async function getFixtureLineups(fixtureId: number) {
  return apiFetch<ApiLineup[]>('/fixtures/lineups', { fixture: fixtureId });
}

/** Get standings for a league + season */
export async function getStandings(leagueId: number, season: number) {
  return apiFetch<Array<{ league: { id: number; name: string; country: string; logo: string; flag: string; season: number; standings: ApiStanding[][] } }>>('/standings', { league: leagueId, season });
}

/** Get transfers for a team or player */
export async function getTransfers(params: { team?: number; player?: number }) {
  return apiFetch<ApiTransfer[]>('/transfers', params as Record<string, string | number>);
}

// ===== STATUS MAPPING =====

/** Map API-Football status short codes to our MatchStatus */
export function mapFixtureStatus(shortStatus: string): string {
  const statusMap: Record<string, string> = {
    'TBD': 'scheduled',
    'NS': 'scheduled',
    '1H': 'live',
    'HT': 'halftime',
    '2H': 'live',
    'ET': 'extra_time',
    'BT': 'extra_time',
    'P': 'penalties',
    'PEN': 'penalties',
    'SUSP': 'suspended',
    'INT': 'suspended',
    'FT': 'finished',
    'AET': 'finished',
    'PST': 'postponed',
    'CANC': 'cancelled',
    'ABD': 'cancelled',
    'AWD': 'finished',
    'WO': 'finished',
    'LIVE': 'live',
  };
  return statusMap[shortStatus] || 'scheduled';
}

/** Map API-Football event types to our MatchEventType */
export function mapEventType(type: string, detail: string): string {
  if (type === 'Goal') {
    if (detail === 'Own Goal') return 'own_goal';
    if (detail === 'Penalty') return 'penalty_scored';
    if (detail === 'Missed Penalty') return 'penalty_missed';
    return 'goal';
  }
  if (type === 'Card') {
    if (detail === 'Yellow Card') return 'yellow_card';
    if (detail === 'Second Yellow card') return 'second_yellow';
    if (detail === 'Red Card') return 'red_card';
    return 'yellow_card';
  }
  if (type === 'subst') return 'substitution';
  if (type === 'Var') return 'var_decision';
  return type.toLowerCase();
}
