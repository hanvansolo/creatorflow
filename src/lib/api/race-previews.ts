import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import {
  racePreviews,
  previewUpdates,
  races,
  raceSessions,
  circuits,
  drivers,
  teams,
  driverStandings,
  constructorStandings,
  raceResults,
  weatherData,
  seasons,
  driverTrackPerformance,
} from '@/lib/db/schema';
import { eq, and, gte, lt, lte, desc, asc, isNull, sql } from 'drizzle-orm';

// Lazy-load Anthropic client to avoid initialization issues
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

interface KeyBattle {
  drivers: string[];
  description: string;
  prediction: string;
}

interface StrategyPrediction {
  strategy: string;
  likelihood: string;
  teams: string[];
  explanation: string;
}

interface WeatherAnalysis {
  expectedConditions: string;
  rainProbability: number;
  temperatureRange: string;
  impact: string;
}

interface HistoricalContext {
  previousWinners: string[];
  trackCharacteristics: string;
  keyFacts: string[];
}

interface PodiumPrediction {
  p1: { driver: string; team: string; confidence: number };
  p2: { driver: string; team: string; confidence: number };
  p3: { driver: string; team: string; confidence: number };
}

interface DarkHorsePick {
  driver: string;
  team: string;
  reason: string;
  outsiderOdds: string;
}

interface RacePreviewContent {
  executiveSummary: string;
  keyBattles: KeyBattle[];
  strategyPredictions: StrategyPrediction[];
  weatherAnalysis: WeatherAnalysis;
  historicalContext: HistoricalContext;
  podiumPrediction: PodiumPrediction;
  darkHorsePick: DarkHorsePick;
  narrativeContent: string;
}

/**
 * Get upcoming races within the next X days that don't have previews yet
 */
export async function getUpcomingRacesWithoutPreviews(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const upcomingRaces = await db
    .select({
      id: races.id,
      name: races.name,
      slug: races.slug,
      round: races.round,
      raceDatetime: races.raceDatetime,
      isSprintWeekend: races.isSprintWeekend,
      circuitId: races.circuitId,
      circuitName: circuits.name,
      circuitCountry: circuits.country,
      circuitLocation: circuits.location,
    })
    .from(races)
    .leftJoin(circuits, eq(races.circuitId, circuits.id))
    .leftJoin(racePreviews, eq(races.id, racePreviews.raceId))
    .where(
      and(
        gte(races.raceDatetime, now),
        lt(races.raceDatetime, futureDate),
        eq(racePreviews.id, null as unknown as string) // No existing preview
      )
    )
    .orderBy(asc(races.raceDatetime));

  return upcomingRaces;
}

/**
 * Get context data for generating a race preview
 */
