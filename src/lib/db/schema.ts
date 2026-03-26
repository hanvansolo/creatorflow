import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  bigint,
  date,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== SEASONS =====
export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  year: integer('year').unique().notNull(),
  name: varchar('name', { length: 50 }), // e.g. "2025/26"
  isCurrent: boolean('is_current').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== COMPETITIONS =====
export const competitions = pgTable('competitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  shortName: varchar('short_name', { length: 30 }), // e.g. "PL", "UCL"
  type: varchar('type', { length: 30 }).notNull(), // league, cup, international
  country: varchar('country', { length: 50 }),
  countryCode: varchar('country_code', { length: 3 }),
  tier: integer('tier').default(1), // 1 = top flight
  logoUrl: text('logo_url'),
  apiFootballId: integer('api_football_id'), // API-Football league ID
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== COMPETITION SEASONS =====
export const competitionSeasons = pgTable('competition_seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitionId: uuid('competition_id').references(() => competitions.id, { onDelete: 'cascade' }).notNull(),
  seasonId: uuid('season_id').references(() => seasons.id).notNull(),
  apiFootballSeason: integer('api_football_season'), // API-Football season year
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: varchar('status', { length: 20 }).default('upcoming'), // upcoming, active, completed
  currentMatchday: integer('current_matchday'),
  totalMatchdays: integer('total_matchdays'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_competition_seasons_unique').on(table.competitionId, table.seasonId),
  index('idx_competition_seasons_status').on(table.status),
]);

// ===== CLUBS =====
export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 50 }),
  apiFootballId: integer('api_football_id'),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  shortName: varchar('short_name', { length: 30 }),
  code: varchar('code', { length: 5 }), // e.g. "ARS", "MCI"
  country: varchar('country', { length: 50 }),
  countryCode: varchar('country_code', { length: 3 }),
  founded: integer('founded'),
  stadium: varchar('stadium', { length: 100 }),
  manager: varchar('manager', { length: 100 }),
  primaryColor: varchar('primary_color', { length: 7 }),
  secondaryColor: varchar('secondary_color', { length: 7 }),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== PLAYERS =====
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 50 }),
  apiFootballId: integer('api_football_id'),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  knownAs: varchar('known_as', { length: 100 }), // e.g. "Vini Jr", "Mbappe"
  nationality: varchar('nationality', { length: 50 }),
  secondNationality: varchar('second_nationality', { length: 50 }),
  dateOfBirth: date('date_of_birth'),
  position: varchar('position', { length: 5 }).notNull(), // GK, DEF, MID, FWD
  detailedPosition: varchar('detailed_position', { length: 30 }), // CB, LB, RB, CDM, CAM, RW, LW, ST, etc.
  shirtNumber: integer('shirt_number'),
  currentClubId: uuid('current_club_id').references(() => clubs.id),
  height: integer('height'), // cm
  weight: integer('weight'), // kg
  preferredFoot: varchar('preferred_foot', { length: 10 }), // left, right, both
  headshotUrl: text('headshot_url'),
  biography: text('biography'),
  marketValue: decimal('market_value', { precision: 12, scale: 2 }), // in millions EUR
  contractUntil: date('contract_until'),
  fantasyPrice: decimal('fantasy_price', { precision: 5, scale: 1 }).default('5.0'), // in millions
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== VENUES =====
export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 50 }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 50 }).notNull(),
  countryCode: varchar('country_code', { length: 3 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  capacity: integer('capacity'),
  surfaceType: varchar('surface_type', { length: 30 }), // grass, artificial, hybrid
  yearBuilt: integer('year_built'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== MATCHES =====
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id),
  venueId: uuid('venue_id').references(() => venues.id),
  externalId: varchar('external_id', { length: 50 }),
  apiFootballId: integer('api_football_id'),
  matchday: integer('matchday'),
  round: varchar('round', { length: 100 }), // "Round of 16", "Semi-final", "Matchday 15"
  homeClubId: uuid('home_club_id').references(() => clubs.id).notNull(),
  awayClubId: uuid('away_club_id').references(() => clubs.id).notNull(),
  kickoff: timestamp('kickoff', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, live, halftime, finished, extra_time, penalties, postponed, cancelled, suspended
  minute: integer('minute'), // current match minute (null if not live)
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  homeScoreHt: integer('home_score_ht'), // half-time scores
  awayScoreHt: integer('away_score_ht'),
  homeScoreEt: integer('home_score_et'), // extra-time scores
  awayScoreEt: integer('away_score_et'),
  homePenalties: integer('home_penalties'), // penalty shootout
  awayPenalties: integer('away_penalties'),
  referee: varchar('referee', { length: 100 }),
  attendance: integer('attendance'),
  slug: varchar('slug', { length: 200 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_matches_kickoff').on(table.kickoff),
  index('idx_matches_competition_season').on(table.competitionSeasonId),
  index('idx_matches_status').on(table.status),
  index('idx_matches_home_club').on(table.homeClubId),
  index('idx_matches_away_club').on(table.awayClubId),
  uniqueIndex('idx_matches_api_football').on(table.apiFootballId),
]);

// ===== MATCH EVENTS =====
export const matchEvents = pgTable('match_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  eventType: varchar('event_type', { length: 30 }).notNull(), // goal, own_goal, penalty_scored, penalty_missed, yellow_card, second_yellow, red_card, substitution, var_decision
  minute: integer('minute').notNull(),
  addedTime: integer('added_time'), // injury time minutes
  playerId: uuid('player_id').references(() => players.id),
  secondPlayerId: uuid('second_player_id').references(() => players.id), // assist provider or substituted player
  clubId: uuid('club_id').references(() => clubs.id),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_match_events_match').on(table.matchId),
  index('idx_match_events_player').on(table.playerId),
  index('idx_match_events_type').on(table.eventType),
]);

// ===== MATCH LINEUPS =====
export const matchLineups = pgTable('match_lineups', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  clubId: uuid('club_id').references(() => clubs.id).notNull(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  shirtNumber: integer('shirt_number'),
  position: varchar('position', { length: 30 }),
  isStarter: boolean('is_starter').default(true),
  minuteIn: integer('minute_in'), // for subs: minute they came on
  minuteOut: integer('minute_out'), // minute they went off
  rating: decimal('rating', { precision: 3, scale: 1 }), // match rating 0-10
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_match_lineups_match').on(table.matchId),
  index('idx_match_lineups_club').on(table.matchId, table.clubId),
  uniqueIndex('idx_match_lineups_unique').on(table.matchId, table.playerId),
]);

// ===== MATCH STATISTICS =====
export const matchStats = pgTable('match_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  clubId: uuid('club_id').references(() => clubs.id).notNull(),
  possession: integer('possession'), // percentage
  shotsTotal: integer('shots_total').default(0),
  shotsOnTarget: integer('shots_on_target').default(0),
  shotsOffTarget: integer('shots_off_target').default(0),
  corners: integer('corners').default(0),
  fouls: integer('fouls').default(0),
  offsides: integer('offsides').default(0),
  yellowCards: integer('yellow_cards').default(0),
  redCards: integer('red_cards').default(0),
  saves: integer('saves').default(0),
  passesTotal: integer('passes_total'),
  passesAccurate: integer('passes_accurate'),
  passAccuracy: integer('pass_accuracy'), // percentage
  expectedGoals: decimal('expected_goals', { precision: 4, scale: 2 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_match_stats_unique').on(table.matchId, table.clubId),
  index('idx_match_stats_match').on(table.matchId),
]);

// ===== MATCH AI ANALYSIS =====
export const matchAnalysis = pgTable('match_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  analysisType: varchar('analysis_type', { length: 30 }).notNull(), // prediction, commentary, tactical, momentum
  minute: integer('minute'), // match minute when analysis was generated
  title: text('title'),
  content: text('content').notNull(),
  prediction: jsonb('prediction'), // { homeWinPct, drawPct, awayWinPct, expectedScore, confidence }
  momentum: varchar('momentum', { length: 10 }), // home, away, neutral
  keyInsight: text('key_insight'), // one-line headline insight
  triggeredBy: varchar('triggered_by', { length: 50 }), // goal, red_card, halftime, kickoff, var_decision
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_match_analysis_match').on(table.matchId),
  index('idx_match_analysis_type').on(table.analysisType),
]);

// ===== LEAGUE STANDINGS =====
export const leagueStandings = pgTable('league_standings', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id, { onDelete: 'cascade' }).notNull(),
  clubId: uuid('club_id').references(() => clubs.id).notNull(),
  position: integer('position').notNull(),
  played: integer('played').default(0),
  won: integer('won').default(0),
  drawn: integer('drawn').default(0),
  lost: integer('lost').default(0),
  goalsFor: integer('goals_for').default(0),
  goalsAgainst: integer('goals_against').default(0),
  goalDifference: integer('goal_difference').default(0),
  points: integer('points').default(0),
  form: jsonb('form'), // last 5 results: ["W","W","D","L","W"]
  group: varchar('group', { length: 100 }), // group name from API — can be league name or "A", "B", etc.
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_league_standings_competition').on(table.competitionSeasonId),
  uniqueIndex('idx_league_standings_unique').on(table.competitionSeasonId, table.clubId),
]);

