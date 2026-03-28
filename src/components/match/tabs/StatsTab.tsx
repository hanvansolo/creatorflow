// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { BarChart3, Star } from 'lucide-react';
import Image from 'next/image';
import type {
  MatchDetail,
  TeamStats,
  PlayerRating,
  PredictionData,
} from '@/components/match/types';

/* ---------- BBC center-out stat row ---------- */

function StatRow({
  label,
  homeValue,
  awayValue,
  isPercentage = false,
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  isPercentage?: boolean;
}) {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPct = total > 0 ? (awayValue / total) * 100 : 50;
  const homeHigher = homeValue > awayValue;
  const awayHigher = awayValue > homeValue;

  const fmt = (v: number) =>
    isPercentage ? `${v}%` : Number.isInteger(v) ? String(v) : v.toFixed(1);

  return (
    <div className="py-2">
      {/* Values + label */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-bold tabular-nums w-12 ${homeHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {fmt(homeValue)}
        </span>
        <span className="text-xs text-zinc-400 uppercase tracking-wider flex-1 text-center">
          {label}
        </span>
        <span className={`text-sm font-bold tabular-nums w-12 text-right ${awayHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {fmt(awayValue)}
        </span>
      </div>
      {/* Bars growing from center */}
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

/* ---------- Section Header ---------- */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="rounded-lg bg-zinc-800 px-4 py-2 mt-4 first:mt-0">
      <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400">{title}</h4>
    </div>
  );
}

/* ---------- rating color ---------- */

function ratingColor(rating: number): string {
  if (rating >= 7.5) return 'text-yellow-400';
  if (rating >= 6.5) return 'text-amber-400';
  return 'text-red-400';
}

function ratingBg(rating: number): string {
  if (rating >= 7.5) return 'bg-yellow-900/30';
  if (rating >= 6.5) return 'bg-amber-900/30';
  return 'bg-red-900/30';
}

/* ---------- component ---------- */

interface StatsTabProps {
  match: MatchDetail;
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  playerRatings: PlayerRating[];
  predictions: PredictionData | null;
}

export default function StatsTab({
  match,
  homeStats,
  awayStats,
  playerRatings,
  predictions,
}: StatsTabProps) {
  const statGroups = useMemo(() => {
    if (!homeStats || !awayStats) return [];
    return [
      {
        title: 'Attack',
        stats: [
          { label: 'Shots', home: homeStats.shots_total ?? 0, away: awayStats.shots_total ?? 0 },
          { label: 'Shots on target', home: homeStats.shots_on_target ?? 0, away: awayStats.shots_on_target ?? 0 },
          { label: 'Shots off target', home: homeStats.shots_off_target ?? 0, away: awayStats.shots_off_target ?? 0 },
          { label: 'Corners', home: homeStats.corners ?? 0, away: awayStats.corners ?? 0 },
          { label: 'Offsides', home: homeStats.offsides ?? 0, away: awayStats.offsides ?? 0 },
        ],
      },
      {
        title: 'Distribution',
        stats: [
          { label: 'Possession', home: homeStats.possession ?? 0, away: awayStats.possession ?? 0, pct: true },
          { label: 'Total passes', home: homeStats.passes_total ?? 0, away: awayStats.passes_total ?? 0 },
          { label: 'Accurate passes', home: homeStats.passes_accurate ?? 0, away: awayStats.passes_accurate ?? 0 },
          { label: 'Expected goals (xG)', home: homeStats.expected_goals ?? 0, away: awayStats.expected_goals ?? 0 },
        ],
      },
      {
        title: 'Defence',
        stats: [
          { label: 'Fouls', home: homeStats.fouls ?? 0, away: awayStats.fouls ?? 0 },
          { label: 'Yellow cards', home: homeStats.yellow_cards ?? 0, away: awayStats.yellow_cards ?? 0 },
          { label: 'Red cards', home: homeStats.red_cards ?? 0, away: awayStats.red_cards ?? 0 },
          { label: 'Saves', home: homeStats.saves ?? 0, away: awayStats.saves ?? 0 },
        ],
      },
    ];
  }, [homeStats, awayStats]);

  /* split player ratings */
  const homeRatings = useMemo(
    () =>
      playerRatings
        .filter((p) => p.teamId === match.home_api_id)
        .sort((a, b) => parseFloat(b.rating ?? '0') - parseFloat(a.rating ?? '0')),
    [playerRatings, match.home_api_id],
  );
  const awayRatings = useMemo(
    () =>
      playerRatings
        .filter((p) => p.teamId === match.away_api_id)
        .sort((a, b) => parseFloat(b.rating ?? '0') - parseFloat(a.rating ?? '0')),
    [playerRatings, match.away_api_id],
  );

  if (!homeStats && !awayStats && playerRatings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <BarChart3 className="h-8 w-8" />
        <p className="text-sm">Statistics not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- Team Key Header ---- */}
      {statGroups.length > 0 && (
        <div className="rounded-lg bg-zinc-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-yellow-400" />
              <span className="text-sm font-semibold text-zinc-200">{match.home_name}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Key</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">{match.away_name}</span>
              <span className="inline-block h-3 w-3 rounded-sm bg-zinc-500" />
            </div>
          </div>
        </div>
      )}

      {/* ---- Grouped Stats ---- */}
      {statGroups.map((group) => (
        <div key={group.title}>
          <SectionHeader title={group.title} />
          <div className="rounded-b-lg bg-zinc-900 px-4 divide-y divide-zinc-800">
            {group.stats.map((s) => (
              <StatRow
                key={s.label}
                label={s.label}
                homeValue={s.home}
                awayValue={s.away}
                isPercentage={s.pct}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ---- Player Ratings ---- */}
      {(homeRatings.length > 0 || awayRatings.length > 0) && (
        <section className="rounded-lg bg-zinc-800 p-4 mt-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <Star className="h-4 w-4" />
            Player Ratings
          </h3>

          {[
            { label: match.home_name, ratings: homeRatings },
            { label: match.away_name, ratings: awayRatings },
          ].map(
            ({ label, ratings }) =>
              ratings.length > 0 && (
                <div key={label} className="mb-6 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>

                  {/* table header */}
                  <div className="mb-1 grid grid-cols-[1fr_40px_48px_36px_36px_36px_40px_40px] gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    <span>Player</span>
                    <span className="text-center">Pos</span>
                    <span className="text-center">Rating</span>
                    <span className="text-center">G</span>
                    <span className="text-center">A</span>
                    <span className="text-center">Sh</span>
                    <span className="text-center">Pas</span>
                    <span className="text-center">Tkl</span>
                  </div>

                  <div className="space-y-0.5">
                    {ratings.map((p) => {
                      const r = parseFloat(p.rating ?? '0');
                      return (
                        <div
                          key={p.name + p.teamId}
                          className="grid grid-cols-[1fr_40px_48px_36px_36px_36px_40px_40px] gap-1 rounded-lg px-1 py-1 text-xs hover:bg-zinc-700/40"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {p.photo && (
                              <Image
                                src={p.photo}
                                alt={p.name}
                                width={20}
                                height={20}
                                className="rounded-full"
                              />
                            )}
                            <span className="truncate text-zinc-200">{p.name}</span>
                          </div>
                          <span className="text-center text-zinc-500">{p.position}</span>
                          <span className={`text-center font-bold ${ratingColor(r)} ${ratingBg(r)} rounded`}>
                            {p.rating ?? '-'}
                          </span>
                          <span className="text-center text-zinc-400">{p.goals ?? '-'}</span>
                          <span className="text-center text-zinc-400">{p.assists ?? '-'}</span>
                          <span className="text-center text-zinc-400">{p.shots ?? '-'}</span>
                          <span className="text-center text-zinc-400">{p.passes ?? '-'}</span>
                          <span className="text-center text-zinc-400">{p.tackles ?? '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
          )}
        </section>
      )}
    </div>
  );
}