async function getRaceContext(raceId: string, circuitId: string | null) {
  // Get current season
  const [currentSeason] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isCurrent, true))
    .limit(1);

  // Get current driver standings
  const driverStandingsData = currentSeason
    ? await db
        .select({
          position: driverStandings.position,
          points: driverStandings.points,
          wins: driverStandings.wins,
          driverFirstName: drivers.firstName,
          driverLastName: drivers.lastName,
          driverCode: drivers.code,
          teamName: teams.name,
        })
        .from(driverStandings)
        .leftJoin(drivers, eq(driverStandings.driverId, drivers.id))
        .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
        .where(eq(driverStandings.seasonId, currentSeason.id))
        .orderBy(asc(driverStandings.position))
        .limit(20)
    : [];

  // Get constructor standings
  const constructorStandingsData = currentSeason
    ? await db
        .select({
          position: constructorStandings.position,
          points: constructorStandings.points,
          wins: constructorStandings.wins,
          teamName: teams.name,
        })
        .from(constructorStandings)
        .leftJoin(teams, eq(constructorStandings.teamId, teams.id))
        .where(eq(constructorStandings.seasonId, currentSeason.id))
        .orderBy(asc(constructorStandings.position))
        .limit(10)
    : [];

  // Get recent race results (last 3 races)
  const recentResults = await db
    .select({
      raceName: races.name,
      position: raceResults.position,
      points: raceResults.points,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      driverCode: drivers.code,
      teamName: teams.name,
    })
    .from(raceResults)
    .leftJoin(races, eq(raceResults.raceId, races.id))
    .leftJoin(drivers, eq(raceResults.driverId, drivers.id))
    .leftJoin(teams, eq(raceResults.teamId, teams.id))
    .where(lt(races.raceDatetime, new Date()))
    .orderBy(desc(races.raceDatetime), asc(raceResults.position))
    .limit(60); // Top 20 from last 3 races

  // Get circuit info
  const circuitInfo = circuitId
    ? await db
        .select()
        .from(circuits)
        .where(eq(circuits.id, circuitId))
        .limit(1)
    : [];

  // Get weather forecast if available
  const weatherForecast = circuitId
    ? await db
        .select()
        .from(weatherData)
        .where(
          and(eq(weatherData.circuitId, circuitId), eq(weatherData.isForecast, true))
        )
        .orderBy(desc(weatherData.recordedAt))
        .limit(5)
    : [];

  // Get driver track performance for this circuit
  const trackPerformanceData = circuitId
    ? await db
        .select({
          driverFirstName: drivers.firstName,
          driverLastName: drivers.lastName,
          driverCode: drivers.code,
          teamName: teams.name,
          overallRating: driverTrackPerformance.overallRating,
          qualifyingStrength: driverTrackPerformance.qualifyingStrength,
          racePaceStrength: driverTrackPerformance.racePaceStrength,
          overtakingAbility: driverTrackPerformance.overtakingAbility,
          wetWeatherRating: driverTrackPerformance.wetWeatherRating,
          strengthDescription: driverTrackPerformance.strengthDescription,
          weaknessDescription: driverTrackPerformance.weaknessDescription,
          averageFinish: driverTrackPerformance.averageFinish,
          bestFinish: driverTrackPerformance.bestFinish,
          racesAtCircuit: driverTrackPerformance.racesAtCircuit,
        })
        .from(driverTrackPerformance)
        .leftJoin(drivers, eq(driverTrackPerformance.driverId, drivers.id))
        .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
        .where(eq(driverTrackPerformance.circuitId, circuitId))
        .orderBy(desc(driverTrackPerformance.overallRating))
    : [];

  // Get historical results at this circuit (last 3 years)
  const historicalCircuitResults = circuitId
    ? await db
        .select({
          raceName: races.name,
          raceYear: races.raceDatetime,
          position: raceResults.position,
          driverFirstName: drivers.firstName,
          driverLastName: drivers.lastName,
          driverCode: drivers.code,
          teamName: teams.name,
        })
        .from(raceResults)
        .leftJoin(races, eq(raceResults.raceId, races.id))
        .leftJoin(circuits, eq(races.circuitId, circuits.id))
        .leftJoin(drivers, eq(raceResults.driverId, drivers.id))
        .leftJoin(teams, eq(raceResults.teamId, teams.id))
        .where(eq(circuits.id, circuitId))
        .orderBy(desc(races.raceDatetime), asc(raceResults.position))
        .limit(30) // Top 10 from last 3 races at this circuit
    : [];

  return {
    driverStandings: driverStandingsData,
    constructorStandings: constructorStandingsData,
    recentResults,
    circuit: circuitInfo[0] || null,
    weatherForecast,
    trackPerformance: trackPerformanceData,
    historicalCircuitResults,
  };
}

/**
 * Generate a race preview using AI
 */