// ===== PLAYER SEASON STATS =====
export const playerSeasonStats = pgTable('player_season_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id, { onDelete: 'cascade' }).notNull(),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id, { onDelete: 'cascade' }).notNull(),
  clubId: uuid('club_id').references(() => clubs.id),
  appearances: integer('appearances').default(0),
  starts: integer('starts').default(0),
  minutesPlayed: integer('minutes_played').default(0),
  goals: integer('goals').default(0),
  assists: integer('assists').default(0),
  yellowCards: integer('yellow_cards').default(0),
  redCards: integer('red_cards').default(0),
  cleanSheets: integer('clean_sheets').default(0), // for GK/DEF
  penaltiesScored: integer('penalties_scored').default(0),
  penaltiesMissed: integer('penalties_missed').default(0),
  ownGoals: integer('own_goals').default(0),
  passAccuracy: decimal('pass_accuracy', { precision: 5, scale: 2 }), // percentage
  shotsOnTarget: integer('shots_on_target').default(0),
  tackles: integer('tackles').default(0),
  interceptions: integer('interceptions').default(0),
  saves: integer('saves').default(0), // for GK
  averageRating: decimal('average_rating', { precision: 3, scale: 1 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_player_season_stats_unique').on(table.playerId, table.competitionSeasonId),
  index('idx_player_season_stats_competition').on(table.competitionSeasonId),
  index('idx_player_season_stats_goals').on(table.goals),
]);

// ===== NEWS SOURCES =====
export const newsSources = pgTable('news_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  type: varchar('type', { length: 20 }).notNull(), // rss, twitter, youtube, api
  url: text('url'),
  feedUrl: text('feed_url'),
  logoUrl: text('logo_url'),
  isActive: boolean('is_active').default(true),
  fetchIntervalMinutes: integer('fetch_interval_minutes').default(15),
  priority: integer('priority').default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== NEWS ARTICLES =====
export const newsArticles = pgTable('news_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').references(() => newsSources.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 500 }),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 300 }).unique().notNull(),
  summary: text('summary'),
  content: text('content'),
  author: varchar('author', { length: 200 }),
  imageUrl: text('image_url'),
  originalUrl: text('original_url').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  isBreaking: boolean('is_breaking').default(false),
  tags: text('tags').array(),
  storyGroupId: uuid('story_group_id'),
  isPrimaryStory: boolean('is_primary_story').default(false),
  originalTitle: text('original_title'),
  credibilityRating: varchar('credibility_rating', { length: 20 }),
  voteScore: integer('vote_score').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_news_articles_published_at').on(table.publishedAt),
  index('idx_news_articles_source_id').on(table.sourceId),
  index('idx_news_articles_story_group').on(table.storyGroupId),
  uniqueIndex('idx_news_articles_source_external').on(table.sourceId, table.externalId),
]);

