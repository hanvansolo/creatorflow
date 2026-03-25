import { NextRequest, NextResponse } from 'next/server';
import { db, races, circuits, raceSessions, weatherData } from '@/lib/db';
import { eq, gte, lte, and } from 'drizzle-orm';
import {
  fetchWeatherForecast,
  findClosestHourlyData,
  mapWeatherCode,
} from '@/lib/api/open-meteo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    // Validate secret token
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting weather update...');
    const startTime = Date.now();

    // Get races in the next 14 days
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const upcomingRaces = await db
      .select({
        raceId: races.id,
        raceName: races.name,
        raceDate: races.raceDatetime,
        circuitId: circuits.id,
        circuitName: circuits.name,
        latitude: circuits.latitude,
        longitude: circuits.longitude,
      })
      .from(races)
      .innerJoin(circuits, eq(races.circuitId, circuits.id))
      .where(
        and(
          gte(races.raceDatetime, now),
          lte(races.raceDatetime, twoWeeksLater)
        )
      );

    console.log(`Found ${upcomingRaces.length} upcoming races`);

    let weatherUpdated = 0;
    let errors = 0;

    for (const race of upcomingRaces) {
      if (!race.latitude || !race.longitude) {
        console.log(`  Skipping ${race.raceName} - no coordinates`);
        continue;
      }

      try {
        // Get race sessions
        const sessions = await db
          .select({
            id: raceSessions.id,
            type: raceSessions.sessionType,
            name: raceSessions.sessionName,
            startTime: raceSessions.startDatetime,
          })
          .from(raceSessions)
          .where(eq(raceSessions.raceId, race.raceId));

        // Calculate date range for weather fetch
        // If no sessions, use race date +/- 1 day
        let startDate: Date;
        let endDate: Date;

        if (sessions.length > 0) {
          const sessionTimes = sessions
            .map(s => new Date(s.startTime))
            .sort((a, b) => a.getTime() - b.getTime());

          startDate = new Date(sessionTimes[0]);
          startDate.setDate(startDate.getDate() - 1);

          endDate = new Date(sessionTimes[sessionTimes.length - 1]);
          endDate.setDate(endDate.getDate() + 1);
        } else {
          // No sessions, use race date +/- 2 days
          startDate = new Date(race.raceDate);
          startDate.setDate(startDate.getDate() - 2);

          endDate = new Date(race.raceDate);
          endDate.setDate(endDate.getDate() + 1);
        }

        // Fetch forecast from Open-Meteo
        const forecast = await fetchWeatherForecast(
          parseFloat(String(race.latitude)),
          parseFloat(String(race.longitude)),
          startDate,
          endDate
        );

        // Store weather for each session (or race itself if no sessions)
        const timesToStore = sessions.length > 0
          ? sessions.map(s => ({ time: new Date(s.startTime), name: s.name }))
          : [{ time: new Date(race.raceDate), name: 'Race' }];

        for (const { time, name } of timesToStore) {
          const hourlyData = findClosestHourlyData(forecast, time);

          if (!hourlyData) {
            console.log(`    No forecast data for ${name}`);
            continue;
          }

          const weatherCondition = mapWeatherCode(hourlyData.weatherCode);

          // Upsert weather data
          // First check if exists
          const [existing] = await db
            .select({ id: weatherData.id })
            .from(weatherData)
            .where(
              and(
                eq(weatherData.raceId, race.raceId),
                eq(weatherData.recordedAt, time)
              )
            )
            .limit(1);

          if (existing) {
            // Update existing
            await db
              .update(weatherData)
              .set({
                temperatureCelsius: String(hourlyData.temperature),
                trackTemperatureCelsius: String(hourlyData.trackTemperature),
                humidityPercent: hourlyData.humidity,
                windSpeedKph: String(hourlyData.windSpeed),
                rainfallMm: String(hourlyData.rainfall),
                weatherCondition,
                rainProbabilityPercent: hourlyData.rainProbability,
                isForecast: true,
              })
              .where(eq(weatherData.id, existing.id));
          } else {
            // Insert new
            await db.insert(weatherData).values({
              circuitId: race.circuitId,
              raceId: race.raceId,
              recordedAt: time,
              temperatureCelsius: String(hourlyData.temperature),
              trackTemperatureCelsius: String(hourlyData.trackTemperature),
              humidityPercent: hourlyData.humidity,
              windSpeedKph: String(hourlyData.windSpeed),
              rainfallMm: String(hourlyData.rainfall),
              weatherCondition,
              rainProbabilityPercent: hourlyData.rainProbability,
              isForecast: true,
            });
          }

          weatherUpdated++;
        }

        console.log(`  ${race.raceName}: Updated ${timesToStore.length} forecasts`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`  Error for ${race.raceName}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      racesProcessed: upcomingRaces.length,
      weatherUpdated,
      errors,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Weather update failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
