import { db, races, circuits, drivers, teams, raceResults, driverStandings, constructorStandings, weatherData, racePredictions, seasons } from '@/lib/db';
import { eq, and, desc, lt, inArray, countDistinct } from 'drizzle-orm';
import type { DriverPrediction, PredictionFactors, WeatherForecast, WeatherCondition } from '@/types/predictions';
import { getDriverTraits, PREDICTION_WEIGHTS, getSeasonAdjustedWeights, getTeamCarPotential } from '@/lib/constants/driver-traits';
import { isWetConditions } from '@/lib/api/open-meteo';
import { ensureAIAdjustmentsLoaded } from '@/lib/api/ai-adjustments';
import { ensureTestingAdjustmentsLoaded } from '@/lib/api/testing-adjustments';

/**
 * Generate race prediction for a specific race
 */
export async function generateRacePrediction(raceId: string) {
  // 0. Ensure latest AI + testing adjustments are loaded
  await ensureAIAdjustmentsLoaded();
  await ensureTestingAdjustmentsLoaded();

  // 1. Get race details with circuit
  const [race] = await db
    .select({
      id: races.id,
      name: races.name,
      circuitId: races.circuitId,
      circuitName: circuits.name,
      raceDate: races.raceDatetime,
      seasonId: races.seasonId,
    })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race) {
    throw new Error(`Race not found: ${raceId}`);
  }

  // 2. Get active drivers with their teams
  const activeDrivers = await db
    .select({
      id: drivers.id,
      code: drivers.code,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      teamId: drivers.currentTeamId,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamColor: teams.primaryColor,
    })
    .from(drivers)
    .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
    .where(eq(drivers.isActive, true));

  if (activeDrivers.length === 0) {
    throw new Error('No active drivers found');
  }

  // 3. Get current driver standings
  const standings = await db
    .select({
      driverId: driverStandings.driverId,
      position: driverStandings.position,
      points: driverStandings.points,
    })
    .from(driverStandings)
    .where(eq(driverStandings.seasonId, race.seasonId!))
    .orderBy(driverStandings.position);

  // 3b. Get constructor standings
  const teamStandings = await db
    .select({
      teamId: constructorStandings.teamId,
      position: constructorStandings.position,
      points: constructorStandings.points,
    })
    .from(constructorStandings)
    .where(eq(constructorStandings.seasonId, race.seasonId!))
    .orderBy(constructorStandings.position);

  // 4. Get historical results at this circuit
  const historicalResults = await getCircuitHistory(race.circuitId!);

  // 5. Get weather forecast for race
  const weather = await getRaceWeather(raceId);

  // 5b. Count completed races this season to adjust prediction weights
  const [{ completedRaces }] = await db
    .select({ completedRaces: countDistinct(raceResults.raceId) })
    .from(raceResults)
    .innerJoin(races, eq(raceResults.raceId, races.id))
    .where(and(
      eq(races.seasonId, race.seasonId!),
      lt(races.raceDatetime, new Date())
    ));
  const seasonWeights = getSeasonAdjustedWeights(Number(completedRaces) || 0);
  console.log(`Season weights (${completedRaces} races completed):`, seasonWeights);

  // 6. Calculate predictions for each driver
  const predictions: DriverPrediction[] = [];

  for (const driver of activeDrivers) {
    if (!driver.teamId) continue;

    const factors = calculatePredictionFactors(
      driver,
      standings,
      teamStandings,
      historicalResults,
      weather,
      driver.teamSlug || ''
    );

    const score = calculateWeightedScore(factors, seasonWeights);
    const confidence = calculateConfidence(factors, historicalResults, driver.id);

    predictions.push({
      driverId: driver.id,
      driverCode: driver.code || '',
      driverName: `${driver.firstName} ${driver.lastName}`,
      teamId: driver.teamId,
      teamName: driver.teamName || 'Unknown',
      teamColor: driver.teamColor || '#666666',
      predictedPosition: 0, // Set after sorting
      confidenceScore: confidence,
      factors,
    });
  }

  // 7. Sort by score and assign positions
  predictions
    .sort((a, b) => calculateWeightedScore(b.factors, seasonWeights) - calculateWeightedScore(a.factors, seasonWeights))
    .forEach((pred, index) => {
      pred.predictedPosition = index + 1;
    });

  // 8. Store prediction in database
  const [savedPrediction] = await db
    .insert(racePredictions)
    .values({
      raceId,
      predictedOrder: predictions,
      weatherConditions: weather,
    })
    .returning();

  return {
    id: savedPrediction.id,
    raceId,
    raceName: race.name,
    circuitName: race.circuitName,
    raceDate: race.raceDate,
    predictedOrder: predictions,
    weatherConditions: weather,
    createdAt: savedPrediction.createdAt,
  };
}

/**
 * Get historical results for a circuit
 */