// ===== ARTICLE VOTES =====
export const articleVotes = pgTable('article_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => newsArticles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  visitorId: varchar('visitor_id', { length: 64 }),
  voteType: integer('vote_type').notNull(), // 1 = upvote, -1 = downvote
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_article_votes_user').on(table.articleId, table.userId),
  uniqueIndex('idx_article_votes_visitor').on(table.articleId, table.visitorId),
  index('idx_article_votes_article').on(table.articleId),
]);

// ===== YOUTUBE VIDEOS =====
export const youtubeVideos = pgTable('youtube_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoId: varchar('video_id', { length: 20 }).unique().notNull(),
  channelId: varchar('channel_id', { length: 30 }).notNull(),
  channelName: varchar('channel_name', { length: 200 }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: integer('duration_seconds'),
  viewCount: bigint('view_count', { mode: 'number' }).default(0),
  likeCount: integer('like_count').default(0),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  tags: text('tags').array(),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_youtube_videos_published_at').on(table.publishedAt),
  index('idx_youtube_videos_channel_id').on(table.channelId),
]);

// ===== MATCH PREDICTIONS =====
export const matchPredictions = pgTable('match_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  predictedOutcome: varchar('predicted_outcome', { length: 10 }).notNull(), // home, draw, away
  predictedHomeScore: integer('predicted_home_score'),
  predictedAwayScore: integer('predicted_away_score'),
  confidence: integer('confidence'), // 0-100
  btts: boolean('btts'), // both teams to score
  overUnder: decimal('over_under', { precision: 3, scale: 1 }), // e.g. 2.5
  overUnderPrediction: varchar('over_under_prediction', { length: 10 }), // over, under
  factors: jsonb('factors'), // {form: ..., h2h: ..., homeAdvantage: ..., injuries: ...}
  accuracy: jsonb('accuracy'), // filled after match: {outcomeCorrect, scoreCorrect, ...}
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_match_predictions_match').on(table.matchId),
  index('idx_match_predictions_created').on(table.createdAt),
]);

