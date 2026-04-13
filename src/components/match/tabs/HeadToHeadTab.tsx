// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { GitCompareArrows, MapPin, Trophy, Target, Clock } from 'lucide-react';
import Image from 'next/image';
import type { MatchDetail, PredictionData } from '@/components/match/types';

/* ---------- helpers ---------- */

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-900/60 p-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function GoalTimingBar({
  label,
  count,
  maxCount,
}: {
  label: string;
  count: number;
  maxCount: number;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-zinc-500 w-12 text-right tabular-nums">{label}</span>
      <div className="flex-1 h-5 bg-zinc-900/60 rounded overflow-hidden relative">
        <div
          className="h-full bg-yellow-400/80 rounded transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        {count > 0 && (
          <span className="absolute inset-y-0 flex items-center text-[10px] font-bold text-zinc-200 px-2">
            {count} goal{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- component ---------- */

interface HeadToHeadTabProps {
  match: MatchDetail;
  predictions: PredictionData | null;
}

export default function HeadToHeadTab({ match, predictions }: HeadToHeadTabProps) {
  const h2h = predictions?.h2h ?? [];
  const comparison = predictions?.comparison ?? {};

  /* ---- H2H Record Calculations ---- */
  const record = useMemo(() => {
    if (h2h.length === 0) return null;

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalGoals = 0;

    for (const game of h2h) {
      const hGoals = game.goals?.home ?? game.score?.fulltime?.home ?? 0;
      const aGoals = game.goals?.away ?? game.score?.fulltime?.away ?? 0;
      totalGoals += (Number(hGoals) || 0) + (Number(aGoals) || 0);

      // Determine which side of the h2h fixture corresponds to our match teams
      const homeTeamName = game.teams?.home?.name ?? '';
      const awayTeamName = game.teams?.away?.name ?? '';
      const hg = Number(hGoals) || 0;
      const ag = Number(aGoals) || 0;

      if (hg > ag) {
        // Home team of this fixture won
        if (homeTeamName === match.home_name) homeWins++;
        else awayWins++;
      } else if (ag > hg) {
        // Away team of this fixture won
        if (awayTeamName === match.home_name) homeWins++;
        else awayWins++;
      } else {
        draws++;
      }
    }

    const avgGoals = h2h.length > 0 ? (totalGoals / h2h.length).toFixed(1) : '0';

    return { total: h2h.length, homeWins, draws, awayWins, totalGoals, avgGoals };
  }, [h2h, match.home_name]);

  /* ---- Goal Timing Analysis ---- */
  const goalTiming = useMemo(() => {
    const buckets = {
      '0-15': 0,
      '16-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61-75': 0,
      '76-90': 0,
    };

    for (const game of h2h) {
      // Try to get events from the fixture
      const events = game.events ?? game.fixture?.events ?? [];
      if (Array.isArray(events)) {
        for (const ev of events) {
          if (ev.type === 'Goal' || ev.detail === 'Normal Goal' || ev.detail === 'Penalty' || ev.detail === 'Own Goal') {
            const min = ev.time?.elapsed ?? ev.minute ?? 0;
            if (min <= 15) buckets['0-15']++;
            else if (min <= 30) buckets['16-30']++;
            else if (min <= 45) buckets['31-45']++;
            else if (min <= 60) buckets['46-60']++;
            else if (min <= 75) buckets['61-75']++;
            else buckets['76-90']++;
          }
        }
      }

      // Fallback: if no events, use goals to at least count them (distributed evenly is useless,
      // so we only show goal timing if we have event-level data)
    }

    const totalFromEvents = Object.values(buckets).reduce((a, b) => a + b, 0);
    return totalFromEvents > 0 ? buckets : null;
  }, [h2h]);

  /* ---- Venue Record ---- */
  const venueRecord = useMemo(() => {
    if (h2h.length === 0) return null;

    let homeAtVenue = 0;
    let homeWinsAtVenue = 0;
    let homeDrawsAtVenue = 0;

    for (const game of h2h) {
      const fixtureHomeTeam = game.teams?.home?.name ?? '';
      if (fixtureHomeTeam === match.home_name) {
        homeAtVenue++;
        const hg = Number(game.goals?.home ?? 0);
        const ag = Number(game.goals?.away ?? 0);
        if (hg > ag) homeWinsAtVenue++;
        else if (hg === ag) homeDrawsAtVenue++;
      }
    }

    if (homeAtVenue === 0) return null;

    const winPct = Math.round((homeWinsAtVenue / homeAtVenue) * 100);
    return { played: homeAtVenue, wins: homeWinsAtVenue, draws: homeDrawsAtVenue, losses: homeAtVenue - homeWinsAtVenue - homeDrawsAtVenue, winPct };
  }, [h2h, match.home_name]);

  /* ---- Comparison bars ---- */
  function ComparisonBar({
    label,
    homeValue,
    awayValue,
  }: {
    label: string;
    homeValue: number;
    awayValue: number;
  }) {
    const total = homeValue + awayValue;
    const homePct = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPct = total > 0 ? (awayValue / total) * 100 : 50;
    const homeHigher = homeValue > awayValue;
    const awayHigher = awayValue > homeValue;

    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-bold tabular-nums w-12 ${homeHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
            {homeValue}%
          </span>
          <span className="text-xs text-zinc-400 uppercase tracking-wider flex-1 text-center">
            {label}
          </span>
          <span className={`text-sm font-bold tabular-nums w-12 text-right ${awayHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
            {awayValue}%
          </span>
        </div>
        <div className="flex h-2 gap-0.5">
          <div className="flex-1 flex justify-end">
            <div
              className="h-full rounded-l bg-yellow-400 transition-all duration-700"
              style={{ width: `${homePct}%` }}
            />
          </div>
          <div className="flex-1">
            <div
              className="h-full rounded-r bg-zinc-500 transition-all duration-700"
              style={{ width: `${awayPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  const hasData = h2h.length > 0 || Object.keys(comparison).length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <GitCompareArrows className="h-8 w-8" />
        <p className="text-sm">Head-to-head data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- Team Key Header ---- */}
      <div className="rounded-lg bg-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.home_logo && (
              <Image src={match.home_logo} alt="" width={20} height={20} className="rounded-sm" />
            )}
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-400" />
            <span className="text-sm font-semibold text-zinc-200">{match.home_name}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Head-to-Head</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">{match.away_name}</span>
            <span className="inline-block h-3 w-3 rounded-sm bg-zinc-500" />
            {match.away_logo && (
              <Image src={match.away_logo} alt="" width={20} height={20} className="rounded-sm" />
            )}
          </div>
        </div>
      </div>

      {/* ---- H2H Record Summary ---- */}
      {record && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <Trophy className="h-4 w-4" />
            H2H Record
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Meetings" value={record.total} />
            <StatCard
              label={match.home_name + ' Wins'}
              value={record.homeWins}
              highlight={record.homeWins > record.awayWins}
            />
            <StatCard label="Draws" value={record.draws} />
            <StatCard
              label={match.away_name + ' Wins'}
              value={record.awayWins}
              highlight={record.awayWins > record.homeWins}
            />
            <StatCard label="Total Goals" value={record.totalGoals} />
            <StatCard label="Avg Goals/Match" value={record.avgGoals} highlight />
          </div>

          {/* Visual win distribution bar */}
          {record.total > 0 && (
            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden">
                {record.homeWins > 0 && (
                  <div
                    className="bg-yellow-400 transition-all duration-700"
                    style={{ width: `${(record.homeWins / record.total) * 100}%` }}
                    title={`${match.home_name} wins`}
                  />
                )}
                {record.draws > 0 && (
                  <div
                    className="bg-zinc-500 transition-all duration-700"
                    style={{ width: `${(record.draws / record.total) * 100}%` }}
                    title="Draws"
                  />
                )}
                {record.awayWins > 0 && (
                  <div
                    className="bg-zinc-400 transition-all duration-700"
                    style={{ width: `${(record.awayWins / record.total) * 100}%` }}
                    title={`${match.away_name} wins`}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-zinc-500">
                <span>{match.home_name} {Math.round((record.homeWins / record.total) * 100)}%</span>
                {record.draws > 0 && <span>Draws {Math.round((record.draws / record.total) * 100)}%</span>}
                <span>{match.away_name} {Math.round((record.awayWins / record.total) * 100)}%</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---- Last 5 H2H Results ---- */}
      {h2h.length > 0 && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <Clock className="h-4 w-4" />
            Last {Math.min(h2h.length, 5)} Meetings
          </h3>
          <div className="space-y-2">
            {h2h.slice(0, 5).map((game, i) => {
              const homeTeam = game.teams?.home?.name ?? 'Home';
              const awayTeam = game.teams?.away?.name ?? 'Away';
              const homeLogo = game.teams?.home?.logo;
              const awayLogo = game.teams?.away?.logo;
              const homeGoals = game.goals?.home ?? game.score?.fulltime?.home ?? '?';
              const awayGoals = game.goals?.away ?? game.score?.fulltime?.away ?? '?';
              const date = game.fixture?.date
                ? new Date(game.fixture.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';
              const comp = game.league?.name ?? '';
              const venue = game.fixture?.venue?.name ?? '';

              // Determine result for match.home_name perspective
              const hg = Number(homeGoals) || 0;
              const ag = Number(awayGoals) || 0;
              let resultColor = 'border-l-zinc-500'; // draw
              if (hg !== ag) {
                const winnerIsMatchHome =
                  (hg > ag && homeTeam === match.home_name) ||
                  (ag > hg && awayTeam === match.home_name);
                resultColor = winnerIsMatchHome ? 'border-l-emerald-500' : 'border-l-red-500';
              }

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg bg-zinc-900/60 px-4 py-3 border-l-4 ${resultColor}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      {homeLogo && (
                        <Image src={homeLogo} alt="" width={18} height={18} className="rounded-sm" />
                      )}
                      <span
                        className={`font-semibold ${
                          hg > ag ? 'text-yellow-400' : 'text-zinc-300'
                        }`}
                      >
                        {homeTeam}
                      </span>
                      <span className="font-bold text-white tabular-nums text-base">
                        {homeGoals} - {awayGoals}
                      </span>
                      <span
                        className={`font-semibold ${
                          ag > hg ? 'text-yellow-400' : 'text-zinc-300'
                        }`}
                      >
                        {awayTeam}
                      </span>
                      {awayLogo && (
                        <Image src={awayLogo} alt="" width={18} height={18} className="rounded-sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {date && <span className="text-[10px] text-zinc-500">{date}</span>}
                      {comp && (
                        <>
                          <span className="text-zinc-700">|</span>
                          <span className="text-[10px] text-zinc-500">{comp}</span>
                        </>
                      )}
                      {venue && (
                        <>
                          <span className="text-zinc-700">|</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {venue}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- H2H Goal Timing ---- */}
      {goalTiming && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <Target className="h-4 w-4" />
            Goal Timing in H2H
          </h3>
          <p className="text-[11px] text-zinc-500 mb-3">
            When goals tend to happen in this fixture
          </p>
          <div className="space-y-2">
            {Object.entries(goalTiming).map(([bucket, count]) => (
              <GoalTimingBar
                key={bucket}
                label={bucket + "'"}
                count={count}
                maxCount={Math.max(...Object.values(goalTiming))}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Venue Record ---- */}
      {venueRecord && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <MapPin className="h-4 w-4" />
            {match.home_name} Home Record in H2H
          </h3>
          {match.venue_name && (
            <p className="text-[11px] text-zinc-500 mb-3">{match.venue_name}</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Played at Home" value={venueRecord.played} />
            <StatCard label="Wins" value={venueRecord.wins} highlight={venueRecord.wins > 0} />
            <StatCard label="Draws" value={venueRecord.draws} />
            <StatCard label="Losses" value={venueRecord.losses} />
          </div>
          <div className="mt-3 rounded-lg bg-zinc-900/60 px-3 py-2 text-center">
            <span className="text-xs text-zinc-400">
              Home win rate:{' '}
              <span className={`font-bold text-base ${venueRecord.winPct >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {venueRecord.winPct}%
              </span>
            </span>
          </div>
        </section>
      )}

      {/* ---- Season Comparison ---- */}
      {Object.keys(comparison).length > 0 && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Season Comparison
          </h3>
          <div className="divide-y divide-zinc-700/50">
            {Object.entries(comparison).map(([key, val]) => {
              const hNum = parseInt(val.home) || 0;
              const aNum = parseInt(val.away) || 0;
              const label = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <ComparisonBar
                  key={key}
                  label={label}
                  homeValue={hNum}
                  awayValue={aNum}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ---- All Previous Meetings (remaining after top 5) ---- */}
      {h2h.length > 5 && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Earlier Meetings
          </h3>
          <div className="space-y-1.5">
            {h2h.slice(5, 15).map((game, i) => {
              const homeTeam = game.teams?.home?.name ?? 'Home';
              const awayTeam = game.teams?.away?.name ?? 'Away';
              const homeGoals = game.goals?.home ?? '?';
              const awayGoals = game.goals?.away ?? '?';
              const date = game.fixture?.date
                ? new Date(game.fixture.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })
                : '';

              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-zinc-900/40 px-3 py-2 text-xs"
                >
                  <span className="text-zinc-500 w-20">{date}</span>
                  <span className="text-zinc-300">{homeTeam}</span>
                  <span className="font-bold text-white tabular-nums mx-2">
                    {homeGoals} - {awayGoals}
                  </span>
                  <span className="text-zinc-300">{awayTeam}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
