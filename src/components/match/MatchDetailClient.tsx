// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowUpRight,
  Shield,
  Clock,
  MapPin,
  Radio,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import SummaryTab from './tabs/SummaryTab';
import TimelineTab from './tabs/TimelineTab';
import LineupsTab from './tabs/LineupsTab';
import StatsTab from './tabs/StatsTab';
import OddsTab from './tabs/OddsTab';
import NewsTab from './tabs/NewsTab';
import { AdSlot } from '@/components/ads/AdSlot';
import type { MatchPageData, LiveRefreshData, MatchEvent, TeamStats, MatchAnalysisRow } from './types';

function isLiveStatus(status: string) {
  return ['live', 'halftime', 'extra_time', 'penalties'].includes(status);
}

function formatKickoff(kickoff: string) {
  const d = new Date(kickoff);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

interface MatchDetailClientProps {
  data: MatchPageData;
}

export function MatchDetailClient({ data }: MatchDetailClientProps) {
  const [match, setMatch] = useState(data.match);
  const [events, setEvents] = useState(data.events);
  const [homeStats, setHomeStats] = useState(data.homeStats);
  const [awayStats, setAwayStats] = useState(data.awayStats);
  const [latestAnalysis, setLatestAnalysis] = useState(data.analyses[0] || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh for live matches
  const refresh = useCallback(async () => {
    if (!isLiveStatus(match.status)) return;
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/matches/${match.id}/live`);
      if (!res.ok) return;
      const live: LiveRefreshData = await res.json();

      setMatch(prev => ({
        ...prev,
        status: live.status,
        minute: live.minute,
        home_score: live.homeScore,
        away_score: live.awayScore,
        home_score_ht: live.homeScoreHt,
        away_score_ht: live.awayScoreHt,
      }));

      if (live.events && live.events.length > 0) setEvents(live.events);
      if (live.homeStats) setHomeStats(live.homeStats);
      if (live.awayStats) setAwayStats(live.awayStats);
      if (live.latestAnalysis) setLatestAnalysis(live.latestAnalysis);
    } catch {
      // Silently fail — will retry next interval
    } finally {
      setIsRefreshing(false);
    }
  }, [match.id, match.status]);

  useEffect(() => {
    if (!isLiveStatus(match.status)) return;
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [match.status, refresh]);

  const isLive = isLiveStatus(match.status);
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';
  const score = match.home_score != null ? `${match.home_score} - ${match.away_score}` : null;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Match Header — always visible */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${match.home_color || '#059669'}22 0%, transparent 50%, ${match.away_color || '#3f3f46'}22 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 to-zinc-900" />
        <div className="relative mx-auto max-w-5xl px-4 pb-6 pt-4">
          {/* Competition + Round */}
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
            {match.competition_name && (
              <Link href={`/tables?competition=${match.competition_slug}`} className="hover:text-emerald-400 transition-colors">
                {match.competition_name}
              </Link>
            )}
            {match.round && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span>{match.round}</span>
              </>
            )}
          </div>

          {/* Teams + Score */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Home */}
            <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
              <Link className="group flex flex-col items-center gap-2" href={`/teams/${match.home_slug}`}>
                {match.home_logo ? (
                  <Image src={match.home_logo} alt={match.home_name} width={72} height={72}
                    className="h-16 w-16 sm:h-[72px] sm:w-[72px] object-contain drop-shadow-lg group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-16 w-16 rounded-full" style={{ backgroundColor: match.home_color || '#52525b' }} />
                )}
                <span className="text-sm sm:text-base font-semibold text-zinc-100 text-center group-hover:text-emerald-400 transition-colors">
                  {match.home_name}
                </span>
              </Link>
            </div>

            {/* Score / Time */}
            <div className="flex flex-col items-center gap-2">
              {score ? (
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                  {match.home_score}<span className="mx-2 text-zinc-600">-</span>{match.away_score}
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-zinc-300">
                  {new Date(match.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Status badge */}
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-4 py-1.5 text-sm font-bold text-red-400 border border-red-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                  </span>
                  LIVE {match.minute ? `${match.minute}'` : ''}
                </span>
              )}
              {isFinished && (
                <span className="rounded-full bg-zinc-700 px-4 py-1.5 text-sm font-bold text-zinc-300 border border-zinc-600">
                  FT
                </span>
              )}
              {isScheduled && (
                <span className="text-sm text-zinc-500">
                  {formatKickoff(match.kickoff)}
                </span>
              )}

              {/* HT score */}
              {match.home_score_ht != null && (
                <div className="text-xs text-zinc-500">
                  HT: {match.home_score_ht} - {match.away_score_ht}
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
              <Link className="group flex flex-col items-center gap-2" href={`/teams/${match.away_slug}`}>
                {match.away_logo ? (
                  <Image src={match.away_logo} alt={match.away_name} width={72} height={72}
                    className="h-16 w-16 sm:h-[72px] sm:w-[72px] object-contain drop-shadow-lg group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-16 w-16 rounded-full" style={{ backgroundColor: match.away_color || '#52525b' }} />
                )}
                <span className="text-sm sm:text-base font-semibold text-zinc-100 text-center group-hover:text-emerald-400 transition-colors">
                  {match.away_name}
                </span>
              </Link>
            </div>
          </div>

          {/* Venue + Referee */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
            {match.venue_name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{match.venue_name}{match.venue_city ? `, ${match.venue_city}` : ''}</span>
              </div>
            )}
            {match.referee && (
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                <span>{match.referee}</span>
              </div>
            )}
            {isLive && isRefreshing && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Radio className="h-3 w-3 animate-pulse" />
                <span className="text-[10px]">Updating...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="mx-auto max-w-5xl px-4 py-4">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full flex overflow-x-auto border-b border-zinc-800 bg-transparent gap-0 rounded-none p-0 scrollbar-hide">
            {[
              { value: 'summary', label: 'Summary' },
              { value: 'timeline', label: 'Timeline' },
              { value: 'lineups', label: 'Lineups' },
              { value: 'stats', label: 'Stats' },
              { value: 'odds', label: 'Odds' },
              { value: 'news', label: 'News' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="summary">
              <SummaryTab
                match={match}
                events={events}
                homeStats={homeStats}
                awayStats={awayStats}
                latestAnalysis={latestAnalysis}
                injuries={data.injuries}
                predictions={data.predictions}
              />
            </TabsContent>

            <TabsContent value="timeline">
              <TimelineTab match={match} events={events} />
            </TabsContent>

            <TabsContent value="lineups">
              <LineupsTab
                match={match}
                lineups={data.lineups}
                homeSquad={data.homeSquad}
                awaySquad={data.awaySquad}
              />
            </TabsContent>

            <TabsContent value="stats">
              <StatsTab
                match={match}
                homeStats={homeStats}
                awayStats={awayStats}
                playerRatings={data.playerRatings}
                predictions={data.predictions}
              />
            </TabsContent>

            <TabsContent value="odds">
              <OddsTab odds={data.odds} />
            </TabsContent>

            <TabsContent value="news">
              <NewsTab
                articles={data.articles}
                homeName={match.home_name}
                awayName={match.away_name}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Ad */}
        <div className="my-6">
          <AdSlot format="horizontal" />
        </div>

        {/* Footer links */}
        <section className="grid gap-3 sm:grid-cols-3 mt-4">
          <Link
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
            href={`/teams/${match.home_slug}`}
          >
            <span>View {match.home_name}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
          <Link
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
            href={`/teams/${match.away_slug}`}
          >
            <span>View {match.away_name}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
          <Link
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
            href={`/compare?home=${match.home_slug}&away=${match.away_slug}`}
          >
            <span>Head to Head</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
        </section>

        <div className="text-center mt-6 mb-8">
          <Link className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors" href="/fixtures">
            <ArrowLeft className="h-4 w-4" />
            Back to Fixtures
          </Link>
        </div>
      </div>
    </div>
  );
}