// ===== AI ANALYSIS =====
export const aiAnalysis = pgTable('ai_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: varchar('source', { length: 100 }).notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(), // news, match_preview, transfer, tactical
  content: text('content'),
  summary: text('summary').notNull(),
  explanation: text('explanation'),
  clubUpdates: jsonb('club_updates'),
  playerUpdates: jsonb('player_updates'),
  confidenceAdjustments: jsonb('confidence_adjustments'),
  appliedAt: timestamp('applied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_ai_analysis_created').on(table.createdAt),
  index('idx_ai_analysis_type').on(table.analysisType),
]);

// ===== TRANSFER WINDOWS =====
export const transferWindows = pgTable('transfer_windows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(), // "Summer 2026", "January 2026"
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  type: varchar('type', { length: 20 }).notNull(), // summer, winter
  seasonId: uuid('season_id').references(() => seasons.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 20 }).default('upcoming'), // upcoming, open, closed
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== TRANSFERS =====
export const transfers = pgTable('transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id),
  fromClubId: uuid('from_club_id').references(() => clubs.id),
  toClubId: uuid('to_club_id').references(() => clubs.id),
  transferWindowId: uuid('transfer_window_id').references(() => transferWindows.id),
  type: varchar('type', { length: 20 }).notNull(), // permanent, loan, loan_return, free, swap, youth
  fee: decimal('fee', { precision: 12, scale: 2 }), // in millions EUR
  currency: varchar('currency', { length: 3 }).default('EUR'),
  contractLength: varchar('contract_length', { length: 30 }), // "5 years", "Until 2030"
  isConfirmed: boolean('is_confirmed').default(false),
  announcedAt: timestamp('announced_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_transfers_player').on(table.playerId),
  index('idx_transfers_window').on(table.transferWindowId),
  index('idx_transfers_from_club').on(table.fromClubId),
  index('idx_transfers_to_club').on(table.toClubId),
]);

// ===== MATCH WEATHER =====
export const matchWeather = pgTable('match_weather', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }),
  venueId: uuid('venue_id').references(() => venues.id),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  temperatureCelsius: decimal('temperature_celsius', { precision: 5, scale: 2 }),
  humidityPercent: integer('humidity_percent'),
  windSpeedKph: decimal('wind_speed_kph', { precision: 5, scale: 2 }),
  windDirectionDegrees: integer('wind_direction_degrees'),
  rainfallMm: decimal('rainfall_mm', { precision: 5, scale: 2 }),
  weatherCondition: varchar('weather_condition', { length: 50 }),
  isForecast: boolean('is_forecast').default(false),
  rainProbabilityPercent: integer('rain_probability_percent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_match_weather_match').on(table.matchId),
]);

// ===== AGGREGATION JOBS =====
export const aggregationJobs = pgTable('aggregation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('running'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  itemsProcessed: integer('items_processed').default(0),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
}, (table) => [
  index('idx_aggregation_jobs_lookup').on(table.jobType, table.startedAt),
]);

// ===== BROADCAST CHANNELS =====
export const broadcastChannels = pgTable('broadcast_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  region: varchar('region', { length: 50 }).notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  streamingUrl: text('streaming_url'),
  isStreaming: boolean('is_streaming').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== DAILY ROUNDUPS =====
export const dailyRoundups = pgTable('daily_roundups', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull().unique(),
  verifiedSummary: text('verified_summary'),
  unverifiedSummary: text('unverified_summary'),
  rumourSummary: text('rumour_summary'),
  verifiedArticleCount: integer('verified_article_count').default(0),
  unverifiedArticleCount: integer('unverified_article_count').default(0),
  rumourArticleCount: integer('rumour_article_count').default(0),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== RUMOUR TRACKER =====
export const rumours = pgTable('rumours', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  rumourType: varchar('rumour_type', { length: 50 }).notNull(), // transfer, contract, manager, takeover

  // Subjects
  subjectPlayerId: uuid('subject_player_id').references(() => players.id),
  subjectClubId: uuid('subject_club_id').references(() => clubs.id),
  targetClubId: uuid('target_club_id').references(() => clubs.id),

  // AI-generated
  summary: text('summary').notNull(),
  probabilityScore: integer('probability_score').notNull(), // 0-100
  probabilityReasoning: text('probability_reasoning'),

  // Status
  status: varchar('status', { length: 20 }).default('new').notNull(), // new, heating_up, cooling_down, confirmed, denied
  statusHistory: jsonb('status_history').default('[]'),

  // Tracking
  sourceCount: integer('source_count').default(1),
  firstReportedAt: timestamp('first_reported_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_rumours_status').on(table.status),
  index('idx_rumours_probability').on(table.probabilityScore),
]);

export const rumourSources = pgTable('rumour_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  rumourId: uuid('rumour_id').references(() => rumours.id, { onDelete: 'cascade' }).notNull(),
  articleId: uuid('article_id').references(() => newsArticles.id).notNull(),
  credibilityRating: varchar('credibility_rating', { length: 20 }).notNull(),
  extractedAt: timestamp('extracted_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_rumour_source_unique').on(table.rumourId, table.articleId),
  index('idx_rumour_sources_rumour').on(table.rumourId),
]);

