export interface MatchDetail {
  id: string;
  home_name: string;
  away_name: string;
  home_slug: string;
  away_slug: string;
  home_code: string | null;
  away_code: string | null;
  home_color: string | null;
  away_color: string | null;
  home_logo: string | null;
  away_logo: string | null;
  home_api_id: number | null;
  away_api_id: number | null;
  home_club_id: string;
  away_club_id: string;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  status: string;
  minute: number | null;
  referee: string | null;
  competition_name: string | null;
  competition_slug: string | null;
  competition_type: string | null;
  venue_name: string | null;
  venue_city: string | null;
  round: string | null;
  kickoff: string;
  api_football_id: number | null;
}

export interface MatchEvent {
  id?: string;
  event_type: string;
  minute: number;
  added_time: number | null;
  player_known_as: string | null;
  player_first_name: string | null;
  player_last_name: string | null;
  second_player_known_as: string | null;
  second_player_first_name: string | null;
  second_player_last_name: string | null;
  club_name: string | null;
  club_code: string | null;
  club_id: string | null;
  is_home?: boolean;
  description: string | null;
}

export interface TeamStats {
  club_name: string;
  club_id: string | null;
  possession: number | null;
  shots_total: number | null;
  shots_on_target: number | null;
  shots_off_target: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  saves: number | null;
  passes_total: number | null;
  passes_accurate: number | null;
  expected_goals: number | null;
}

export interface MatchAnalysisRow {
  id: string;
  minute: number | null;
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  expected_score: string | null;
  confidence: number | null;
  momentum: string | null;
  key_insight: string | null;
  analysis: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
}

export interface LineupData {
  team: { id: number; name: string; logo: string };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: Array<{ player: LineupPlayer }>;
  substitutes: Array<{ player: LineupPlayer }>;
}

export interface PlayerRating {
  name: string;
  photo: string;
  position: string;
  rating: string | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots: number | null;
  passes: number | null;
  tackles: number | null;
  teamName: string;
  teamId: number;
  playerId?: number; // API-Football player ID
  slug?: string; // player slug for profile link
}

export interface PredictionData {
  predictions: {
    winner: { id: number; name: string; comment: string } | null;
    advice: string;
    percent: { home: string; draw: string; away: string };
    goals: { home: string; away: string };
  };
  teams: {
    home: { id: number; name: string; logo: string; last_5: { form: string } };
    away: { id: number; name: string; logo: string; last_5: { form: string } };
  };
  comparison: Record<string, { home: string; away: string }>;
  h2h: any[];
}

export interface InjuryData {
  player: { id: number; name: string; photo: string; type: string; reason: string };
  team: { id: number; name: string; logo: string };
}

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string;
  sourceName: string | null;
}

export interface SquadPlayer {
  id: string;
  knownAs: string | null;
  firstName: string | null;
  lastName: string | null;
  slug: string;
  position: string;
  shirtNumber: number | null;
  headshotUrl: string | null;
  age: number | null;
}

export interface MatchPageData {
  match: MatchDetail;
  events: MatchEvent[];
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  analyses: MatchAnalysisRow[];
  lineups: LineupData[];
  playerRatings: PlayerRating[];
  predictions: PredictionData | null;
  injuries: InjuryData[];
  odds: any | null;
  homeSquad: SquadPlayer[];
  awaySquad: SquadPlayer[];
  articles: RelatedArticle[];
}

export interface LiveRefreshData {
  status: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  events: MatchEvent[];
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  latestAnalysis: MatchAnalysisRow | null;
}
