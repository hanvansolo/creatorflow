import { Metadata } from 'next';
import { CommentSection } from '@/components/comments/CommentSection';
import { db, races, circuits, weatherData, racePredictions } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { PredictionsList } from '@/components/predictions/PredictionsList';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Clock, ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';
import type { DriverPrediction, WeatherForecast, WeatherCondition } from '@/types/predictions';
import { generateBaseMetadata, generateAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ raceId: string }> }): Promise<Metadata> {
  const { raceId } = await params;
  const [race] = await db
    .select({ name: races.name, circuitName: circuits.name, country: circuits.country })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race) {
    return { title: 'Prediction Not Found' };
  }

  return {
    ...generateBaseMetadata({
      title: `${race.name} Predictions`,
      description: `AI-powered race predictions for the ${race.name} at ${race.circuitName}, ${race.country}. Podium predictions, weather impact, and race analysis.`,
      tags: ['match prediction', race.name, race.circuitName || '', 'football forecast'],
    }),
    alternates: generateAlternates(`/predictions/${raceId}`),
  };
}

interface Props {
  params: Promise<{ raceId: string }>;
}

async function getRaceData(raceId: string) {
  const [race] = await db
    .select({
      id: races.id,
      name: races.name,
      round: races.round,
      raceDate: races.raceDatetime,
      circuitId: circuits.id,
      circuitName: circuits.name,
      country: circuits.country,
      location: circuits.location,
    })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.id, raceId))
    .limit(1);

  return race;
}

async function getPrediction(raceId: string) {
  const [prediction] = await db
    .select()
    .from(racePredictions)
    .where(eq(racePredictions.raceId, raceId))
    .orderBy(desc(racePredictions.createdAt))
    .limit(1);

  return prediction;
}

async function getWeather(raceId: string) {
  const weather = await db
    .select({
      id: weatherData.id,
      temperatureCelsius: weatherData.temperatureCelsius,
      trackTemperatureCelsius: weatherData.trackTemperatureCelsius,
      humidityPercent: weatherData.humidityPercent,
      windSpeedKph: weatherData.windSpeedKph,
      rainProbabilityPercent: weatherData.rainProbabilityPercent,
      weatherCondition: weatherData.weatherCondition,
      isForecast: weatherData.isForecast,
      recordedAt: weatherData.recordedAt,
    })
    .from(weatherData)
    .where(eq(weatherData.raceId, raceId))
    .orderBy(desc(weatherData.recordedAt))
    .limit(1);

  return weather[0] || null;
}

export default async function RacePredictionPage({ params }: Props) {
  const { raceId } = await params;

  const [race, prediction, weather] = await Promise.all([
    getRaceData(raceId),
    getPrediction(raceId),
    getWeather(raceId),
  ]);

  if (!race) {
    notFound();
  }

  const predictedOrder = (prediction?.predictedOrder as DriverPrediction[]) || [];
  const isPastRace = new Date(race.raceDate) < new Date();

  // Convert weather data to expected format
  const weatherForecast: WeatherForecast | null = weather
    ? {
        temperatureCelsius: parseFloat(String(weather.temperatureCelsius)) || 20,
        trackTemperatureCelsius: parseFloat(String(weather.trackTemperatureCelsius)) || 30,
        humidityPercent: weather.humidityPercent || 50,
        windSpeedKph: parseFloat(String(weather.windSpeedKph)) || 10,
        rainfallMm: 0,
        weatherCondition: (weather.weatherCondition as WeatherCondition) || 'partly_cloudy',
        rainProbabilityPercent: weather.rainProbabilityPercent || 0,
        isForecast: weather.isForecast || false,
        recordedAt: weather.recordedAt,
      }
    : null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back link */}
      <Link
        href="/predictions"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Predictions
      </Link>

      {/* Race header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline">Round {race.round}</Badge>
          {isPastRace && (
            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              Completed
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">{race.name}</h1>
        <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {race.circuitName}, {race.country}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(race.raceDate), 'EEEE, MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(new Date(race.raceDate), 'h:mm a')}
          </span>
        </div>
        {isPastRace && (
          <Link
            href={`/races/${raceId}/debrief`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Bot className="h-4 w-4" />
            View AI Race Debrief
          </Link>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Weather Section */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Race Weather</h2>
          {weatherForecast ? (
            <WeatherWidget weather={weatherForecast} sessionName="Race" />
          ) : (
            <Card className="p-4">
              <p className="text-gray-500 text-sm">
                Weather forecast not yet available.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Forecasts are generated 14 days before the race.
              </p>
            </Card>
          )}

          {/* Prediction info */}
          {prediction && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Prediction Info</h3>
              <p className="text-sm text-gray-500">
                Generated:{' '}
                {format(new Date(prediction.createdAt!), 'MMM d, yyyy h:mm a')}
              </p>
            </Card>
          )}
        </div>

        {/* Predictions Section */}
        <div className="lg:col-span-2">
          {predictedOrder.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Predicted Results</h2>
              </div>

              <Tabs defaultValue="predictions">
                <TabsList>
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="predictions">
                  <PredictionsList
                    predictions={predictedOrder}
                    raceName={race.name}
                  />
                </TabsContent>
                <TabsContent value="analysis">
                  <PredictionsList
                    predictions={predictedOrder}
                    raceName={race.name}
                    showFactors
                  />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">
                Prediction Coming Soon
              </h3>
              <p className="text-gray-500">
                Our prediction model is generating results for this race.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Predictions are typically available 7 days before the race.
              </p>
            </Card>
          )}
        </div>

        {/* Comments */}
        <CommentSection contentType="prediction" contentId={raceId} />
      </div>
    </div>
  );
}