async function getCircuitHistory(circuitId: string) {
  // Get all races at this circuit
  const circuitRaces = await db
    .select({ id: races.id })
    .from(races)
    .where(eq(races.circuitId, circuitId))
    .orderBy(desc(races.raceDatetime))
    .limit(10); // Last 10 races at circuit

  if (circuitRaces.length === 0) {
    return [];
  }

  const raceIds = circuitRaces.map(r => r.id);

  // Get results for these races
  return db
    .select({
      raceId: raceResults.raceId,
      driverId: raceResults.driverId,
      teamId: raceResults.teamId,
      position: raceResults.position,
      gridPosition: raceResults.gridPosition,
      points: raceResults.points,
    })
    .from(raceResults)
    .where(inArray(raceResults.raceId, raceIds));
}

/**
 * Get weather forecast for race session
 */
async function getRaceWeather(raceId: string): Promise<WeatherForecast | null> {
  const [weather] = await db
    .select({
      temperatureCelsius: weatherData.temperatureCelsius,
      trackTemperatureCelsius: weatherData.trackTemperatureCelsius,
      humidityPercent: weatherData.humidityPercent,
      windSpeedKph: weatherData.windSpeedKph,
      rainfallMm: weatherData.rainfallMm,
      weatherCondition: weatherData.weatherCondition,
      rainProbabilityPercent: weatherData.rainProbabilityPercent,
      isForecast: weatherData.isForecast,
      recordedAt: weatherData.recordedAt,
    })
    .from(weatherData)
    .where(eq(weatherData.raceId, raceId))
    .orderBy(desc(weatherData.recordedAt))
    .limit(1);

  if (!weather) return null;

  return {
    temperatureCelsius: parseFloat(String(weather.temperatureCelsius)) || 20,
    trackTemperatureCelsius: parseFloat(String(weather.trackTemperatureCelsius)) || 30,
    humidityPercent: weather.humidityPercent || 50,
    windSpeedKph: parseFloat(String(weather.windSpeedKph)) || 10,
    rainfallMm: parseFloat(String(weather.rainfallMm)) || 0,
    weatherCondition: (weather.weatherCondition as WeatherCondition) || 'partly_cloudy',
    rainProbabilityPercent: weather.rainProbabilityPercent || 0,
    isForecast: weather.isForecast || false,
    recordedAt: weather.recordedAt,
  };
}

/**
 * Calculate prediction factors for a driver
 */
function calculatePredictionFactors(
  driver: {
    id: string;
    code: string | null;
    teamId: string | null;
  },
  standings: Array<{
    driverId: string | null;
    position: number;
    points: string;
  }>,
  teamStandings: Array<{
    teamId: string | null;
    position: number;
    points: string;
  }>,
  historicalResults: Array<{
    driverId: string | null;
    teamId: string | null;
    position: number | null;
    gridPosition: number | null;
    points: string | null;
  }>,
  weather: WeatherForecast | null,
  teamSlug: string
): PredictionFactors {
  // 1. Championship Form (from current standings)
  const driverStanding = standings.find(s => s.driverId === driver.id);
  const standingsPosition = driverStanding?.position || 20;
  const totalDrivers = Math.max(standings.length, 20);
  const championshipForm = normalizePositionScore(standingsPosition, totalDrivers);

  // 2. Circuit History (weighted average of past results at this circuit)
  const driverHistory = historicalResults.filter(r => r.driverId === driver.id);
  const circuitHistory = calculateCircuitHistoryScore(driverHistory);

  // 3. Team Performance (based on constructor standings + recent results)
  const teamPerformance = calculateTeamScore(driver.teamId, teamStandings, historicalResults);

  // 4. Weather Adjustment
  const weatherAdjustment = calculateWeatherAdjustment(driver.code || '', weather);

  // 5. Qualifying Estimate (based on recent grid positions)
  const qualifyingEstimate = estimateQualifyingScore(driver.id, historicalResults);

  // 6. Car Potential (2026 regulation adaptation)
  const carPotentialRating = getTeamCarPotential(teamSlug);
  const carPotential = carPotentialRating / 10; // Convert 1-10 to 0-1

  return {
    championshipForm,
    circuitHistory,
    teamPerformance,
    weatherAdjustment,
    qualifyingEstimate,
    carPotential,
  };
}

/**
 * Convert position to 0-1 score (1st = 1.0, last = 0.0)
 */
function normalizePositionScore(position: number, total: number): number {
  return Math.max(0, 1 - (position - 1) / (total - 1));
}

/**
 * Calculate circuit history score from past results
 */