// ===== VAR DECISIONS =====
export const varDecisions = pgTable('var_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  minute: integer('minute').notNull(),
  addedTime: integer('added_time'),

  // Decision details
  type: varchar('type', { length: 30 }).notNull(), // goal, penalty, red_card, identity, offside
  originalDecision: text('original_decision').notNull(),
  finalDecision: text('final_decision').notNull(),
  wasOverturned: boolean('was_overturned').default(false),
  description: text('description'),

  // Involved parties
  players: jsonb('players').$type<string[]>(), // Player names involved
  clubs: jsonb('clubs').$type<string[]>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_var_decisions_match').on(table.matchId),
]);

// ===== DISCIPLINARY ACTIONS =====
export const disciplinaryActions = pgTable('disciplinary_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id),
  clubId: uuid('club_id').references(() => clubs.id),
  matchId: uuid('match_id').references(() => matches.id),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id),

  type: varchar('type', { length: 20 }).notNull(), // yellow, red, suspension, fine, ban
  reason: text('reason'),
  matchesBanned: integer('matches_banned').default(0),
  fineAmount: decimal('fine_amount', { precision: 12, scale: 2 }),

  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_disciplinary_player').on(table.playerId),
  index('idx_disciplinary_club').on(table.clubId),
  index('idx_disciplinary_match').on(table.matchId),
]);

// ===== CRON SETTINGS =====
export const cronSettings = pgTable('cron_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobName: varchar('job_name', { length: 50 }).notNull().unique(),
  intervalMs: integer('interval_ms').notNull(),
  enabled: boolean('enabled').default(true),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastStatus: varchar('last_status', { length: 20 }),
  lastResult: jsonb('last_result'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== SITE SETTINGS =====
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== USERS =====
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('user'), // user, admin, superadmin
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ===== FANTASY LEAGUES =====
export const leagues = pgTable('leagues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  inviteCode: varchar('invite_code', { length: 8 }).unique().notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id),
  isPublic: boolean('is_public').default(false),
  maxMembers: integer('max_members').default(50),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_leagues_owner').on(table.ownerId),
  index('idx_leagues_invite_code').on(table.inviteCode),
]);

export const leagueMembers = pgTable('league_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').references(() => leagues.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  isAi: boolean('is_ai').default(false),
  displayName: varchar('display_name', { length: 100 }),
  role: varchar('role', { length: 20 }).default('member'),
  totalPoints: integer('total_points').default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_league_members_league').on(table.leagueId),
  index('idx_league_members_user').on(table.userId),
  index('idx_league_members_points').on(table.leagueId, table.totalPoints),
]);

// ===== GAMEWEEKS =====
export const gameweeks = pgTable('gameweeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id, { onDelete: 'cascade' }).notNull(),
  number: integer('number').notNull(),
  name: varchar('name', { length: 50 }), // "Gameweek 1"
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  deadline: timestamp('deadline', { withTimezone: true }), // fantasy team lock deadline
  isComplete: boolean('is_complete').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_gameweeks_unique').on(table.competitionSeasonId, table.number),
]);

export const userPredictions = pgTable('user_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  leagueMemberId: uuid('league_member_id').references(() => leagueMembers.id, { onDelete: 'cascade' }).notNull(),
  predictedHomeScore: integer('predicted_home_score'),
  predictedAwayScore: integer('predicted_away_score'),
  predictedOutcome: varchar('predicted_outcome', { length: 10 }), // home, draw, away
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  isLocked: boolean('is_locked').default(false),
  pointsEarned: integer('points_earned'),
  accuracy: jsonb('accuracy'),
  scoredAt: timestamp('scored_at', { withTimezone: true }),
}, (table) => [
  index('idx_user_predictions_match').on(table.matchId),
  index('idx_user_predictions_member').on(table.leagueMemberId),
]);