export async function generateRacePreview(
  raceId: string,
  raceName: string,
  circuitId: string | null
): Promise<RacePreviewContent | null> {
  const context = await getRaceContext(raceId, circuitId);

  // Format standings for prompt
  const standingsText = context.driverStandings
    .slice(0, 10)
    .map(
      (d) =>
        `${d.position}. ${d.driverFirstName} ${d.driverLastName} (${d.teamName}) - ${d.points} pts, ${d.wins} wins`
    )
    .join('\n');

  const constructorText = context.constructorStandings
    .slice(0, 5)
    .map((c) => `${c.position}. ${c.teamName} - ${c.points} pts`)
    .join('\n');

  const circuitText = context.circuit
    ? `Circuit: ${context.circuit.name}, ${context.circuit.country}
Length: ${context.circuit.lengthMeters ? `${(context.circuit.lengthMeters / 1000).toFixed(3)}km` : 'Unknown'}
Turns: ${context.circuit.turns || 'Unknown'}
DRS Zones: ${context.circuit.drsZones || 'Unknown'}
Circuit Type: ${context.circuit.circuitType || 'Unknown'}
Lap Record: ${context.circuit.lapRecordTime || 'Unknown'} (${context.circuit.lapRecordDriver || 'Unknown'}, ${context.circuit.lapRecordYear || 'Unknown'})`
    : 'Circuit information unavailable';

  const weatherText =
    context.weatherForecast.length > 0
      ? `Weather Forecast:
${context.weatherForecast
    .map(
      (w) =>
        `- Temp: ${w.temperatureCelsius}°C, Track: ${w.trackTemperatureCelsius}°C, Rain: ${w.rainProbabilityPercent}%, Conditions: ${w.weatherCondition}`
    )
    .join('\n')}`
      : 'Weather forecast not yet available - using typical conditions for this circuit.';

  // Format driver track performance data
  const trackPerformanceText =
    context.trackPerformance && context.trackPerformance.length > 0
      ? `DRIVER TRACK PERFORMANCE (at this circuit):
${context.trackPerformance
    .slice(0, 10)
    .map(
      (d) =>
        `- ${d.driverFirstName} ${d.driverLastName} (${d.teamName}): Rating ${d.overallRating}/10, Quali ${d.qualifyingStrength}/10, Race pace ${d.racePaceStrength}/10, Best finish P${d.bestFinish || 'N/A'}, Avg P${d.averageFinish || 'N/A'}${d.strengthDescription ? ` | Strength: ${d.strengthDescription}` : ''}`
    )
    .join('\n')}`
      : '';

  // Format historical circuit results
  const historicalText =
    context.historicalCircuitResults && context.historicalCircuitResults.length > 0
      ? `PREVIOUS WINNERS AT THIS CIRCUIT:
${context.historicalCircuitResults
    .filter((r) => r.position === 1)
    .slice(0, 3)
    .map(
      (r) =>
        `- ${r.raceYear ? new Date(r.raceYear).getFullYear() : 'Unknown'}: ${r.driverFirstName} ${r.driverLastName} (${r.teamName})`
    )
    .join('\n')}`
      : '';

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a seasoned football journalist writing a match preview for the ${raceName}. Write with authority, passion, and insider knowledge. Use vivid language that captures the drama and excitement of football. Address the reader directly, build anticipation, and make bold predictions.

CURRENT CHAMPIONSHIP STANDINGS:
${standingsText || 'Standings not yet available'}

CONSTRUCTOR STANDINGS:
${constructorText || 'Standings not yet available'}

CIRCUIT INFORMATION:
${circuitText}

${weatherText}

${trackPerformanceText}

${historicalText}

Generate a comprehensive match preview in the following JSON format. Write like a reporter breaking down the fixture for passionate football fans:

{
  "executiveSummary": "A punchy 2-3 sentence hook that captures the biggest storyline heading into this race. Write it like a headline intro that makes readers want more.",
  "keyBattles": [
    {"drivers": ["Driver1", "Driver2"], "description": "Set up the rivalry or battle with drama and context", "prediction": "Make a bold call on who comes out on top and why"}
  ],
  "strategyPredictions": [
    {"strategy": "One-stop soft-medium", "likelihood": "Most likely", "teams": ["Team1"], "explanation": "Explain the strategy angle like a pit wall analyst"}
  ],
  "weatherAnalysis": {
    "expectedConditions": "Sunny/Cloudy/Rain expected",
    "rainProbability": 20,
    "temperatureRange": "25-30°C",
    "impact": "How Mother Nature could shake up the race"
  },
  "historicalContext": {
    "previousWinners": ["Recent winners at this track"],
    "trackCharacteristics": "Paint a picture of what makes this circuit special",
    "keyFacts": ["Colorful historical tidbits that hardcore fans will love"]
  },
  "podiumPrediction": {
    "p1": {"driver": "Driver Name", "team": "Team Name", "confidence": 75},
    "p2": {"driver": "Driver Name", "team": "Team Name", "confidence": 60},
    "p3": {"driver": "Driver Name", "team": "Team Name", "confidence": 55}
  },
  "darkHorsePick": {
    "driver": "Your outsider pick who could steal the show",
    "team": "Their team",
    "reason": "Why the paddock should keep an eye on them",
    "outsiderOdds": "10/1"
  },
  "narrativeContent": "Write 4-5 paragraphs as if you're a respected football journalist writing for a major outlet. Start with a strong opening that sets the scene. Build through the key storylines - title race, team dynamics, player form. Include specific insights about how the venue and conditions favor certain teams. End with what you expect to see on matchday and why fans shouldn't miss a moment. Use active voice, present tense for immediacy, and don't be afraid to make predictions. Include quotes or references to recent manager/player comments if relevant context exists."
}

Respond ONLY with valid JSON, no markdown code blocks or explanation:`,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      return null;
    }

    // Parse the JSON response
    const previewContent = JSON.parse(textContent.text.trim()) as RacePreviewContent;
    return previewContent;
  } catch (error) {
    console.error('Failed to generate race preview:', error);
    return null;
  }
}

/**
 * Save a generated preview to the database
 */
export async function saveRacePreview(raceId: string, content: RacePreviewContent) {
  const now = new Date();

  await db
    .insert(racePreviews)
    .values({
      raceId,
      executiveSummary: content.executiveSummary,
      keyBattles: content.keyBattles,
      strategyPredictions: content.strategyPredictions,
      weatherAnalysis: content.weatherAnalysis,
      historicalContext: content.historicalContext,
      podiumPrediction: content.podiumPrediction,
      darkHorsePick: content.darkHorsePick,
      narrativeContent: content.narrativeContent,
      status: 'published',
      generatedAt: now,
      publishedAt: now,
    })
    .onConflictDoUpdate({
      target: racePreviews.raceId,
      set: {
        executiveSummary: content.executiveSummary,
        keyBattles: content.keyBattles,
        strategyPredictions: content.strategyPredictions,
        weatherAnalysis: content.weatherAnalysis,
        historicalContext: content.historicalContext,
        podiumPrediction: content.podiumPrediction,
        darkHorsePick: content.darkHorsePick,
        narrativeContent: content.narrativeContent,
        version: 2, // Increment on update
        updatedAt: now,
      },
    });

  return true;
}

/**
 * Generate previews for all upcoming races that need them
 */
export async function generateUpcomingPreviews(daysAhead: number = 7) {
  const racesNeedingPreviews = await getUpcomingRacesWithoutPreviews(daysAhead);

  const results: { raceId: string; raceName: string; success: boolean }[] = [];

  for (const race of racesNeedingPreviews) {
    console.log(`Generating preview for: ${race.name}`);

    const content = await generateRacePreview(race.id, race.name, race.circuitId);

    if (content) {
      await saveRacePreview(race.id, content);
      results.push({ raceId: race.id, raceName: race.name, success: true });
    } else {
      results.push({ raceId: race.id, raceName: race.name, success: false });
    }
  }

  return results;
}

/**
 * Get race preview by race ID
 */
export async function getRacePreviewByRaceId(raceId: string) {
  const [preview] = await db
    .select({
      id: racePreviews.id,
      raceId: racePreviews.raceId,
      executiveSummary: racePreviews.executiveSummary,
      keyBattles: racePreviews.keyBattles,
      strategyPredictions: racePreviews.strategyPredictions,
      weatherAnalysis: racePreviews.weatherAnalysis,
      historicalContext: racePreviews.historicalContext,
      podiumPrediction: racePreviews.podiumPrediction,
      darkHorsePick: racePreviews.darkHorsePick,
      narrativeContent: racePreviews.narrativeContent,
      weekendPhase: racePreviews.weekendPhase,
      lastSessionProcessed: racePreviews.lastSessionProcessed,
      version: racePreviews.version,
      status: racePreviews.status,
      generatedAt: racePreviews.generatedAt,
      publishedAt: racePreviews.publishedAt,
      raceName: races.name,
      raceSlug: races.slug,
      raceDatetime: races.raceDatetime,
      circuitName: circuits.name,
      circuitCountry: circuits.country,
      circuitLocation: circuits.location,
    })
    .from(racePreviews)
    .leftJoin(races, eq(racePreviews.raceId, races.id))
    .leftJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(racePreviews.raceId, raceId))
    .limit(1);

  return preview || null;
}

/**
 * Get race preview by race slug
 */
export async function getRacePreviewBySlug(raceSlug: string) {
  const [preview] = await db
    .select({
      id: racePreviews.id,
      raceId: racePreviews.raceId,
      executiveSummary: racePreviews.executiveSummary,
      keyBattles: racePreviews.keyBattles,
      strategyPredictions: racePreviews.strategyPredictions,
      weatherAnalysis: racePreviews.weatherAnalysis,
      historicalContext: racePreviews.historicalContext,
      podiumPrediction: racePreviews.podiumPrediction,
      darkHorsePick: racePreviews.darkHorsePick,
      narrativeContent: racePreviews.narrativeContent,
      status: racePreviews.status,
      generatedAt: racePreviews.generatedAt,
      publishedAt: racePreviews.publishedAt,
      raceName: races.name,
      raceSlug: races.slug,
      raceRound: races.round,
      raceDatetime: races.raceDatetime,
      isSprintWeekend: races.isSprintWeekend,
      circuitName: circuits.name,
      circuitCountry: circuits.country,
      circuitLocation: circuits.location,
      circuitLengthMeters: circuits.lengthMeters,
      circuitTurns: circuits.turns,
      circuitDrsZones: circuits.drsZones,
    })
    .from(racePreviews)
    .leftJoin(races, eq(racePreviews.raceId, races.id))
    .leftJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.slug, raceSlug))
    .limit(1);

  return preview || null;
}

/**
 * Get all published race previews
 */
export async function getPublishedPreviews(limit: number = 10) {
  const previews = await db
    .select({
      id: racePreviews.id,
      raceId: racePreviews.raceId,
      executiveSummary: racePreviews.executiveSummary,
      podiumPrediction: racePreviews.podiumPrediction,
      publishedAt: racePreviews.publishedAt,
      raceName: races.name,
      raceSlug: races.slug,
      raceDatetime: races.raceDatetime,
      circuitName: circuits.name,
      circuitCountry: circuits.country,
    })
    .from(racePreviews)
    .leftJoin(races, eq(racePreviews.raceId, races.id))
    .leftJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(racePreviews.status, 'published'))
    .orderBy(desc(races.raceDatetime))
    .limit(limit);

  return previews;
}

/**
 * Get or generate a race preview on-demand
 * If no preview exists and the race is upcoming, generates one
 */
export async function getOrGeneratePreview(raceId: string, raceName: string, circuitId: string | null, raceDatetime: Date | null) {
  // First, try to get existing preview
  const existingPreview = await getRacePreviewByRaceId(raceId);

  if (existingPreview) {
    return { preview: existingPreview, wasGenerated: false };
  }

  // Check if race is upcoming (don't generate for past races)
  const now = new Date();
  if (raceDatetime && new Date(raceDatetime) < now) {
    return { preview: null, wasGenerated: false };
  }

  // Generate new preview
  console.log(`Generating on-demand preview for: ${raceName}`);
  const content = await generateRacePreview(raceId, raceName, circuitId);

  if (content) {
    await saveRacePreview(raceId, content);

    // Fetch the saved preview with full data
    const savedPreview = await getRacePreviewByRaceId(raceId);
    return { preview: savedPreview, wasGenerated: true };
  }

  return { preview: null, wasGenerated: false };
}

/**
 * Get the next upcoming race with a preview
 */
export async function getNextRacePreview() {
  const now = new Date();

  const [preview] = await db
    .select({
      id: racePreviews.id,
      raceId: racePreviews.raceId,
      executiveSummary: racePreviews.executiveSummary,
      podiumPrediction: racePreviews.podiumPrediction,
      publishedAt: racePreviews.publishedAt,
      raceName: races.name,
      raceSlug: races.slug,
      raceDatetime: races.raceDatetime,
      circuitName: circuits.name,
      circuitCountry: circuits.country,
    })
    .from(racePreviews)
    .leftJoin(races, eq(racePreviews.raceId, races.id))
    .leftJoin(circuits, eq(races.circuitId, circuits.id))
    .where(and(eq(racePreviews.status, 'published'), gte(races.raceDatetime, now)))
    .orderBy(asc(races.raceDatetime))
    .limit(1);

  return preview || null;
}

// =============================================
// LIVE WEEKEND UPDATE SYSTEM
// =============================================

type WeekendPhase = 'pre-weekend' | 'post-fp1' | 'post-fp2' | 'post-fp3' | 'post-sprint-quali' | 'post-sprint' | 'post-qualifying' | 'race-day';

interface SessionInfo {
  sessionType: string;
  sessionName: string;
  startDatetime: Date;
  endDatetime: Date | null;
  isCompleted: boolean;
}

/**
 * Map session type to weekend phase
 */
function getPhaseFromSession(sessionType: string): WeekendPhase {
  const typeMap: Record<string, WeekendPhase> = {
    'fp1': 'post-fp1',
    'practice1': 'post-fp1',
    'fp2': 'post-fp2',
    'practice2': 'post-fp2',
    'fp3': 'post-fp3',
    'practice3': 'post-fp3',
    'sprint_qualifying': 'post-sprint-quali',
    'sprint-qualifying': 'post-sprint-quali',
    'sprint_shootout': 'post-sprint-quali',
    'sprint': 'post-sprint',
    'qualifying': 'post-qualifying',
    'race': 'race-day',
  };
  return typeMap[sessionType.toLowerCase()] || 'pre-weekend';
}

/**
 * Get races currently in their race weekend (within 4 days before race)
 */
async function getRacesInWeekend() {
  const now = new Date();
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const oneDayAhead = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const racesInWeekend = await db
    .select({
      id: races.id,
      name: races.name,
      slug: races.slug,
      raceDatetime: races.raceDatetime,
      circuitId: races.circuitId,
      isSprintWeekend: races.isSprintWeekend,
    })
    .from(races)
    .where(
      and(
        gte(races.raceDatetime, fourDaysAgo),
        lte(races.raceDatetime, oneDayAhead)
      )
    );

  return racesInWeekend;
}

/**
 * Get completed sessions for a race that haven't been processed yet
 */
async function getUnprocessedCompletedSessions(raceId: string, lastProcessedSession: string | null) {
  const now = new Date();

  // Get all sessions for this race
  const sessions = await db
    .select()
    .from(raceSessions)
    .where(eq(raceSessions.raceId, raceId))
    .orderBy(asc(raceSessions.startDatetime));

  // Filter to completed sessions (end time has passed)
  const completedSessions: SessionInfo[] = sessions
    .filter(s => {
      const endTime = s.endDatetime || new Date(new Date(s.startDatetime).getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
      return endTime < now;
    })
    .map(s => ({
      sessionType: s.sessionType,
      sessionName: s.sessionName,
      startDatetime: s.startDatetime,
      endDatetime: s.endDatetime,
      isCompleted: true,
    }));

  // If we have a lastProcessedSession, filter out sessions before or at that point
  if (lastProcessedSession) {
    const sessionOrder = ['fp1', 'practice1', 'fp2', 'practice2', 'fp3', 'practice3', 'sprint_qualifying', 'sprint-qualifying', 'sprint_shootout', 'sprint', 'qualifying', 'race'];
    const lastIndex = sessionOrder.findIndex(s => s === lastProcessedSession.toLowerCase());

    return completedSessions.filter(s => {
      const currentIndex = sessionOrder.findIndex(so => so === s.sessionType.toLowerCase());
      return currentIndex > lastIndex;
    });
  }

  return completedSessions;
}

/**
 * Generate an updated preview based on the weekend phase
 */
async function generatePhaseAwarePreview(
  raceId: string,
  raceName: string,
  circuitId: string | null,
  phase: WeekendPhase,
  completedSessions: string[]
): Promise<RacePreviewContent | null> {
  const context = await getRaceContext(raceId, circuitId);

  // Format standings for prompt
  const standingsText = context.driverStandings
    .slice(0, 10)
    .map(
      (d) =>
        `${d.position}. ${d.driverFirstName} ${d.driverLastName} (${d.teamName}) - ${d.points} pts, ${d.wins} wins`
    )
    .join('\n');

  const constructorText = context.constructorStandings
    .slice(0, 5)
    .map((c) => `${c.position}. ${c.teamName} - ${c.points} pts`)
    .join('\n');

  const circuitText = context.circuit
    ? `Circuit: ${context.circuit.name}, ${context.circuit.country}
Length: ${context.circuit.lengthMeters ? `${(context.circuit.lengthMeters / 1000).toFixed(3)}km` : 'Unknown'}
Turns: ${context.circuit.turns || 'Unknown'}
DRS Zones: ${context.circuit.drsZones || 'Unknown'}
Circuit Type: ${context.circuit.circuitType || 'Unknown'}
Lap Record: ${context.circuit.lapRecordTime || 'Unknown'} (${context.circuit.lapRecordDriver || 'Unknown'}, ${context.circuit.lapRecordYear || 'Unknown'})`
    : 'Circuit information unavailable';

  const weatherText =
    context.weatherForecast.length > 0
      ? `Weather Forecast:
${context.weatherForecast
    .map(
      (w) =>
        `- Temp: ${w.temperatureCelsius}°C, Track: ${w.trackTemperatureCelsius}°C, Rain: ${w.rainProbabilityPercent}%, Conditions: ${w.weatherCondition}`
    )
    .join('\n')}`
      : 'Weather forecast not yet available - using typical conditions for this circuit.';

  const trackPerformanceText =
    context.trackPerformance && context.trackPerformance.length > 0
      ? `DRIVER TRACK PERFORMANCE (at this circuit):
${context.trackPerformance
    .slice(0, 10)
    .map(
      (d) =>
        `- ${d.driverFirstName} ${d.driverLastName} (${d.teamName}): Rating ${d.overallRating}/10, Quali ${d.qualifyingStrength}/10, Race pace ${d.racePaceStrength}/10, Best finish P${d.bestFinish || 'N/A'}, Avg P${d.averageFinish || 'N/A'}${d.strengthDescription ? ` | Strength: ${d.strengthDescription}` : ''}`
    )
    .join('\n')}`
      : '';

  const historicalText =
    context.historicalCircuitResults && context.historicalCircuitResults.length > 0
      ? `PREVIOUS WINNERS AT THIS CIRCUIT:
${context.historicalCircuitResults
    .filter((r) => r.position === 1)
    .slice(0, 3)
    .map(
      (r) =>
        `- ${r.raceYear ? new Date(r.raceYear).getFullYear() : 'Unknown'}: ${r.driverFirstName} ${r.driverLastName} (${r.teamName})`
    )
    .join('\n')}`
      : '';

  // Phase-specific instructions
  const phaseInstructions: Record<WeekendPhase, string> = {
    'pre-weekend': 'This is a pre-race weekend preview. Focus on expectations, historical data, and championship implications.',
    'post-fp1': 'FP1 has just completed. While it\'s early days, mention any surprising pace shown by drivers. Reference the track conditions and how teams are settling in. Be cautious with predictions but note any standout performers.',
    'post-fp2': 'FP2 is complete - this is typically the most representative session for race pace. Update your predictions based on long-run pace. Note which teams looked strong on high fuel and which struggled with tyre degradation.',
    'post-fp3': 'All practice sessions are done. Teams have finalized their setups. Give a confident qualifying prediction based on what we\'ve seen. The picture should be clearer now.',
    'post-sprint-quali': 'Sprint qualifying/shootout has set the sprint grid. Update predictions for the sprint race. Note any surprises from qualifying.',
    'post-sprint': 'The sprint race is complete. Update your predictions for the main race based on sprint performance. Note which drivers showed good race pace and tyre management.',
    'post-qualifying': 'QUALIFYING IS COMPLETE! The grid is set. Write with urgency - race day is tomorrow. Base your podium predictions heavily on grid positions while considering race pace from practice. Highlight any penalties affecting the grid.',
    'race-day': 'It\'s RACE DAY! The tension is palpable. Write with maximum excitement. Focus on the start, key battles to watch, and your final predictions.',
  };

  const phaseContext = phaseInstructions[phase] || phaseInstructions['pre-weekend'];
  const completedSessionsText = completedSessions.length > 0
    ? `COMPLETED SESSIONS THIS WEEKEND: ${completedSessions.join(', ')}`
    : '';

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a seasoned football journalist writing an UPDATED match preview for the ${raceName}.

CURRENT WEEKEND PHASE: ${phase.toUpperCase().replace(/-/g, ' ')}
${phaseContext}

${completedSessionsText}

Write with authority, passion, and insider knowledge. Your tone should match the weekend phase - more speculative early on, more confident after qualifying.

CURRENT CHAMPIONSHIP STANDINGS:
${standingsText || 'Standings not yet available'}

CONSTRUCTOR STANDINGS:
${constructorText || 'Standings not yet available'}

CIRCUIT INFORMATION:
${circuitText}

${weatherText}

${trackPerformanceText}

${historicalText}

Generate an UPDATED race preview in the following JSON format. Your predictions should reflect what we've learned during the weekend so far:

{
  "executiveSummary": "A punchy 2-3 sentence update that captures the biggest storyline RIGHT NOW. Reference what we've learned from ${completedSessions.length > 0 ? completedSessions[completedSessions.length - 1] : 'this weekend'} if relevant.",
  "keyBattles": [
    {"drivers": ["Driver1", "Driver2"], "description": "Set up the rivalry with context from the weekend so far", "prediction": "Who has the edge based on what we've seen"}
  ],
  "strategyPredictions": [
    {"strategy": "One-stop soft-medium", "likelihood": "Most likely", "teams": ["Team1"], "explanation": "Updated strategy thoughts based on tyre performance seen in practice"}
  ],
  "weatherAnalysis": {
    "expectedConditions": "Current/expected conditions",
    "rainProbability": 20,
    "temperatureRange": "25-30°C",
    "impact": "How conditions will affect the race"
  },
  "historicalContext": {
    "previousWinners": ["Recent winners at this track"],
    "trackCharacteristics": "What makes this circuit special",
    "keyFacts": ["Relevant historical facts"]
  },
  "podiumPrediction": {
    "p1": {"driver": "Driver Name", "team": "Team Name", "confidence": 75},
    "p2": {"driver": "Driver Name", "team": "Team Name", "confidence": 60},
    "p3": {"driver": "Driver Name", "team": "Team Name", "confidence": 55}
  },
  "darkHorsePick": {
    "driver": "Someone who could surprise based on weekend form",
    "team": "Their team",
    "reason": "Why they could outperform expectations",
    "outsiderOdds": "10/1"
  },
  "narrativeContent": "Write 4-5 paragraphs as if you're updating readers after ${completedSessions.length > 0 ? completedSessions[completedSessions.length - 1] : 'the latest developments'}. Reference specific things we've learned. If it's post-qualifying, discuss the grid and what it means for the race. Use present tense for immediacy. Build excitement for what's coming next."
}

Respond ONLY with valid JSON, no markdown code blocks or explanation:`,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      return null;
    }

    const previewContent = JSON.parse(textContent.text.trim()) as RacePreviewContent;
    return previewContent;
  } catch (error) {
    console.error('Failed to generate phase-aware preview:', error);
    return null;
  }
}

