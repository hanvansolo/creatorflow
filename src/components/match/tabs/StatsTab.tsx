// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { BarChart3, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import type {
  MatchDetail,
  TeamStats,
  PlayerRating,
  PredictionData,
} from '@/components/match/types';

/* ---------- StatBar ---------- */

function StatBar({
  label,
  homeValue,
  awayValue,
  homeColor,
  awayColor,
  isPercentage = false,
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  homeColor: string;
  awayColor: string;
  isPercentage?: boolean;
}) {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPct = total > 0 ? (awayValue / total) * 100 : 50;

  const fmt = (v: number) =>
    isPercentage ? `${v}%` : Number.isInteger(v) ? String(v) : v.toFixed(1);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="font-medium text-zinc-200">{fmt(homeValue)}</span>
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-medium text-zinc-200">{fmt(awayValue)}</span>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        <div
          className="rounded-l-full transition-all duration-700"
          style={{ width: `${homePct}%`, backgroundColor: homeColor }}
        />
        <div
          className="rounded-r-full transition-all duration-700"
          style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
        />
      </div>
    </div>
  );
}

/* ---------- rating color ---------- */

function ratingColor(rating: number): string {
  if (rating >= 7.5) return 'text-emerald-400';
  if (rating >= 6.5) return 'text-amber-400';
  return 'text-red-400';
}

function ratingBg(rating: number): string {
  if (rating >= 7.5) return 'bg-emerald-900/30';
  if (rating >= 6.5) return 'bg-amber-900/30';
  return 'bg-red-900/30';
}

/* ---------- form badge ---------- */

function FormBadge({ result }: { result: string }) {
  const r = result.toUpperCase();
  let classes = 'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ';
  if (r === 'W') classes += 'bg-emerald-600 text-white';
  else if (r === 'D') classes += 'bg-zinc-600 text-zinc-200';
  else classes += 'bg-red-600 text-white';
  return <span className={classes}>{r}</span>;
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
  const homeColor = match.home_color || '#10b981';
  const awayColor = match.away_color || '#3b82f6';

  const allStats = useMemo(() => {
    if (!homeStats || !awayStats) return [];
    return [
      { label: 'Possession', home: homeStats.possession ?? 0, away: awayStats.possession ?? 0, pct: true },
      { label: 'Shots Total', home: homeStats.shots_total ?? 0, away: awayStats.shots_total ?? 0 },
      { label: 'Shots on Target', home: homeStats.shots_on_target ?? 0, away: awayStats.shots_on_target ?? 0 },
      { label: 'Shots off Target', home: homeStats.shots_off_target ?? 0, away: awayStats.shots_off_target ?? 0 },
      { label: 'xG', home: homeStats.expected_goals ?? 0, away: awayStats.expected_goals ?? 0 },
      { label: 'Corners', home: homeStats.corners ?? 0, away: awayStats.corners ?? 0 },
      { label: 'Fouls', home: homeStats.fouls ?? 0, away: awayStats.fouls ?? 0 },
      { label: 'Offsides', home: homeStats.offsides ?? 0, away: awayStats.offsides ?? 0 },
      { label: 'Yellow Cards', home: homeStats.yellow_cards ?? 0, away: awayStats.yellow_cards ?? 0 },
      { label: 'Red Cards', home: homeStats.red_cards ?? 0, away: awayStats.red_cards ?? 0 },
      { label: 'Saves', home: homeStats.saves ?? 0, away: awayStats.saves ?? 0 },
      { label: 'Total Passes', home: homeStats.passes_total ?? 0, away: awayStats.passes_total ?? 0 },
      { label: 'Accurate Passes', home: homeStats.passes_accurate ?? 0, away: awayStats.passes_accurate ?? 0 },
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

  /* form data */
  const homeForm = predictions?.teams?.home?.last_5?.form?.split('') ?? [];
  const awayForm = predictions?.teams?.away?.last_5?.form?.split('') ?? [];
  const comparison = predictions?.comparison ?? {};

  if (!homeStats && !awayStats && playerRatings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <BarChart3 className="h-8 w-8" />
        <p className="text-sm">Statistics not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- All Stats ---- */}
      {allStats.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Match Statistics
          </h3>
          <div className="space-y-4">
            {allStats.map((s) => (
              <StatBar
                key={s.label}
                label={s.label}
                homeValue={s.home}
                awayValue={s.away}
                homeColor={homeColor}
                awayColor={awayColor}
                isPercentage={s.pct}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Player Ratings ---- */}
      {(homeRatings.length > 0 || awayRatings.length > 0) && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Star className="h-4 w-4 text-emerald-400" />
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
                          className="grid grid-cols-[1fr_40px_48px_36px_36px_36px_40px_40px] gap-1 rounded-lg px-1 py-1 text-xs hover:bg-zinc-800/40"
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
                            <span className="truncate text-zinc-200">
                              {p.name}
                            </span>
                          </div>
                          <span className="text-center text-zinc-500">
                            {p.position}
                          </span>
                          <span
                            className={`text-center font-bold ${ratingColor(r)} ${ratingBg(r)} rounded`}
                          >
                            {p.rating ?? '-'}
                          </span>
                          <span className="text-center text-zinc-400">
                            {p.goals ?? '-'}
                          </span>
                          <span className="text-center text-zinc-400">
                            {p.assists ?? '-'}
                          </span>
                          <span className="text-center text-zinc-400">
                            {p.shots ?? '-'}
                          </span>
                          <span className="text-center text-zinc-400">
                            {p.passes ?? '-'}
                          </span>
                          <span className="text-center text-zinc-400">
                            {p.tackles ?? '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
          )}
        </section>
      )}

      {/* ---- Form Comparison ---- */}
      {predictions && (homeForm.length > 0 || awayForm.length > 0) && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Form Comparison
          </h3>

          {/* last 5 form */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {[
              { team: match.home_name, form: homeForm },
              { team: match.away_name, form: awayForm },
            ].map(({ team, form }) => (
              <div key={team}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {team} — Last 5
                </p>
                <div className="flex gap-1.5">
                  {form.map((r, i) => (
                    <FormBadge key={i} result={r} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* radar-style comparison bars */}
          {Object.keys(comparison).length > 0 && (
            <div className="space-y-3">
              {Object.entries(comparison).map(([key, val]) => {
                const hNum = parseInt(val.home) || 0;
                const aNum = parseInt(val.away) || 0;
                return (
                  <StatBar
                    key={key}
                    label={key.replace(/_/g, ' ')}
                    homeValue={hNum}
                    awayValue={aNum}
                    homeColor={homeColor}
                    awayColor={awayColor}
                    isPercentage={true}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
