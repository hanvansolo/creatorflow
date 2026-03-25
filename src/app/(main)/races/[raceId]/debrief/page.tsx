import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bot, Flag } from 'lucide-react';
import { db, races, circuits, racePredictions, raceResults, drivers, teams } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';
import { Badge } from '@/components/ui/Badge';
import { KeyMoments } from '@/components/debrief/KeyMoments';
import { PerformanceGrades } from '@/components/debrief/PerformanceGrades';
import { PredictionComparison } from '@/components/debrief/PredictionComparison';
import { F1_TEAMS } from '@/lib/constants/teams';
import type { DriverPrediction } from '@/types/predictions';

export const dynamic = 'force-dynamic';

interface DebriefPageProps {
  params: Promise<{ raceId: string }>;
}

interface Debrief {
  keyMoments: string[];
  driverGrades: Record<string, { grade: string; reason: string }>;
  strategyNotes: string;
  summary: string;
}

export async function generateMetadata({ params }: DebriefPageProps): Promise<Metadata> {
  const { raceId } = await params;
  const [race] = await db
    .select({ name: races.name })
    .from(races)
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race) {
    return { title: 'Race Not Found' };
  }

  return {
    title: `${race.name} - AI Match Debrief | Footy Feed`,
    description: `AI-powered analysis and debrief for the ${race.name}`,
  };
}

async function getRaceDebrief(raceId: string) {
  const [race] = await db
    .select({
      id: races.id,
      name: races.name,
      round: races.round,
      raceDate: races.raceDatetime,
      circuitName: circuits.name,
      country: circuits.country,
    })
    .from(races)
    .innerJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race) return null;

  // Get prediction with debrief
  const [prediction] = await db
    .select()
    .from(racePredictions)
    .where(eq(racePredictions.raceId, raceId))
    .limit(1);

  // Get actual race results
  const results = await db
    .select({
      position: raceResults.position,
      gridPosition: raceResults.gridPosition,
      points: raceResults.points,
      status: raceResults.status,
      fastestLap: raceResults.fastestLap,
      driverCode: drivers.code,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      teamSlug: teams.slug,
      teamName: teams.name,
    })
    .from(raceResults)
    .innerJoin(drivers, eq(raceResults.driverId, drivers.id))
    .innerJoin(teams, eq(raceResults.teamId, teams.id))
    .where(eq(raceResults.raceId, raceId))
    .orderBy(asc(raceResults.position));

  return { race, prediction, results };
}

export default async function DebriefPage({ params }: DebriefPageProps) {
  const { raceId } = await params;
  const data = await getRaceDebrief(raceId);

  if (!data) {
    notFound();
  }

  const { race, prediction, results } = data;
  const debrief = prediction?.debrief as Debrief | null;
  const predictedOrder = (prediction?.predictedOrder as DriverPrediction[]) || [];

  // Build driver name/color map for grades
  const driverNames: Record<string, { name: string; teamColor: string }> = {};
  for (const r of results) {
    const code = r.driverCode || `${r.driverFirstName[0]}${r.driverLastName[0]}`;
    const teamColor = r.teamSlug ? (F1_TEAMS[r.teamSlug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666';
    driverNames[code] = {
      name: `${r.driverFirstName} ${r.driverLastName}`,
      teamColor,
    };
  }

  // Build predicted vs actual comparison
  const predictedComparison = predictedOrder.map(p => ({
    driverCode: p.driverCode,
    position: p.predictedPosition,
    teamColor: p.teamColor,
  }));

  const actualComparison = results
    .filter(r => r.position != null)
    .map(r => ({
      driverCode: r.driverCode || `${r.driverFirstName[0]}${r.driverLastName[0]}`,
      position: r.position!,
      teamColor: r.teamSlug ? (F1_TEAMS[r.teamSlug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666',
    }));

  const hasResults = results.length > 0;
  const hasDebrief = debrief != null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/calendar"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Calendar
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Round {race.round}</Badge>
            <Badge variant="success">Completed</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">{race.name}</h1>
          <p className="mt-1 text-zinc-400">
            {race.circuitName}, {race.country}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
            <Bot className="h-4 w-4" />
            AI Race Debrief
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-16">
            <Flag className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">No race results yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              The debrief will be available after the race is completed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Summary */}
            {hasDebrief && debrief.summary && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                  <Bot className="h-5 w-5 text-blue-500" />
                  Race Summary
                </h3>
                <p className="text-sm leading-relaxed text-zinc-300">{debrief.summary}</p>
              </div>
            )}

            {/* Key Moments */}
            {hasDebrief && debrief.keyMoments && (
              <KeyMoments moments={debrief.keyMoments} />
            )}

            {/* Race Results Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Flag className="h-5 w-5 text-emerald-500" />
                Race Results
              </h3>
              <div className="space-y-1">
                {results.map((r) => {
                  const code = r.driverCode || `${r.driverFirstName[0]}${r.driverLastName[0]}`;
                  const teamColor = r.teamSlug ? (F1_TEAMS[r.teamSlug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666';
                  const posGain = r.gridPosition && r.position ? r.gridPosition - r.position : 0;

                  return (
                    <div
                      key={code}
                      className="flex items-center gap-3 rounded-lg bg-zinc-800/30 px-3 py-2"
                    >
                      <span className="w-8 text-right text-sm font-bold text-zinc-400">
                        {r.position ? `P${r.position}` : r.status || 'DNF'}
                      </span>
                      <div
                        className="h-4 w-1 rounded-full"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span className="w-12 text-sm font-bold" style={{ color: teamColor }}>
                        {code}
                      </span>
                      <span className="flex-1 text-sm text-zinc-400">
                        {r.driverFirstName} {r.driverLastName}
                      </span>
                      <span className="text-xs text-zinc-500">{r.teamName}</span>
                      {posGain !== 0 && (
                        <span className={`text-xs font-medium ${posGain > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {posGain > 0 ? `+${posGain}` : posGain}
                        </span>
                      )}
                      {r.fastestLap && (
                        <span className="text-xs text-purple-400">FL</span>
                      )}
                      <span className="w-12 text-right text-xs text-zinc-400">
                        {parseFloat(r.points || '0') > 0 ? `${r.points} pts` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prediction vs Actual */}
            {predictedComparison.length > 0 && actualComparison.length > 0 && (
              <PredictionComparison
                predicted={predictedComparison}
                actual={actualComparison}
              />
            )}

            {/* Performance Grades */}
            {hasDebrief && debrief.driverGrades && (
              <PerformanceGrades
                grades={debrief.driverGrades}
                driverNames={driverNames}
              />
            )}

            {/* Strategy Notes */}
            {hasDebrief && debrief.strategyNotes && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="mb-3 text-lg font-bold text-white">Strategy Analysis</h3>
                <p className="text-sm leading-relaxed text-zinc-300">{debrief.strategyNotes}</p>
              </div>
            )}

            {/* No AI Debrief Yet */}
            {!hasDebrief && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                <Bot className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
                <p className="text-lg font-medium text-zinc-400">AI debrief not yet generated</p>
                <p className="mt-1 text-sm text-zinc-500">
                  The AI analysis will be generated shortly after the race results are processed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