/**
 * Compare two podium predictions and return changes
 */
function comparePredictions(
  oldPodium: PodiumPrediction | null,
  newPodium: PodiumPrediction,
  oldDarkHorse: DarkHorsePick | null,
  newDarkHorse: DarkHorsePick
): Array<{ field: string; from: string; to: string; reason: string }> {
  const changes: Array<{ field: string; from: string; to: string; reason: string }> = [];

  if (oldPodium) {
    if (oldPodium.p1.driver !== newPodium.p1.driver) {
      changes.push({
        field: 'P1 Prediction',
        from: oldPodium.p1.driver,
        to: newPodium.p1.driver,
        reason: 'Updated based on weekend performance',
      });
    }
    if (oldPodium.p2.driver !== newPodium.p2.driver) {
      changes.push({
        field: 'P2 Prediction',
        from: oldPodium.p2.driver,
        to: newPodium.p2.driver,
        reason: 'Updated based on weekend performance',
      });
    }
    if (oldPodium.p3.driver !== newPodium.p3.driver) {
      changes.push({
        field: 'P3 Prediction',
        from: oldPodium.p3.driver,
        to: newPodium.p3.driver,
        reason: 'Updated based on weekend performance',
      });
    }
  }

  if (oldDarkHorse && oldDarkHorse.driver !== newDarkHorse.driver) {
    changes.push({
      field: 'Dark Horse',
      from: oldDarkHorse.driver,
      to: newDarkHorse.driver,
      reason: newDarkHorse.reason,
    });
  }

  return changes;
}

