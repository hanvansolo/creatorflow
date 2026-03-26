// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { GamesWidget } from '@/components/widgets/ApiFootballWidget';
import { db, matches } from '@/lib/db';
import { sql, gt, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { Radio, ArrowRight, Zap, Calendar, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Live Scores - Football',
  'Real-time football live scores across all major leagues. Goals, cards, substitutions, and match events as they happen.',
  '/live',
  ['live scores', 'football live', 'real-time scores', 'live football', 'match updates']
);

export default async function LiveScoresPage() {
  // Count live matches from DB
  const liveStatuses = ['live', 'halftime', 'extra_time', 'penalties'];
  const liveCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(inArray(matches.status, liveStatuses));
  const liveCount = Number(liveCountResult[0]?.count || 0);

  // Find next upcoming match if none live
  let nextMatch: { kickoff: Date } | null = null;
  if (liveCount === 0) {
    const upcoming = await db.query.matches.findFirst({
      where: gt(matches.kickoff, new Date()),
      orderBy: (matches, { asc }) => [asc(matches.kickoff)],
      columns: { kickoff: true },
    });
    nextMatch = upcoming || null;
  }

  // Calculate time until next match
  let timeUntilNext = '';
  if (nextMatch) {
    const diff = new Date(nextMatch.kickoff).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      timeUntilNext = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      timeUntilNext = `${hours}h ${minutes}m`;
    } else {
      timeUntilNext = `${minutes} minutes`;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with prominent LIVE indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Radio className="h-5 w-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">Live Scores</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-zinc-400 text-sm">Real-time scores and match events across all leagues</p>
            </div>
          </div>
        </div>

        {/* Match count / status banner */}
        <div className="mb-6 rounded-lg border border-zinc-700/40 bg-zinc-800/60 px-5 py-4">
          {liveCount > 0 ? (
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {liveCount} match{liveCount !== 1 ? 'es' : ''} live right now
                </p>
                <p className="text-xs text-zinc-400">Scores update automatically every 30 seconds</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-300">No live matches right now</p>
                <p className="text-xs text-zinc-400">
                  {timeUntilNext
                    ? `Next match in ${timeUntilNext}`
                    : 'Check the fixtures page for upcoming matches'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Games widget shows live matches by default with auto-refresh */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
          <GamesWidget />
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/fixtures"
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                View full fixtures
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
          <Link
            href="/tables"
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                League tables
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
