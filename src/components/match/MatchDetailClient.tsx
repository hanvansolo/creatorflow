// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import SummaryTab from './tabs/SummaryTab';
import TimelineTab from './tabs/TimelineTab';
import LineupsTab from './tabs/LineupsTab';
import StatsTab from './tabs/StatsTab';
import OddsTab from './tabs/OddsTab';
import NewsTab from './tabs/NewsTab';
import HeadToHeadTab from './tabs/HeadToHeadTab';
import { AdSlot } from '@/components/ads/AdSlot';
import { HorizontalAd } from '@/components/ads/ProfitableAds';
import type { MatchPageData, LiveRefreshData, MatchEvent, TeamStats, MatchAnalysisRow } from './types';

function isLiveStatus(status: string) {
  return ['live', 'halftime', 'extra_time', 'penalties'].includes(status);
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

  // Track page view
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageType: 'match',
        pageSlug: match.slug || match.id,
        competitionSlug: match.competition_slug || null,
      }),
    }).catch(() => {}); // Never fail
  }, [match.id]);

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
  const score = match.home_score != null ? `${match.home_score} - ${match.away_score}` : null;

  // Extract goal scorers from events
  const homeGoals = events.filter(e =>
    ['goal', 'own_goal', 'penalty_scored'].includes(e.event_type) &&
    (e.is_home === true || e.club_id === 'home' || e.club_name === match.home_name)
  );
  const awayGoals = events.filter(e =>
    ['goal', 'own_goal', 'penalty_scored'].includes(e.event_type) &&
    (e.is_home === false || e.club_id === 'away' || e.club_name === match.away_name)
  );
  const homeAssists = events.filter(e =>
    ['goal', 'penalty_scored'].includes(e.event_type) && e.second_player_known_as &&
    (e.is_home === true || e.club_id === 'home' || e.club_name === match.home_name)
  );
  const awayAssists = events.filter(e =>
    ['goal', 'penalty_scored'].includes(e.event_type) && e.second_player_known_as &&
    (e.is_home === false || e.club_id === 'away' || e.club_name === match.away_name)
  );

  function goalText(e: any) {
    const name = e.player_known_as || e.club_name || '';
    const min = e.added_time ? `${e.minute}'+${e.added_time}` : `${e.minute}'`;
    const suffix = e.event_type === 'own_goal' ? ' (OG)' : e.event_type === 'penalty_scored' ? ' (Pen)' : '';
    return `${name} (${min}${suffix})`;
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Match Header — BBC style */}
      <div className="bg-zinc-800/60 border-b border-zinc-700/50">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Date + Competition */}
          <div className="text-center mb-5 text-sm text-zinc-400">
            <span>{new Date(match.kickoff).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {match.competition_name && (
              <>
                <span className="mx-2 text-zinc-600">&middot;</span>
                <Link href={`/tables?competition=${match.competition_slug}`} className="hover:text-yellow-400 transition-colors">
                  {match.competition_name}
                </Link>
              </>
            )}
          </div>

          {/* Teams + Score row */}
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {/* Home team */}
            <Link href={`/teams/${match.home_slug}`} className="group flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
              <span className="text-base sm:text-xl font-bold text-white text-right truncate group-hover:text-yellow-400 transition-colors">
                {match.home_name}
              </span>
              {match.home_logo ? (
                <Image src={match.home_logo} alt="" width={48} height={48} className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full shrink-0" style={{ backgroundColor: match.home_color || '#52525b' }} />
              )}
            </Link>

            {/* Score */}
            <div className="flex flex-col items-center shrink-0">
              {score ? (
                <div className="flex items-center gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tabular-nums">{match.home_score}</span>
                  <span className="text-2xl text-zinc-600 font-light">|</span>
                  <span className="text-4xl sm:text-5xl font-black text-white tabular-nums">{match.away_score}</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-yellow-400">
                  {new Date(match.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {/* Status */}
              {isLive && (
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-red-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                  </span>
                  {match.minute}'
                </span>
              )}
              {isFinished && (
                <span className="mt-1 text-xs font-semibold text-yellow-400">FT</span>
              )}

              {/* HT */}
              {match.home_score_ht != null && (
                <span className="text-[10px] text-zinc-500 mt-0.5">HT {match.home_score_ht}-{match.away_score_ht}</span>
              )}
            </div>

            {/* Away team */}
            <Link href={`/teams/${match.away_slug}`} className="group flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {match.away_logo ? (
                <Image src={match.away_logo} alt="" width={48} height={48} className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full shrink-0" style={{ backgroundColor: match.away_color || '#52525b' }} />
              )}
              <span className="text-base sm:text-xl font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                {match.away_name}
              </span>
            </Link>
          </div>

          {/* Goal scorers — BBC style */}
          {(homeGoals.length > 0 || awayGoals.length > 0) && (
            <div className="flex justify-center mt-3 gap-6 sm:gap-12">
              <div className="flex-1 text-right">
                {homeGoals.map((g, i) => (
                  <p key={i} className="text-xs sm:text-sm text-yellow-400">{goalText(g)}</p>
                ))}
              </div>
              <div className="w-px" />
              <div className="flex-1 text-left">
                {awayGoals.map((g, i) => (
                  <p key={i} className="text-xs sm:text-sm text-yellow-400">{goalText(g)}</p>
                ))}
              </div>
            </div>
          )}

          {/* Assists */}
          {(homeAssists.length > 0 || awayAssists.length > 0) && (
            <div className="flex justify-center mt-1 gap-6 sm:gap-12">
              <div className="flex-1 text-right">
                {homeAssists.map((a, i) => (
                  <p key={i} className="text-[10px] sm:text-xs text-zinc-500">{a.second_player_known_as} ({a.minute}')</p>
                ))}
              </div>
              <div className="w-px" />
              <div className="flex-1 text-left text-center">
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assists</span>
              </div>
              <div className="flex-1 text-left">
                {awayAssists.map((a, i) => (
                  <p key={i} className="text-[10px] sm:text-xs text-zinc-500">{a.second_player_known_as} ({a.minute}')</p>
                ))}
              </div>
            </div>
          )}

          {/* Venue + Referee — centered below */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
            {match.venue_name && (
              <span>Venue: <strong className="text-zinc-400">{match.venue_name}</strong></span>
            )}
            {match.referee && (
              <span>{match.referee}</span>
            )}
            {isLive && isRefreshing && (
              <span className="text-yellow-400 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Updating...
              </span>
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
              { value: 'livetext', label: 'Live Text' },
              { value: 'lineups', label: 'Line-ups' },
              { value: 'stats', label: 'Match Stats' },
              { value: 'h2h', label: 'Head-to-head' },
              { value: 'odds', label: 'Odds' },
              { value: 'news', label: 'News' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:border-yellow-400 data-[state=active]:text-yellow-400 data-[state=active]:bg-transparent"
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
              {/* Timeline on Summary tab */}
              {events.length > 0 && (
                <div className="mt-6">
                  <TimelineTab match={match} events={events} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="livetext">
              <TimelineTab match={match} events={events} />
            </TabsContent>

            <TabsContent value="lineups">
              <LineupsTab
                match={match}
                lineups={data.lineups}
                homeSquad={data.homeSquad}
                awaySquad={data.awaySquad}
                events={events}
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

            <TabsContent value="h2h">
              <HeadToHeadTab
                match={match}
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
          <HorizontalAd />
        </div>

        {/* Footer links */}
        <section className="grid gap-3 sm:grid-cols-3 mt-4">
          <Link
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-yellow-400/30 hover:text-yellow-400 transition-all group"
            href={`/teams/${match.home_slug}`}
          >
            <span>View {match.home_name}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-400 transition-colors" />
          </Link>
          <Link
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-yellow-400/30 hover:text-yellow-400 transition-all group"
            href={`/teams/${match.away_slug}`}
          >
            <span>View {match.away_name}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-400 transition-colors" />
          </Link>
          <Link
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-yellow-400/30 hover:text-yellow-400 transition-all group"
            href={`/compare?home=${match.home_slug}&away=${match.away_slug}`}
          >
            <span>Head to Head</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-400 transition-colors" />
          </Link>
        </section>

        <div className="text-center mt-6 mb-8">
          <Link className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-yellow-400 transition-colors" href="/fixtures">
            <ArrowLeft className="h-4 w-4" />
            Back to Fixtures
          </Link>
        </div>
      </div>
    </div>
  );
}