export const leagueGameweekStandings = pgTable('league_gameweek_standings', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').references(() => leagues.id, { onDelete: 'cascade' }).notNull(),
  gameweekId: uuid('gameweek_id').references(() => gameweeks.id, { onDelete: 'cascade' }).notNull(),
  leagueMemberId: uuid('league_member_id').references(() => leagueMembers.id, { onDelete: 'cascade' }).notNull(),
  points: integer('points').default(0).notNull(),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_league_gw_standings_lookup').on(table.leagueId, table.gameweekId),
  index('idx_league_gw_standings_member').on(table.leagueMemberId),
]);

// ===== FANTASY TEAMS =====
export const fantasyTeams = pgTable('fantasy_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueMemberId: uuid('league_member_id').references(() => leagueMembers.id, { onDelete: 'cascade' }).notNull(),
  competitionSeasonId: uuid('competition_season_id').references(() => competitionSeasons.id),
  budget: decimal('budget', { precision: 10, scale: 2 }).default('100.00').notNull(),
  totalPoints: integer('total_points').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_fantasy_teams_member').on(table.leagueMemberId),
  uniqueIndex('idx_fantasy_teams_unique').on(table.leagueMemberId, table.competitionSeasonId),
]);

export const fantasyTeamPlayers = pgTable('fantasy_team_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  fantasyTeamId: uuid('fantasy_team_id').references(() => fantasyTeams.id, { onDelete: 'cascade' }).notNull(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  position: varchar('position', { length: 5 }).notNull(), // GK, DEF, MID, FWD
  isCaptain: boolean('is_captain').default(false), // 2x points
  isViceCaptain: boolean('is_vice_captain').default(false), // backup captain
  isBenched: boolean('is_benched').default(false),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }).defaultNow(),
  acquiredPrice: decimal('acquired_price', { precision: 5, scale: 1 }).default('5.0').notNull(),
  isActive: boolean('is_active').default(true),
  droppedAt: timestamp('dropped_at', { withTimezone: true }),
}, (table) => [
  index('idx_fantasy_team_players_team').on(table.fantasyTeamId),
  index('idx_fantasy_team_players_player').on(table.playerId),
]);

export const fantasyTransactions = pgTable('fantasy_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fantasyTeamId: uuid('fantasy_team_id').references(() => fantasyTeams.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // acquire, drop, points, bonus
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  playerId: uuid('player_id').references(() => players.id),
  gameweekId: uuid('gameweek_id').references(() => gameweeks.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_fantasy_transactions_team').on(table.fantasyTeamId),
  index('idx_fantasy_transactions_gameweek').on(table.gameweekId),
]);

// ===== MATCH PREVIEWS =====
export const matchPreviews = pgTable('match_previews', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull().unique(),

  executiveSummary: text('executive_summary'),
  keyBattles: jsonb('key_battles'), // [{players: [], description, prediction}]
  formAnalysis: jsonb('form_analysis'),
  headToHead: jsonb('head_to_head'),
  teamNews: jsonb('team_news'), // injuries, suspensions
  predictedXI: jsonb('predicted_xi'), // {home: [...], away: [...]}

  narrativeContent: text('narrative_content'),

  version: integer('version').default(1),
  status: varchar('status', { length: 20 }).default('draft'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_match_previews_match').on(table.matchId),
  index('idx_match_previews_status').on(table.status),
]);

// ===== WHAT IF SIMULATOR =====
export const whatIfScenarios = pgTable('what_if_scenarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),

  scenarioType: varchar('scenario_type', { length: 50 }).notNull(), // transfer, tactical, historical, rule_change, championship

  shortAnswer: text('short_answer'),
  detailedAnalysis: text('detailed_analysis'),
  keyFactors: jsonb('key_factors'),
  alternativeOutcomes: jsonb('alternative_outcomes'),
  confidenceLevel: varchar('confidence_level', { length: 20 }),

  isPopular: boolean('is_popular').default(false),
  viewCount: integer('view_count').default(0),
  generationType: varchar('generation_type', { length: 20 }),
  tags: text('tags').array(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_what_if_scenarios_type').on(table.scenarioType),
  index('idx_what_if_scenarios_popular').on(table.isPopular),
  index('idx_what_if_scenarios_views').on(table.viewCount),
]);