function calculateCircuitHistoryScore(
  results: Array<{ position: number | null }>
): number {
  if (results.length === 0) return 0.5; // Neutral for no history

  // Weight recent results more heavily
  const weights = [0.35, 0.25, 0.20, 0.12, 0.08];
  let totalWeight = 0;
  let weightedSum = 0;

  results.slice(0, 5).forEach((result, index) => {
    if (result.position === null) return;

    const positionScore = normalizePositionScore(result.position, 20);
    const weight = weights[index] || 0.05;
    weightedSum += positionScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Calculate team performance score
 */
function calculateTeamScore(
  teamId: string | null,
  teamStandings: Array<{ teamId: string | null; position: number; points: string }>,
  historicalResults: Array<{ teamId: string | null; position: number | null }>
): number {
  if (!teamId) return 0.5;

  // Get constructor standing position
  const teamStanding = teamStandings.find(t => t.teamId === teamId);
  const standingsPosition = teamStanding?.position || 11; // Default to last if not found
  const totalTeams = Math.max(teamStandings.length, 11); // 11 teams in 2026

  // Calculate standings score (P1 = 1.0, P11 = 0.0)
  const standingsScore = normalizePositionScore(standingsPosition, totalTeams);

  // Get recent team results from circuit history
  const recentTeamResults = historicalResults
    .filter(r => r.teamId === teamId && r.position !== null)
    .slice(0, 6) // Last 6 results (2 drivers * 3 races)
    .map(r => r.position!);

  // Calculate recent results score
  let recentScore = 0.5; // Neutral if no history
  if (recentTeamResults.length > 0) {
    const avgRecent = recentTeamResults.reduce((a, b) => a + b, 0) / recentTeamResults.length;
    recentScore = normalizePositionScore(avgRecent, 20);
  }

  // Weight: 60% standings, 40% recent results
  return standingsScore * 0.6 + recentScore * 0.4;
}

/**
 * Calculate weather adjustment based on driver traits
 */
function calculateWeatherAdjustment(
  driverCode: string,
  weather: WeatherForecast | null
): number {
  if (!weather) return 0.5; // Neutral if no weather data

  const isWet = isWetConditions(weather.rainProbabilityPercent, weather.weatherCondition);

  if (!isWet) return 0.5; // Neutral in dry conditions

  const traits = getDriverTraits(driverCode);

  // Convert 1-10 rating to 0-1 scale with bonus/penalty
  // Rating 10 = 0.7 (bonus), Rating 1 = 0.3 (penalty), Rating 5.5 = 0.5 (neutral)
  return 0.5 + (traits.wetWeatherRating - 5.5) / 22.5;
}

/**
 * Estimate qualifying score from recent grid positions
 */
function estimateQualifyingScore(
  driverId: string,
  historicalResults: Array<{ driverId: string | null; gridPosition: number | null }>
): number {
  const recentQuali = historicalResults
    .filter(r => r.driverId === driverId && r.gridPosition !== null)
    .slice(0, 5)
    .map(r => r.gridPosition!);

  if (recentQuali.length === 0) return 0.5; // Neutral

  const avgGrid = recentQuali.reduce((a, b) => a + b, 0) / recentQuali.length;
  return normalizePositionScore(avgGrid, 20);
}

/**
 * Calculate weighted prediction score
 */
function calculateWeightedScore(factors: PredictionFactors, weights: Record<keyof typeof PREDICTION_WEIGHTS, number> = PREDICTION_WEIGHTS): number {
  return (
    factors.championshipForm * weights.championshipForm +
    factors.circuitHistory * weights.circuitHistory +
    factors.teamPerformance * weights.teamPerformance +
    factors.weatherAdjustment * weights.weatherAdjustment +
    factors.qualifyingEstimate * weights.qualifyingEstimate +
    factors.carPotential * weights.carPotential
  );
}

/**
 * Calculate confidence score for prediction
 */
function calculateConfidence(
  factors: PredictionFactors,
  historicalResults: Array<{ driverId: string | null }>,
  driverId: string
): number {
  // Base confidence
  let confidence = 50;

  // More historical data = higher confidence
  const driverHistory = historicalResults.filter(r => r.driverId === driverId);
  confidence += Math.min(driverHistory.length * 3, 20);

  // Consistency in factors increases confidence
  const factorValues = Object.values(factors);
  const variance = calculateVariance(factorValues);
  confidence += Math.max(0, 20 - variance * 100);

  // High performers have higher confidence
  const avgFactor = factorValues.reduce((a, b) => a + b, 0) / factorValues.length;
  if (avgFactor > 0.7) confidence += 10;
  if (avgFactor < 0.3) confidence += 10; // Also confident about backmarkers

  return Math.min(Math.max(confidence, 20), 95);
}

/**
 * Calculate variance of values
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Get existing prediction for a race
 */
export async function getPredictionForRace(raceId: string) {
  const [prediction] = await db
    .select()
    .from(racePredictions)
    .where(eq(racePredictions.raceId, raceId))
    .orderBy(desc(racePredictions.createdAt))
    .limit(1);

  if (!prediction) return null;

  // Get race details
  const [race] = await db
    .select({
      name: races.name,
      circuitName: circuits.name,
      raceDate: races.raceDatetime,
    })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.id, raceId))
    .limit(1);

  return {
    id: prediction.id,
    raceId,
    raceName: race?.name || 'Unknown Race',
    circuitName: race?.circuitName || 'Unknown Circuit',
    raceDate: race?.raceDate || new Date(),
    predictedOrder: prediction.predictedOrder as DriverPrediction[],
    weatherConditions: prediction.weatherConditions as WeatherForecast | null,
    createdAt: prediction.createdAt,
    accuracy: prediction.accuracy as any,
  };
}
