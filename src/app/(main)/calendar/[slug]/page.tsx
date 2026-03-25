import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Clock, Zap, Flag, Ruler, CornerUpRight, Trophy, Target, Swords, Cloud, TrendingUp, History, Radio, CheckCircle2, Circle, Timer, RefreshCw, ArrowUpDown, Compass, Map } from 'lucide-react';
import { db, races, circuits, raceSessions, racePreviews } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { TrackLayout } from '@/components/tracks/TrackLayout';
import { TrackLayoutViewer } from '@/components/tracks/TrackLayoutViewer';
import { TrackHistory } from '@/components/tracks/TrackHistory';
import { WeatherChart } from '@/components/weather/WeatherChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { AdSlot } from '@/components/ads/AdSlot';
import { isInPast } from '@/lib/utils';
import { getOrGeneratePreview, getPreviewUpdates } from '@/lib/api/race-previews';
import { generateRaceMetadata, generateAlternates, generateBreadcrumbStructuredData, generateRaceStructuredData, jsonLd, JsonLdScript } from '@/lib/seo';

// Cache calendar pages for 30 minutes (race data doesn't change frequently)
export const revalidate = 1800;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRaceBySlug(slug: string) {
  let [race] = await db
    .select({
      id: races.id,
      name: races.name,
      slug: races.slug,
      round: races.round,
      raceDatetime: races.raceDatetime,
      isSprintWeekend: races.isSprintWeekend,
      status: races.status,
      circuitId: races.circuitId,
      circuitName: circuits.name,
      circuitOfficialName: circuits.officialName,
      circuitSlug: circuits.slug,
      circuitCountry: circuits.country,
      circuitCountryCode: circuits.countryCode,
      circuitLocation: circuits.location,
      circuitLatitude: circuits.latitude,
      circuitLongitude: circuits.longitude,
      circuitTimezone: circuits.timezone,
      circuitLengthMeters: circuits.lengthMeters,
      circuitTurns: circuits.turns,
      circuitDrsZones: circuits.drsZones,
      circuitType: circuits.circuitType,
      circuitDirection: circuits.direction,
      circuitLayoutImageUrl: circuits.layoutImageUrl,
      lapRecordTime: circuits.lapRecordTime,
      lapRecordDriver: circuits.lapRecordDriver,
      lapRecordYear: circuits.lapRecordYear,
      firstGrandPrixYear: circuits.firstGrandPrixYear,
    })
    .from(races)
    .leftJoin(circuits, eq(races.circuitId, circuits.id))
    .where(eq(races.slug, slug))
    .limit(1);

  if (!race) {
    [race] = await db
      .select({
        id: races.id,
        name: races.name,
        slug: races.slug,
        round: races.round,
        raceDatetime: races.raceDatetime,
        isSprintWeekend: races.isSprintWeekend,
        status: races.status,
        circuitId: races.circuitId,
        circuitName: circuits.name,
        circuitOfficialName: circuits.officialName,
        circuitSlug: circuits.slug,
        circuitCountry: circuits.country,
        circuitCountryCode: circuits.countryCode,
        circuitLocation: circuits.location,
        circuitLatitude: circuits.latitude,
        circuitLongitude: circuits.longitude,
        circuitTimezone: circuits.timezone,
        circuitLengthMeters: circuits.lengthMeters,
        circuitTurns: circuits.turns,
        circuitDrsZones: circuits.drsZones,
        circuitType: circuits.circuitType,
        circuitDirection: circuits.direction,
        circuitLayoutImageUrl: circuits.layoutImageUrl,
        lapRecordTime: circuits.lapRecordTime,
        lapRecordDriver: circuits.lapRecordDriver,
        lapRecordYear: circuits.lapRecordYear,
        firstGrandPrixYear: circuits.firstGrandPrixYear,
      })
      .from(races)
      .leftJoin(circuits, eq(races.circuitId, circuits.id))
      .where(eq(races.id, slug))
      .limit(1);

    if (race?.slug) {
      redirect(`/calendar/${race.slug}`);
    }
  }

  return race || null;
}