// ===== TACTICAL ANALYSIS =====
export const tacticalAnalysis = pgTable('tactical_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),

  category: varchar('category', { length: 50 }).notNull(), // formation, pressing, set_pieces, transitions, player_roles, data_analysis
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),

  summary: text('summary').notNull(),
  explanation: text('explanation').notNull(),
  keyConcepts: jsonb('key_concepts'),
  realWorldExample: text('real_world_example'),
  visualDescription: text('visual_description'),

  sourceArticleId: uuid('source_article_id').references(() => newsArticles.id),
  relatedArticleIds: uuid('related_article_ids').array(),
  triggerPhrase: text('trigger_phrase'),

  isPublished: boolean('is_published').default(true),
  viewCount: integer('view_count').default(0),
  tags: text('tags').array(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_tactical_analysis_category').on(table.category),
  index('idx_tactical_analysis_source').on(table.sourceArticleId),
]);

// ===== NEWSLETTER SUBSCRIBERS =====
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  source: varchar('source', { length: 50 }).default('popup').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
});

// ===== COMMENTS =====
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull(),
  contentId: varchar('content_id', { length: 255 }).notNull(),
  parentId: uuid('parent_id'),
  body: text('body').notNull(),
  likes: integer('likes').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_comments_content').on(table.contentType, table.contentId),
  index('idx_comments_user').on(table.userId),
  index('idx_comments_parent').on(table.parentId),
]);

// ===== CONTACT MESSAGES =====
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('unread').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ===== RELATIONS =====

export const competitionsRelations = relations(competitions, ({ many }) => ({
  competitionSeasons: many(competitionSeasons),
}));