/**
 * Save a preview update and track changes
 */
async function savePreviewUpdate(
  previewId: string,
  raceId: string,
  content: RacePreviewContent,
  triggerSession: string,
  phase: WeekendPhase,
  oldPodium: PodiumPrediction | null,
  oldDarkHorse: DarkHorsePick | null
) {
  const now = new Date();

  // Calculate changes
  const changes = comparePredictions(
    oldPodium,
    content.podiumPrediction,
    oldDarkHorse,
    content.darkHorsePick
  );

  // Generate update summary if there are changes
  let updateSummary = '';
  if (changes.length > 0) {
    updateSummary = `After ${triggerSession}: ` + changes.map(c => `${c.field} changed from ${c.from} to ${c.to}`).join('. ');
  } else {
    updateSummary = `Preview updated after ${triggerSession}. Predictions remain unchanged.`;
  }

  // Update the main preview
  await db
    .update(racePreviews)
    .set({
      executiveSummary: content.executiveSummary,
      keyBattles: content.keyBattles,
      strategyPredictions: content.strategyPredictions,
      weatherAnalysis: content.weatherAnalysis,
      historicalContext: content.historicalContext,
      podiumPrediction: content.podiumPrediction,
      darkHorsePick: content.darkHorsePick,
      narrativeContent: content.narrativeContent,
      weekendPhase: phase,
      lastSessionProcessed: triggerSession,
      version: sql`${racePreviews.version} + 1`,
      generatedAt: now,
      updatedAt: now,
    })
    .where(eq(racePreviews.id, previewId));

  // Record the update in history
  await db.insert(previewUpdates).values({
    previewId,
    raceId,
    triggerSession,
    weekendPhase: phase,
    podiumPrediction: content.podiumPrediction,
    darkHorsePick: content.darkHorsePick,
    changes: changes.length > 0 ? changes : null,
    updateSummary,
  });

  return { changes, updateSummary };
}

