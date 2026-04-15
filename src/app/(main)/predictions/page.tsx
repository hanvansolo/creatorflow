// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Target, Calendar, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { db, matches, matchPredictions, clubs, competitions, competitionSeasons } from '@/lib/db';
import { desc, eq, gte, and, isNotNull } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Predictions - AI Match Predictions & Tips',
  'AI-powered football match predictions with score forecasts, BTTS, and over/under predictions. Free football tips for the Premier League, Champions League, and more.',
  '/predictions',
  ['football predictions', 'match predictions', 'football tips', 'AI predictions', 'score predictions', 'BTTS']
);

async function getUpcomingPredictions() {
  const now = new Date();

  const rows = await db
    .select({
      matchId: matches.id,
      matchSlug: matches.slug,
      kickoff: matches.kickoff,
      status: matches.status,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      homeClubName: clubs.name,
      homeClubLogo: clubs.logoUrl,
      homeClubSlug: clubs.slug,
      predId: matchPredictions.id,
      predictedOutcome: matchPredictions.predictedOutcome,
      predictedHomeScore: matchPredictions.predictedHomeScore,
      predictedAwayScore: matchPredictions.predictedAwayScore,
      confidence: matchPredictions.confidence,
      btts: matchPredictions.btts,
      overUnder: matchPredictions.overUnder,
      overUnderPrediction: matchPredictions.overUnderPrediction,
      factors: matchPredictions.factors,
      accuracy: matchPredictions.accuracy,
    })
    .from(matchPredictions)
    .innerJoin(matches, eq(matchPredictions.matchId, matches.id))
    .innerJoin(clubs, eq(matches.homeClubId, clubs.id))
    .orderBy(desc(matches.kickoff))
    .limit(30);

  // Now fetch away clubs separately since we can't join the same table twice easily
  if (rows.length === 0) return [];

  const matchIds = rows.map(r => r.matchId);
  const awayClubRows = await db
    .select({
      matchId: matches.id,
      awayClubName: clubs.name,
      awayClubLogo: clubs.logoUrl,
      awayClubSlug: clubs.slug,
    })
    .from(matches)
    .innerJoin(clubs, eq(matches.awayClubId, clubs.id))
    .where(
      // Filter to our match IDs
      matchIds.length === 1
        ? eq(matches.id, matchIds[0])
        : eq(matches.id, matchIds[0]) // We'll do a map lookup instead
    );

  // Get ALL away clubs for all matches
  const allAwayClubs = await db
    .select({
      matchId: matches.id,
      awayClubName: clubs.name,
      awayClubLogo: clubs.logoUrl,
      awayClubSlug: clubs.slug,
    })
    .from(matches)
    .innerJoin(clubs, eq(matches.awayClubId, clubs.id));

  const awayMap = new Map(allAwayClubs.map(r => [r.matchId, r]));

  return rows.map(row => {
    const away = awayMap.get(row.matchId);
    return {
      ...row,
      awayClubName: away?.awayClubName || 'TBD',
      awayClubLogo: away?.awayClubLogo || null,
      awayClubSlug: away?.awayClubSlug || '',
    };
  });
}

function formatKickoff(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    // Match is in the past
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  if (days === 0) return `Today ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  if (days === 1) return `Tomorrow ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  if (days < 7) return date.toLocaleDateString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getOutcomeLabel(outcome: string, t: Dictionary): string {
  switch (outcome) {
    case 'home': return t.predictions.homeWin;
    case 'away': return t.predictions.awayWin;
    case 'draw': return t.predictions.draw;
    default: return outcome;
  }
}

function getConfidenceColor(confidence: number | null): string {
  if (!confidence) return 'text-zinc-400';
  if (confidence >= 75) return 'text-emerald-400';
  if (confidence >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export default async function PredictionsPage() {
  const [predictions, locale] = await Promise.all([getUpcomingPredictions(), getLocale()]);
  const t = getDictionary(locale);
  const p = locale === DEFAULT_LOCALE ? '' : `/${locale}`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-br from-blue-500/10 via-zinc-900/50 to-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t.predictions.heading}</h1>
              <p className="mt-1 text-zinc-400">{t.predictions.subheading}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions List */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {predictions.length === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-12 text-center">
            <Target className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{t.predictions.none}</h3>
            <p className="text-zinc-400 max-w-md mx-auto">{t.predictions.blurb}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((pred) => {
              const isFinished = pred.status === 'finished';
              const accuracy = pred.accuracy as any;
              const outcomeCorrect = accuracy?.outcomeCorrect;

              return (
                <div
                  key={pred.predId}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
                >
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatKickoff(pred.kickoff)}
                    </div>
                    {isFinished && outcomeCorrect !== undefined && (
                      <div className="flex items-center gap-1.5">
                        {outcomeCorrect ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className={`text-xs font-medium ${outcomeCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {outcomeCorrect ? t.predictions.correct : t.predictions.incorrect}
                        </span>
                      </div>
                    )}
                    {!isFinished && (
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                        {pred.status === 'live' ? t.common.live : t.predictions.upcoming}
                      </span>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {pred.homeClubLogo && (
                        <img src={pred.homeClubLogo} alt="" className="h-8 w-8 object-contain" />
                      )}
                      <span className="font-semibold text-white">{pred.homeClubName}</span>
                    </div>
                    <div className="text-center">
                      {isFinished ? (
                        <span className="text-xl font-bold text-white">
                          {pred.homeScore} - {pred.awayScore}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-500">vs</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{pred.awayClubName}</span>
                      {pred.awayClubLogo && (
                        <img src={pred.awayClubLogo} alt="" className="h-8 w-8 object-contain" />
                      )}
                    </div>
                  </div>

                  {/* Prediction Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-zinc-800/50 p-3">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-1">{t.predictions.prediction}</div>
                      <div className="text-sm font-medium text-white">{getOutcomeLabel(pred.predictedOutcome, t)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-1">{t.predictions.score}</div>
                      <div className="text-sm font-medium text-white">
                        {pred.predictedHomeScore ?? '?'} - {pred.predictedAwayScore ?? '?'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-1">{t.predictions.confidence}</div>
                      <div className={`text-sm font-medium ${getConfidenceColor(pred.confidence)}`}>
                        {pred.confidence ? `${pred.confidence}%` : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-1">{t.predictions.btts}</div>
                      <div className="text-sm font-medium text-white">
                        {pred.btts === true ? 'Yes' : pred.btts === false ? 'No' : '-'}
                      </div>
                    </div>
                  </div>

                  {pred.overUnder && (
                    <div className="mt-2 text-center text-xs text-zinc-500">
                      {pred.overUnderPrediction === 'over' ? 'Over' : 'Under'} {pred.overUnder} goals
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