export const competitionSeasonsRelations = relations(competitionSeasons, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [competitionSeasons.competitionId],
    references: [competitions.id],
  }),
  season: one(seasons, {
    fields: [competitionSeasons.seasonId],
    references: [seasons.id],
  }),
  standings: many(leagueStandings),
  matches: many(matches),
  gameweeks: many(gameweeks),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  players: many(players),
  homeMatches: many(matches, { relationName: 'homeClub' }),
  awayMatches: many(matches, { relationName: 'awayClub' }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  currentClub: one(clubs, {
    fields: [players.currentClubId],
    references: [clubs.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  competitionSeason: one(competitionSeasons, {
    fields: [matches.competitionSeasonId],
    references: [competitionSeasons.id],
  }),
  venue: one(venues, {
    fields: [matches.venueId],
    references: [venues.id],
  }),
  homeClub: one(clubs, {
    fields: [matches.homeClubId],
    references: [clubs.id],
    relationName: 'homeClub',
  }),
  awayClub: one(clubs, {
    fields: [matches.awayClubId],
    references: [clubs.id],
    relationName: 'awayClub',
  }),
  events: many(matchEvents),
  lineups: many(matchLineups),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, {
    fields: [matchEvents.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [matchEvents.playerId],
    references: [players.id],
  }),
  club: one(clubs, {
    fields: [matchEvents.clubId],
    references: [clubs.id],
  }),
}));

export const matchLineupsRelations = relations(matchLineups, ({ one }) => ({
  match: one(matches, {
    fields: [matchLineups.matchId],
    references: [matches.id],
  }),
  club: one(clubs, {
    fields: [matchLineups.clubId],
    references: [clubs.id],
  }),
  player: one(players, {
    fields: [matchLineups.playerId],
    references: [players.id],
  }),
}));

export const leagueStandingsRelations = relations(leagueStandings, ({ one }) => ({
  competitionSeason: one(competitionSeasons, {
    fields: [leagueStandings.competitionSeasonId],
    references: [competitionSeasons.id],
  }),
  club: one(clubs, {
    fields: [leagueStandings.clubId],
    references: [clubs.id],
  }),
}));

export const playerSeasonStatsRelations = relations(playerSeasonStats, ({ one }) => ({
  player: one(players, {
    fields: [playerSeasonStats.playerId],
    references: [players.id],
  }),
  competitionSeason: one(competitionSeasons, {
    fields: [playerSeasonStats.competitionSeasonId],
    references: [competitionSeasons.id],
  }),
  club: one(clubs, {
    fields: [playerSeasonStats.clubId],
    references: [clubs.id],
  }),
}));

export const matchPredictionsRelations = relations(matchPredictions, ({ one }) => ({
  match: one(matches, {
    fields: [matchPredictions.matchId],
    references: [matches.id],
  }),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one }) => ({
  source: one(newsSources, {
    fields: [newsArticles.sourceId],
    references: [newsSources.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  player: one(players, {
    fields: [transfers.playerId],
    references: [players.id],
  }),
  fromClub: one(clubs, {
    fields: [transfers.fromClubId],
    references: [clubs.id],
    relationName: 'fromClub',
  }),
  toClub: one(clubs, {
    fields: [transfers.toClubId],
    references: [clubs.id],
    relationName: 'toClub',
  }),
  transferWindow: one(transferWindows, {
    fields: [transfers.transferWindowId],
    references: [transferWindows.id],
  }),
}));

export const rumoursRelations = relations(rumours, ({ one, many }) => ({
  subjectPlayer: one(players, {
    fields: [rumours.subjectPlayerId],
    references: [players.id],
  }),
  subjectClub: one(clubs, {
    fields: [rumours.subjectClubId],
    references: [clubs.id],
    relationName: 'subjectClub',
  }),
  targetClub: one(clubs, {
    fields: [rumours.targetClubId],
    references: [clubs.id],
    relationName: 'targetClub',
  }),
  sources: many(rumourSources),
}));

export const rumourSourcesRelations = relations(rumourSources, ({ one }) => ({
  rumour: one(rumours, {
    fields: [rumourSources.rumourId],
    references: [rumours.id],
  }),
  article: one(newsArticles, {
    fields: [rumourSources.articleId],
    references: [newsArticles.id],
  }),
}));

export const varDecisionsRelations = relations(varDecisions, ({ one }) => ({
  match: one(matches, {
    fields: [varDecisions.matchId],
    references: [matches.id],
  }),
}));

export const tacticalAnalysisRelations = relations(tacticalAnalysis, ({ one }) => ({
  sourceArticle: one(newsArticles, {
    fields: [tacticalAnalysis.sourceArticleId],
    references: [newsArticles.id],
  }),
}));

export const matchPreviewsRelations = relations(matchPreviews, ({ one }) => ({
  match: one(matches, {
    fields: [matchPreviews.matchId],
    references: [matches.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
}));

// Fantasy Relations
export const leaguesRelations = relations(leagues, ({ one, many }) => ({
  owner: one(users, {
    fields: [leagues.ownerId],
    references: [users.id],
  }),
  competitionSeason: one(competitionSeasons, {
    fields: [leagues.competitionSeasonId],
    references: [competitionSeasons.id],
  }),
  members: many(leagueMembers),
}));

export const leagueMembersRelations = relations(leagueMembers, ({ one, many }) => ({
  league: one(leagues, {
    fields: [leagueMembers.leagueId],
    references: [leagues.id],
  }),
  user: one(users, {
    fields: [leagueMembers.userId],
    references: [users.id],
  }),
  predictions: many(userPredictions),
}));

export const userPredictionsRelations = relations(userPredictions, ({ one }) => ({
  match: one(matches, {
    fields: [userPredictions.matchId],
    references: [matches.id],
  }),
  leagueMember: one(leagueMembers, {
    fields: [userPredictions.leagueMemberId],
    references: [leagueMembers.id],
  }),
}));

export const fantasyTeamsRelations = relations(fantasyTeams, ({ one, many }) => ({
  leagueMember: one(leagueMembers, {
    fields: [fantasyTeams.leagueMemberId],
    references: [leagueMembers.id],
  }),
  players: many(fantasyTeamPlayers),
  transactions: many(fantasyTransactions),
}));

export const fantasyTeamPlayersRelations = relations(fantasyTeamPlayers, ({ one }) => ({
  fantasyTeam: one(fantasyTeams, {
    fields: [fantasyTeamPlayers.fantasyTeamId],
    references: [fantasyTeams.id],
  }),
  player: one(players, {
    fields: [fantasyTeamPlayers.playerId],
    references: [players.id],
  }),
}));

export const fantasyTransactionsRelations = relations(fantasyTransactions, ({ one }) => ({
  fantasyTeam: one(fantasyTeams, {
    fields: [fantasyTransactions.fantasyTeamId],
    references: [fantasyTeams.id],
  }),
  player: one(players, {
    fields: [fantasyTransactions.playerId],
    references: [players.id],
  }),
  gameweek: one(gameweeks, {
    fields: [fantasyTransactions.gameweekId],
    references: [gameweeks.id],
  }),
}));

export const gameweeksRelations = relations(gameweeks, ({ one }) => ({
  competitionSeason: one(competitionSeasons, {
    fields: [gameweeks.competitionSeasonId],
    references: [competitionSeasons.id],
  }),
}));

export const leagueGameweekStandingsRelations = relations(leagueGameweekStandings, ({ one }) => ({
  league: one(leagues, {
    fields: [leagueGameweekStandings.leagueId],
    references: [leagues.id],
  }),
  gameweek: one(gameweeks, {
    fields: [leagueGameweekStandings.gameweekId],
    references: [gameweeks.id],
  }),
  leagueMember: one(leagueMembers, {
    fields: [leagueGameweekStandings.leagueMemberId],
    references: [leagueMembers.id],
  }),
}));