/**
 * Main function: Check for completed sessions and update previews
 */
export async function updatePreviewsAfterSessions() {
  const results: Array<{
    raceId: string;
    raceName: string;
    updated: boolean;
    session?: string;
    phase?: WeekendPhase;
    reason?: string;
  }> = [];

  // Get races currently in their weekend
  const racesInWeekend = await getRacesInWeekend();

  for (const race of racesInWeekend) {
    // Get existing preview
    const [existingPreview] = await db
      .select()
      .from(racePreviews)
      .where(eq(racePreviews.raceId, race.id))
      .limit(1);

    if (!existingPreview) {
      // No preview exists - generate initial one
      console.log(`No preview for ${race.name}, generating initial...`);
      const content = await generateRacePreview(race.id, race.name, race.circuitId);
      if (content) {
        await saveRacePreview(race.id, content);
        results.push({
          raceId: race.id,
          raceName: race.name,
          updated: true,
          session: 'initial',
          phase: 'pre-weekend',
        });
      } else {
        results.push({
          raceId: race.id,
          raceName: race.name,
          updated: false,
          reason: 'Failed to generate initial preview',
        });
      }
      continue;
    }

    // Check for new completed sessions
    const unprocessedSessions = await getUnprocessedCompletedSessions(
      race.id,
      existingPreview.lastSessionProcessed
    );

    if (unprocessedSessions.length === 0) {
      results.push({
        raceId: race.id,
        raceName: race.name,
        updated: false,
        reason: 'No new completed sessions',
      });
      continue;
    }

    // Get the latest completed session
    const latestSession = unprocessedSessions[unprocessedSessions.length - 1];
    const phase = getPhaseFromSession(latestSession.sessionType);
    const completedSessionNames = unprocessedSessions.map(s => s.sessionName);

    console.log(`Updating preview for ${race.name} after ${latestSession.sessionName}...`);

    // Generate updated content
    const content = await generatePhaseAwarePreview(
      race.id,
      race.name,
      race.circuitId,
      phase,
      completedSessionNames
    );

    if (content) {
      // Save update with change tracking
      const oldPodium = existingPreview.podiumPrediction as PodiumPrediction | null;
      const oldDarkHorse = existingPreview.darkHorsePick as DarkHorsePick | null;

      await savePreviewUpdate(
        existingPreview.id,
        race.id,
        content,
        latestSession.sessionName,
        phase,
        oldPodium,
        oldDarkHorse
      );

      results.push({
        raceId: race.id,
        raceName: race.name,
        updated: true,
        session: latestSession.sessionName,
        phase,
      });
    } else {
      results.push({
        raceId: race.id,
        raceName: race.name,
        updated: false,
        reason: `Failed to generate update after ${latestSession.sessionName}`,
      });
    }
  }

  return results;
}

/**
 * Get preview update history for a race
 */
export async function getPreviewUpdates(raceId: string) {
  const updates = await db
    .select()
    .from(previewUpdates)
    .where(eq(previewUpdates.raceId, raceId))
    .orderBy(desc(previewUpdates.createdAt));

  return updates;
}