async function getRaceSessions(raceId: string) {
  return db
    .select()
    .from(raceSessions)
    .where(eq(raceSessions.raceId, raceId))
    .orderBy(asc(raceSessions.startDatetime));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);

  if (!race) {
    return { title: 'Race Not Found' };
  }

  return {
    ...generateRaceMetadata({
      title: race.name,
      description: `${race.name} at ${race.circuitOfficialName || race.circuitName}, ${race.circuitLocation || race.circuitCountry}. Round ${race.round} of the 2026 F1 season. Session times, circuit guide, weather, and race preview.`,
      raceName: race.name,
      circuitName: race.circuitName || '',
      country: race.circuitCountry || '',
      raceDate: race.raceDatetime?.toISOString() || '',
      round: race.round,
      season: 2026,
    }),
    alternates: generateAlternates(`/calendar/${slug}`),
  };
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatSessionTime(date: string | Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Determine race weekend phase based on session times
function getRaceWeekendPhase(sessions: Array<{ sessionType: string; startDatetime: Date | null }>) {
  const now = new Date();

  const completedSessions = sessions.filter(
    s => s.startDatetime && new Date(s.startDatetime) < now
  );
  const upcomingSessions = sessions.filter(
    s => s.startDatetime && new Date(s.startDatetime) >= now
  );

  if (completedSessions.length === 0) {
    return { phase: 'pre-weekend', label: 'Race Weekend Preview', icon: Timer };
  }

  const lastCompleted = completedSessions[completedSessions.length - 1];
  const nextSession = upcomingSessions[0];

  if (lastCompleted?.sessionType === 'race') {
    return { phase: 'post-race', label: 'Race Complete', icon: CheckCircle2 };
  }

  if (lastCompleted?.sessionType === 'qualifying') {
    return { phase: 'post-qualifying', label: 'Grid Set - Race Day Preview', icon: Flag };
  }

  if (lastCompleted?.sessionType?.includes('practice') || lastCompleted?.sessionType === 'fp1' || lastCompleted?.sessionType === 'fp2' || lastCompleted?.sessionType === 'fp3') {
    if (nextSession?.sessionType === 'qualifying') {
      return { phase: 'pre-qualifying', label: 'Qualifying Preview', icon: Timer };
    }
    return { phase: 'practice', label: 'Practice Analysis', icon: Radio };
  }

  return { phase: 'live', label: 'Live Updates', icon: Radio };
}

export default async function RaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);

  if (!race) {
    notFound();
  }

  const sessions = await getRaceSessions(race.id);
  const isPast = isInPast(race.raceDatetime);

  // Get or generate preview for upcoming races
  const { preview } = !isPast
    ? await getOrGeneratePreview(race.id, race.name, race.circuitId, race.raceDatetime)
    : { preview: null };

  // Parse preview data
  const keyBattles = preview?.keyBattles as Array<{
    drivers: string[];
    description: string;
    prediction: string;
  }> | null;

  const strategyPredictions = preview?.strategyPredictions as Array<{
    strategy: string;
    likelihood: string;
    teams: string[];
    explanation: string;
  }> | null;

  const weatherAnalysis = preview?.weatherAnalysis as {
    expectedConditions: string;
    rainProbability: number;
    temperatureRange: string;
    impact: string;
  } | null;

  const historicalContext = preview?.historicalContext as {
    previousWinners: string[];
    trackCharacteristics: string;
    keyFacts: string[];
  } | null;

  const podiumPrediction = preview?.podiumPrediction as {
    p1: { driver: string; team: string; confidence: number };
    p2: { driver: string; team: string; confidence: number };
    p3: { driver: string; team: string; confidence: number };
  } | null;

  const darkHorsePick = preview?.darkHorsePick as {
    driver: string;
    team: string;
    reason: string;
    outsiderOdds: string;
  } | null;

  // Get prediction updates history
  const predictionUpdates = !isPast && preview
    ? await getPreviewUpdates(race.id)
    : [];

  // Parse prediction changes from updates
  type PredictionChange = { field: string; from: string; to: string; reason: string };
  const recentChanges = predictionUpdates
    .filter(u => u.changes && Array.isArray(u.changes) && (u.changes as PredictionChange[]).length > 0)
    .slice(0, 3);

  // Get race weekend phase
  const weekendPhase = getRaceWeekendPhase(sessions);
  const PhaseIcon = weekendPhase.icon;

  // Structured data for SEO
  const breadcrumbData = jsonLd(generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Calendar', url: '/calendar' },
    { name: race.name },
  ]));

  const sportsEventData = jsonLd(generateRaceStructuredData({
    name: race.name,
    startDate: race.raceDatetime?.toISOString() || '',
    circuitName: race.circuitName || race.name,
    country: race.circuitCountry || '',
    locality: race.circuitLocation || undefined,
    description: `Round ${race.round} of the 2026 football season at ${race.circuitName || 'TBC'}.`,
  }));

  return (
    <>
    <JsonLdScript data={breadcrumbData} />
    <JsonLdScript data={sportsEventData} />
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/calendar"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Flag className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-zinc-400">ROUND {race.round}</span>
            {race.isSprintWeekend && (
              <Badge variant="warning">Sprint Weekend</Badge>
            )}
            {race.status === 'completed' && (
              <Badge variant="secondary">Completed</Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
            {race.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{race.circuitName}, {race.circuitCountry}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(race.raceDatetime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(race.raceDatetime)}</span>
            </div>
          </div>

          {/* Action buttons */}
          {isPast && (
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href={`/races/${race.id}/debrief`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
              >
                <Trophy className="h-4 w-4" />
                Race Debrief
              </Link>
              <Link
                href={`/predictions/${race.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 transition-colors"
              >
                View Prediction
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Content + Sidebar Layout for Upcoming Races */}
        {!isPast && preview && (
          <div className="grid gap-8 lg:grid-cols-3 mb-10">
            {/* Main Article Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Live Status Banner */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  weekendPhase.phase === 'live' ? 'bg-red-500/20 animate-pulse' : 'bg-zinc-700/50'
                }`}>
                  <PhaseIcon className={`h-5 w-5 ${
                    weekendPhase.phase === 'live' ? 'text-red-400' : 'text-zinc-400'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                    {weekendPhase.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Last updated: {preview.generatedAt
                      ? new Date(preview.generatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'recently'}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              {preview.executiveSummary && (
                <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-orange-500/10 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400 uppercase tracking-wide">
                      The Story So Far
                    </span>
                  </div>
                  <p className="text-xl text-white leading-relaxed font-medium">
                    {preview.executiveSummary}
                  </p>
                </div>
              )}

              {/* Full Narrative Article */}
              {preview.narrativeContent && (
                <article className="prose prose-invert prose-zinc max-w-none">
                  <div className="space-y-4">
                    {preview.narrativeContent.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-zinc-300 leading-relaxed text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              )}

              {/* Key Battles Section */}
              {keyBattles && keyBattles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Swords className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold text-white">Battles to Watch</h2>
                  </div>
                  <div className="space-y-4">
                    {keyBattles.map((battle, index) => (
                      <div key={index} className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-emerald-400">{battle.drivers.join(' vs ')}</span>
                        </div>
                        <p className="text-zinc-300 mb-2">{battle.description}</p>
                        <p className="text-sm text-zinc-400 italic">&ldquo;{battle.prediction}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategy Section */}
              {strategyPredictions && strategyPredictions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Flag className="h-5 w-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-white">Strategy Outlook</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {strategyPredictions.map((strategy, index) => (
                      <div key={index} className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">{strategy.strategy}</span>
                          <Badge variant={strategy.likelihood === 'Most likely' ? 'success' : 'secondary'}>
                            {strategy.likelihood}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">Teams: {strategy.teams.join(', ')}</p>
                        <p className="text-sm text-zinc-300">{strategy.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Context */}
              {historicalContext && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-white">Circuit History</h2>
                  </div>
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-5">
                    {historicalContext.trackCharacteristics && (
                      <p className="text-zinc-300 mb-4">{historicalContext.trackCharacteristics}</p>
                    )}
                    {historicalContext.keyFacts && historicalContext.keyFacts.length > 0 && (
                      <ul className="space-y-2">
                        {historicalContext.keyFacts.map((fact, index) => (
                          <li key={index} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-amber-400 mt-1">•</span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Predictions & Info (1/3 width) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Podium Prediction - Sticky */}
              <div className="lg:sticky lg:top-6 space-y-6">
                {/* Podium Prediction Card */}
                {podiumPrediction && (
                  <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-zinc-900 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-yellow-400" />
                      <h3 className="font-bold text-white">Podium Prediction</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { pos: '1', data: podiumPrediction.p1, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                        { pos: '2', data: podiumPrediction.p2, color: 'text-zinc-300', bg: 'bg-zinc-500/20' },
                        { pos: '3', data: podiumPrediction.p3, color: 'text-orange-400', bg: 'bg-orange-500/20' },
                      ].map(({ pos, data, color, bg }) => (
                        <div key={pos} className={`flex items-center gap-3 p-3 rounded-lg ${bg}`}>
                          <span className={`text-2xl font-bold ${color}`}>P{pos}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{data.driver}</p>
                            <p className="text-xs text-zinc-400">{data.team}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono text-zinc-400">{data.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dark Horse Pick */}
                {darkHorsePick && (
                  <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                        <h3 className="font-bold text-white">Dark Horse</h3>
                      </div>
                      <span className="text-sm font-mono text-purple-400">{darkHorsePick.outsiderOdds}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{darkHorsePick.driver}</p>
                    <p className="text-sm text-zinc-400 mb-2">{darkHorsePick.team}</p>
                    <p className="text-sm text-zinc-300">{darkHorsePick.reason}</p>
                  </div>
                )}

                {/* Weather Card */}
                {weatherAnalysis && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Cloud className="h-5 w-5 text-blue-400" />
                      <h3 className="font-bold text-white">Weather</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Conditions</span>
                        <span className="text-white">{weatherAnalysis.expectedConditions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Rain</span>
                        <span className="text-white">{weatherAnalysis.rainProbability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Temp</span>
                        <span className="text-white">{weatherAnalysis.temperatureRange}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-blue-500/20">
                      {weatherAnalysis.impact}
                    </p>
                  </div>
                )}

                {/* Prediction Updates - Live Changes */}
                {recentChanges.length > 0 && (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="h-5 w-5 text-green-400" />
                      <h3 className="font-bold text-white">Prediction Updates</h3>
                    </div>
                    <div className="space-y-3">
                      {recentChanges.map((update, idx) => {
                        const changes = update.changes as PredictionChange[];
                        return (
                          <div key={idx} className="border-l-2 border-green-500/50 pl-3">
                            <p className="text-xs font-medium text-green-400 mb-1">
                              After {update.triggerSession}
                            </p>
                            {changes.map((change, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-1 text-xs text-zinc-300">
                                <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                                <span className="text-zinc-500">{change.field}:</span>
                                <span className="line-through text-zinc-500">{change.from}</span>
                                <span>→</span>
                                <span className="text-white font-medium">{change.to}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    {preview?.version && preview.version > 1 && (
                      <p className="text-xs text-zinc-500 mt-3 pt-2 border-t border-green-500/20">
                        Version {preview.version} • Updated after {preview.lastSessionProcessed || 'practice'}
                      </p>
                    )}
                  </div>
                )}

                {/* Session Timeline */}
                <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5">
                  <h3 className="font-bold text-white mb-4">Weekend Schedule</h3>
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const sessionPast = session.startDatetime && new Date(session.startDatetime) < new Date();
                      return (
                        <div key={session.id} className="flex items-center gap-3">
                          {sessionPast ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                          )}
                          <div className={`flex-1 ${sessionPast ? 'opacity-50' : ''}`}>
                            <p className="text-sm font-medium text-white">{session.sessionName}</p>
                            <p className="text-xs text-zinc-500">
                              {session.startDatetime && new Date(session.startDatetime).toLocaleString('en-US', {
                                weekday: 'short',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historical Winners */}
                {historicalContext?.previousWinners && historicalContext.previousWinners.length > 0 && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5">
                    <h3 className="font-bold text-white mb-3">Recent Winners</h3>
                    <div className="space-y-2">
                      {historicalContext.previousWinners.slice(0, 3).map((winner, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-zinc-300">{winner}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ad placement between preview and circuit sections */}
        <div className="mt-6">
          <AdSlot format="auto" />
        </div>

        {/* Circuit Section - Full tracks-page-style layout */}
        <div className="mt-8">
          {/* Circuit header */}
          <div className="flex items-center gap-3 mb-6">
            <CountryFlag nationality={race.circuitCountry} size="lg" />
            <div>
              <h2 className="text-2xl font-bold text-white">{race.circuitName}</h2>
              {race.circuitOfficialName && race.circuitOfficialName !== race.circuitName && (
                <p className="text-zinc-400">{race.circuitOfficialName}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                <MapPin className="h-4 w-4" />
                <span>{[race.circuitLocation, race.circuitCountry].filter(Boolean).join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main circuit content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Track Layout (zoomable viewer) */}
              {race.circuitLayoutImageUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5 text-emerald-500" />
                      Track Layout
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrackLayoutViewer
                      thumbnailUrl={race.circuitLayoutImageUrl!}
                      circuitName={race.circuitName || race.name}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Circuit Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Circuit Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {race.circuitLengthMeters && (
                      <div className="rounded-lg bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Ruler className="h-4 w-4" />
                          Track Length
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {(Number(race.circuitLengthMeters) / 1000).toFixed(3)} km
                        </p>
                      </div>
                    )}
                    {race.circuitTurns && (
                      <div className="rounded-lg bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <CornerUpRight className="h-4 w-4" />
                          Corners
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">{race.circuitTurns}</p>
                      </div>
                    )}
                    {race.circuitDrsZones && (
                      <div className="rounded-lg bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Zap className="h-4 w-4" />
                          DRS Zones
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">{race.circuitDrsZones}</p>
                      </div>
                    )}
                    {race.firstGrandPrixYear && (
                      <div className="rounded-lg bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          First Grand Prix
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">{race.firstGrandPrixYear}</p>
                      </div>
                    )}
                    {race.circuitType && (
                      <div className="rounded-lg bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <MapPin className="h-4 w-4" />
                          Circuit Type
                        </div>
                        <p className="mt-1 text-xl font-bold text-white capitalize">
                          {race.circuitType === 'street' ? 'Street Circuit' : race.circuitType === 'permanent' ? 'Permanent' : race.circuitType}
                        </p>
                      </div>
                    )}
                    {race.circuitDirection && (
                      <div className="rounded-lg bg-zinc-800/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Compass className="h-4 w-4" />
                          Direction
                        </div>
                        <p className="mt-1 text-xl font-bold text-white capitalize">
                          {race.circuitDirection === 'clockwise' ? 'Clockwise' : 'Anti-clockwise'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lap Record */}
              {race.lapRecordTime && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      Lap Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6">
                      <p className="text-4xl font-bold font-mono text-white">{race.lapRecordTime}</p>
                      {race.lapRecordDriver && (
                        <p className="mt-2 text-lg text-zinc-300">
                          {race.lapRecordDriver}
                          {race.lapRecordYear && <span className="text-zinc-500"> ({race.lapRecordYear})</span>}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Track History */}
              {race.circuitSlug && (
                <TrackHistory circuitSlug={race.circuitSlug} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Session Schedule */}
              {sessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Flag className="h-4 w-4 text-emerald-500" />
                      Session Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sessions.map((session) => {
                        const sessionPast = session.startDatetime && new Date(session.startDatetime) < new Date();
                        return (
                          <div
                            key={session.id}
                            className={`flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 ${sessionPast ? 'opacity-50' : ''}`}
                          >
                            <div>
                              <p className="text-sm font-medium text-white">{session.sessionName}</p>
                              <p className="text-xs text-zinc-500">{formatSessionTime(session.startDatetime)}</p>
                            </div>
                            <Badge
                              variant={
                                session.sessionType === 'race' ? 'danger'
                                  : session.sessionType === 'qualifying' ? 'warning'
                                    : session.sessionType === 'sprint' ? 'default'
                                      : 'secondary'
                              }
                              className="text-[10px]"
                            >
                              {session.sessionType}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weather */}
              {race.circuitSlug && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Cloud className="h-4 w-4 text-blue-400" />
                      Historical Weather
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <WeatherChart circuitSlug={race.circuitSlug} className="border-0 rounded-none" />
                  </CardContent>
                </Card>
              )}

              {/* Circuit badges */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {race.circuitType && (
                      <Badge variant={race.circuitType === 'street' ? 'warning' : race.circuitType === 'permanent' ? 'success' : 'default'}>
                        {race.circuitType} circuit
                      </Badge>
                    )}
                    {race.circuitDirection && (
                      <Badge variant="secondary">
                        {race.circuitDirection === 'clockwise' ? 'Clockwise' : 'Anti-clockwise'}
                      </Badge>
                    )}
                    {race.circuitTimezone && (
                      <Badge variant="secondary">{race.circuitTimezone}</Badge>
                    )}
                  </div>
                  {/* Google Maps link */}
                  {race.circuitLatitude && race.circuitLongitude && (
                    <a
                      href={`https://www.google.com/maps?q=${race.circuitLatitude},${race.circuitLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mt-4"
                    >
                      <MapPin className="h-4 w-4" />
                      View on Google Maps
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Link to full track page */}
              {race.circuitSlug && (
                <Link
                  href={`/tracks/${race.circuitSlug}`}
                  className="block rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center hover:bg-zinc-800 transition-colors"
                >
                  <p className="text-sm font-medium text-white">View Full Circuit Guide</p>
                  <p className="text-xs text-zinc-500 mt-1">Race history, past results & more</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
