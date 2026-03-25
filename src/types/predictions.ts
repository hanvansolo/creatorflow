// Weather types
export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'light_rain'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm';

export interface OpenMeteoForecast {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
}

export interface WeatherForecast {
  temperatureCelsius: number;
  humidityPercent: number;
  windSpeedKph: number;
  rainfallMm: number;
  weatherCondition: WeatherCondition;
  rainProbabilityPercent: number;
  isForecast: boolean;
  recordedAt: Date;
}

// Prediction types
export interface PredictionFactors {
  leagueForm: number;           // Current league position & form (0-1)
  headToHead: number;           // Historical H2H record (0-1)
  homeAdvantage: number;        // Home/away form (0-1)
  recentResults: number;        // Last 5 match results (0-1)
  squadStrength: number;        // Available squad quality (0-1)
  injurySuspensions: number;    // Impact of missing players (0-1)
}

export interface MatchOutcomePrediction {
  matchId: string;
  homeClubId: string;
  homeClubName: string;
  homeClubLogo?: string;
  awayClubId: string;
  awayClubName: string;
  awayClubLogo?: string;
  predictedOutcome: 'home' | 'draw' | 'away';
  homeWinProbability: number;   // 0-100
  drawProbability: number;      // 0-100
  awayWinProbability: number;   // 0-100
  predictedHomeScore: number;
  predictedAwayScore: number;
  btts: boolean;                // Both teams to score
  overUnder: number;            // e.g. 2.5
  overPrediction: boolean;      // true = over, false = under
  confidenceScore: number;      // 0-100
  factors: PredictionFactors;
}

export interface PredictionAccuracy {
  outcomeAccuracy: number;      // % of correct home/draw/away predictions
  scoreAccuracy: number;        // % of exact score predictions
  bttsAccuracy: number;         // % of BTTS correct
  overUnderAccuracy: number;    // % of over/under correct
  averageConfidence: number;    // Average confidence of predictions made
}

export interface MatchdayPrediction {
  id: string;
  competitionSeasonId: string;
  competitionName: string;
  matchday: number;
  predictions: MatchOutcomePrediction[];
  createdAt: Date;
  accuracy?: PredictionAccuracy;
}

// API-Football response types
export interface ApiFootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface ApiFootballStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string>;
  results: number;
  response: T;
}
