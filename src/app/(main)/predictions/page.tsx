import { db, races, circuits, racePredictions } from '@/lib/db';
import { eq, gte, asc, desc, lt, and, isNotNull } from 'drizzle-orm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AccuracyOverview } from '@/components/predictions/AccuracyOverview';
import { PredictionAccuracyCard } from '@/components/predictions/PredictionAccuracyCard';
import Link from 'next/link';
import { format } from 'date-fns';
import { TrendingUp, Calendar, MapPin, Target } from 'lucide-react';
import type { PredictionAccuracy } from '@/types/predictions';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata(
  'Football Match Predictions 2026 - AI-Powered Score Forecasts',
  'AI-powered football match predictions for the 2026 season. Score forecasts based on team form, head-to-head records, squad strength, and match conditions.',
  '/predictions',
  ['football predictions', 'match predictions', 'football forecast', 'score prediction', 'football 2026 predictions', 'AI match forecast']
);

export const dynamic = 'force-dynamic';

async function getUpcomingRaces() {
  const now = new Date();

  const upcomingRaces = await db
    .select({
      id: races.id,
      name: races.name,
      slug: races.slug,
      raceDate: races.raceDatetime,
      round: races.round,
      circuitName: circuits.name,
      country: circuits.country,
    })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(gte(races.raceDatetime, now))
    .orderBy(asc(races.raceDatetime))
    .limit(5);

  // Get predictions for these races
  const predictions = await db
    .select({
      raceId: racePredictions.raceId,
      createdAt: racePredictions.createdAt,
    })
    .from(racePredictions)
    .orderBy(desc(racePredictions.createdAt));

  // Map predictions to races
  const predictionMap = new Map<string, Date>();
  for (const p of predictions) {
    if (p.raceId && !predictionMap.has(p.raceId)) {
      predictionMap.set(p.raceId, p.createdAt!);
    }
  }

  return upcomingRaces.map(race => ({
    ...race,
    hasPrediction: predictionMap.has(race.id),
    predictionDate: predictionMap.get(race.id),
  }));
}

async function getPastPredictions() {
  const now = new Date();

  const pastRaces = await db
    .select({
      raceId: races.id,
      raceName: races.name,
      raceDate: races.raceDatetime,
      round: races.round,
      circuitName: circuits.name,
      country: circuits.country,
      accuracy: racePredictions.accuracy,
    })
    .from(racePredictions)
    .innerJoin(races, eq(racePredictions.raceId, races.id))
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(and(
      lt(races.raceDatetime, now),
      isNotNull(racePredictions.accuracy)
    ))
    .orderBy(desc(races.round));

  return pastRaces.map(r => ({
    raceId: r.raceId!,
    raceName: r.raceName,
    raceDate: r.raceDate,
    round: r.round,
    circuitName: r.circuitName,
    country: r.country,
    accuracy: r.accuracy as PredictionAccuracy,
  }));
}

function computeAccuracyStats(pastPredictions: { accuracy: PredictionAccuracy }[]) {
  if (pastPredictions.length === 0) {
    return { totalRaces: 0, avgPositionError: 0, avgPodiumAccuracy: 0, avgTopTenAccuracy: 0, avgPositionAccuracy: 0 };
  }

  const totals = pastPredictions.reduce(
    (acc, p) => ({
      positionAccuracy: acc.positionAccuracy + (p.accuracy.positionAccuracy || 0),
      podiumAccuracy: acc.podiumAccuracy + (p.accuracy.podiumAccuracy || 0),
      topTenAccuracy: acc.topTenAccuracy + (p.accuracy.topTenAccuracy || 0),
      positionError: acc.positionError + (p.accuracy.averagePositionError || 0),
    }),
    { positionAccuracy: 0, podiumAccuracy: 0, topTenAccuracy: 0, positionError: 0 }
  );

  const n = pastPredictions.length;
  return {
    totalRaces: n,
    avgPositionError: totals.positionError / n,
    avgPodiumAccuracy: totals.podiumAccuracy / n,
    avgTopTenAccuracy: totals.topTenAccuracy / n,
    avgPositionAccuracy: totals.positionAccuracy / n,
  };
}

export default async function PredictionsPage() {
  const [upcomingRaces, pastPredictions] = await Promise.all([
    getUpcomingRaces(),
    getPastPredictions(),
  ]);

  const accuracyStats = computeAccuracyStats(pastPredictions);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          Race Predictions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Our predictions are generated using driver championship form, historical
          circuit performance, team trends, and weather conditions. Predictions are
          updated daily as new data becomes available.
        </p>
      </div>

      {/* How it works */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
        <h2 className="font-semibold mb-3">How Our Predictions Work</h2>
        <div className="grid gap-4 md:grid-cols-4 text-sm">
          <div>
            <span className="font-medium">30%</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              Championship Form
            </span>
          </div>
          <div>
            <span className="font-medium">25%</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              Circuit History
            </span>
          </div>
          <div>
            <span className="font-medium">20%</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              Team Performance
            </span>
          </div>
          <div>
            <span className="font-medium">15% + 10%</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              Weather & Qualifying
            </span>
          </div>
        </div>
      </Card>

      {/* Prediction Accuracy Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-500" />
          Prediction Accuracy
        </h2>
        <AccuracyOverview stats={accuracyStats} />
      </div>

      {/* Upcoming Races */}
      <h2 className="text-xl font-semibold mb-4">Upcoming Races</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {upcomingRaces.map((race) => (
          <Link key={race.id} href={`/predictions/${race.id}`}>
            <Card className="p-5 h-full hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline">Round {race.round}</Badge>
                {race.hasPrediction ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Prediction Ready
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Generating...
                  </Badge>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">{race.name}</h3>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {race.circuitName}, {race.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(race.raceDate), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
              </div>

              {race.hasPrediction && race.predictionDate && (
                <p className="text-xs text-gray-400 mt-4">
                  Last updated:{' '}
                  {format(new Date(race.predictionDate), 'MMM d, h:mm a')}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {upcomingRaces.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No upcoming races scheduled.</p>
          <p className="text-sm text-gray-400 mt-2">
            Check back when the new season calendar is announced.
          </p>
        </Card>
      )}

      {/* Past Predictions with Accuracy */}
      {pastPredictions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Past Predictions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastPredictions.map((race) => (
              <PredictionAccuracyCard
                key={race.raceId}
                raceId={race.raceId}
                raceName={race.raceName}
                circuitName={race.circuitName}
                country={race.country}
                raceDate={race.raceDate}
                round={race.round}
                accuracy={race.accuracy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
