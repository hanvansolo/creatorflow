// News types
export interface NewsSource {
  id: string;
  name: string;
  slug: string;
  type: 'rss' | 'twitter' | 'youtube' | 'api';
  url?: string;
  feedUrl?: string;
  logoUrl?: string;
  isActive: boolean;
  priority: number;
}

export type CredibilityRating = 'verified' | 'unverified' | 'clickbait' | 'opinion' | 'rumour' | 'analysis';

export interface NewsArticle {
  id: string;
  sourceId: string;
  source?: NewsSource;
  externalId?: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author?: string;
  imageUrl?: string;
  originalUrl: string;
  publishedAt: string;
  isBreaking: boolean;
  tags: string[];
  credibilityRating?: CredibilityRating;
  voteScore?: number;
  userVote?: 1 | -1 | null;
  commentCount?: number;
}

// Video types
export interface YouTubeVideo {
  id: string;
  videoId: string;
  channelId: string;
  channelName: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  tags: string[];
  isFeatured: boolean;
}

// Core types
export interface Season {
  id: string;
  year: number;
  name?: string;
  isCurrent: boolean;
}

export type CompetitionType = 'league' | 'cup' | 'international';

export interface Competition {
  id: string;
  name: string;
  slug: string;
  shortName?: string;
  type: CompetitionType;
  country?: string;
  countryCode?: string;
  tier: number;
  logoUrl?: string;
  apiFootballId?: number;
  isActive: boolean;
}

export interface CompetitionSeason {
  id: string;
  competitionId: string;
  competition?: Competition;
  seasonId: string;
  season?: Season;
  apiFootballSeason?: number;
  startDate?: string;
  endDate?: string;
  status: 'upcoming' | 'active' | 'completed';
  currentMatchday?: number;
  totalMatchdays?: number;
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Club {
  id: string;
  externalId?: string;
  apiFootballId?: number;
  name: string;
  slug: string;
  shortName?: string;
  code?: string;
  country?: string;
  countryCode?: string;
  founded?: number;
  stadium?: string;
  manager?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
}

export interface Player {
  id: string;
  externalId?: string;
  apiFootballId?: number;
  firstName: string;
  lastName: string;
  slug: string;
  knownAs?: string;
  nationality?: string;
  secondNationality?: string;
  dateOfBirth?: string;
  position: PlayerPosition;
  detailedPosition?: string;
  shirtNumber?: number;
  currentClubId?: string;
  currentClub?: Club;
  height?: number;
  weight?: number;
  preferredFoot?: 'left' | 'right' | 'both';
  headshotUrl?: string;
  biography?: string;
  marketValue?: number;
  contractUntil?: string;
  fantasyPrice?: number;
  isActive: boolean;
}

export interface Venue {
  id: string;
  externalId?: string;
  name: string;
  slug: string;
  city?: string;
  country: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  surfaceType?: 'grass' | 'artificial' | 'hybrid';
  yearBuilt?: number;
  imageUrl?: string;
}

// Match types
export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'finished'
  | 'extra_time'
  | 'penalties'
  | 'postponed'
  | 'cancelled'
  | 'suspended';

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_scored'
  | 'penalty_missed'
  | 'yellow_card'
  | 'second_yellow'
  | 'red_card'
  | 'substitution'
  | 'var_decision';

export interface Match {
  id: string;
  competitionSeasonId?: string;
  competitionSeason?: CompetitionSeason;
  venueId?: string;
  venue?: Venue;
  externalId?: string;
  apiFootballId?: number;
  matchday?: number;
  round?: string;
  homeClubId: string;
  homeClub?: Club;
  awayClubId: string;
  awayClub?: Club;
  kickoff: string;
  status: MatchStatus;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  homeScoreHt?: number;
  awayScoreHt?: number;
  homeScoreEt?: number;
  awayScoreEt?: number;
  homePenalties?: number;
  awayPenalties?: number;
  referee?: string;
  attendance?: number;
  slug: string;
  events?: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  matchId: string;
  eventType: MatchEventType;
  minute: number;
  addedTime?: number;
  playerId?: string;
  player?: Player;
  secondPlayerId?: string;
  secondPlayer?: Player;
  clubId?: string;
  club?: Club;
  description?: string;
}

export interface MatchLineup {
  id: string;
  matchId: string;
  clubId: string;
  playerId: string;
  player?: Player;
  shirtNumber?: number;
  position?: string;
  isStarter: boolean;
  minuteIn?: number;
  minuteOut?: number;
  rating?: number;
}

// Standings types
export interface LeagueStanding {
  id: string;
  competitionSeasonId: string;
  clubId: string;
  club?: Club;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[]; // ["W","W","D","L","W"]
  group?: string;
}

// Player stats
export interface PlayerSeasonStats {
  id: string;
  playerId: string;
  player?: Player;
  competitionSeasonId: string;
  clubId?: string;
  club?: Club;
  appearances: number;
  starts: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  averageRating?: number;
}

// Transfer types
export type TransferType = 'permanent' | 'loan' | 'loan_return' | 'free' | 'swap' | 'youth';

export interface Transfer {
  id: string;
  playerId?: string;
  player?: Player;
  fromClubId?: string;
  fromClub?: Club;
  toClubId?: string;
  toClub?: Club;
  type: TransferType;
  fee?: number;
  currency?: string;
  contractLength?: string;
  isConfirmed: boolean;
  announcedAt?: string;
  completedAt?: string;
}

// Weather types
export interface WeatherData {
  id: string;
  matchId?: string;
  venueId?: string;
  recordedAt: string;
  temperatureCelsius?: number;
  humidityPercent?: number;
  windSpeedKph?: number;
  windDirectionDegrees?: number;
  rainfallMm?: number;
  weatherCondition?: string;
  isForecast: boolean;
  rainProbabilityPercent?: number;
}

// Prediction types
export interface MatchPrediction {
  id: string;
  matchId: string;
  match?: Match;
  predictedOutcome: 'home' | 'draw' | 'away';
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  confidence?: number;
  btts?: boolean;
  overUnder?: number;
  overUnderPrediction?: 'over' | 'under';
  factors?: Record<string, unknown>;
  accuracy?: Record<string, unknown>;
  createdAt: string;
}
