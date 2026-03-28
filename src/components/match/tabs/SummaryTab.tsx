// @ts-nocheck
'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
} from 'lucide-react';
import Image from 'next/image';
import type {
  MatchDetail,
  MatchEvent,
  TeamStats,
  MatchAnalysisRow,
  InjuryData,
  PredictionData,
} from '@/components/match/types';

/* ---------- BBC-style center-out StatBar ---------- */

function StatBar({
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-bold tabular-nums ${homeHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {fmt(homeValue)}
        </span>
        <span className="text-xs uppercase tracking-wider text-zinc-400">{label}</span>
        <span className={`font-bold tabular-nums ${awayHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {fmt(awayValue)}
        </span>
      </div>
      <div className="flex h-2 gap-0.5">
        {/* Home bar grows from right (center) to left */}
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-l bg-yellow-400 transition-all duration-700"
            style={{ width: `${homePct}%` }}
          />
        </div>
        {/* Away bar grows from left (center) to right */}
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

/* ---------- component ---------- */

interface SummaryTabProps {
  match: MatchDetail;
  events: MatchEvent[];
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  latestAnalysis: MatchAnalysisRow | null;
  injuries: InjuryData[];
  predictions: PredictionData | null;
}

export default function SummaryTab({
  match,
  events,
  homeStats,
  awayStats,
  latestAnalysis,
  injuries,
  predictions,
}: SummaryTabProps) {
  const homeInjuries = useMemo(
    () => injuries.filter((i) => i.team.id === match.home_api_id),
    [injuries, match.home_api_id],
  );
  const awayInjuries = useMemo(
    () => injuries.filter((i) => i.team.id === match.away_api_id),
    [injuries, match.away_api_id],
  );

  const isFinished =
    match.status === 'FT' ||
    match.status === 'AET' ||
    match.status === 'PEN' ||
    match.status === 'finished';

  /* Quick stats — top 4 */
  const quickStats = useMemo(() => {
    if (!homeStats || !awayStats) return [];
    return [
      { label: 'Possession', home: homeStats.possession ?? 0, away: awayStats.possession ?? 0, pct: true },
      { label: 'Shots', home: homeStats.shots_total ?? 0, away: awayStats.shots_total ?? 0 },
      { label: 'Shots on Target', home: homeStats.shots_on_target ?? 0, away: awayStats.shots_on_target ?? 0 },
      { label: 'Corners', home: homeStats.corners ?? 0, away: awayStats.corners ?? 0 },
    ];
  }, [homeStats, awayStats]);

  return (
    <div className="space-y-4">
      {/* ---- Quick Stats ---- */}
      {quickStats.length > 0 && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Quick Stats
          </h3>
          <div className="space-y-4">
            {quickStats.map((s) => (
              <StatBar
                key={s.label}
                label={s.label}
                homeValue={s.home}
                awayValue={s.away}
                isPercentage={s.pct}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- AI Prediction ---- */}
      {latestAnalysis && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <Brain className="h-4 w-4" />
            AI Prediction
          </h3>

          {/* probability bars — data is in prediction JSON field */}
          {(() => {
            const pred = latestAnalysis.prediction || {};
            const homeWin = pred.homeWinPct ?? latestAnalysis.home_win ?? 0;
            const draw = pred.drawPct ?? latestAnalysis.draw ?? 0;
            const awayWin = pred.awayWinPct ?? latestAnalysis.away_win ?? 0;
            const confidence = pred.confidence ?? latestAnalysis.confidence ?? 0;
            return (
              <>
                <div className="mb-4 space-y-2.5">
                  {[
                    { label: match.home_name, value: homeWin, accent: true },
                    { label: 'Draw', value: draw, accent: false },
                    { label: match.away_name, value: awayWin, accent: false },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300">{row.label}</span>
                        <span className="font-bold text-zinc-200">
                          {row.value > 0 ? `${row.value}%` : '-'}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded bg-zinc-700">
                        <div
                          className={`h-full rounded transition-all duration-700 ${
                            row.accent ? 'bg-yellow-400' : 'bg-zinc-500'
                          }`}
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* key insight */}
                {latestAnalysis.key_insight && (
                  <p className="mb-3 rounded-lg bg-zinc-900/60 px-3 py-2 text-sm italic text-zinc-300">
                    &ldquo;{latestAnalysis.key_insight}&rdquo;
                  </p>
                )}

                {/* confidence + momentum */}
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  {confidence > 0 && (
                    <span className="flex items-center gap-1">
                      Confidence:{' '}
                      <span className="font-bold text-yellow-400">
                        {confidence}%
                      </span>
                    </span>
                  )}
              </>
            );
          })()}
            {latestAnalysis.momentum && (
              <span className="flex items-center gap-1">
                Momentum:{' '}
                {latestAnalysis.momentum === 'home' && (
                  <TrendingUp className="h-3.5 w-3.5 text-yellow-400" />
                )}
                {latestAnalysis.momentum === 'away' && (
                  <TrendingDown className="h-3.5 w-3.5 text-zinc-400" />
                )}
                {latestAnalysis.momentum === 'neutral' && (
                  <Minus className="h-3.5 w-3.5 text-zinc-500" />
                )}
                <span className="capitalize text-zinc-200">
                  {latestAnalysis.momentum}
                </span>
              </span>
            )}
          </div>
        </section>
      )}

      {/* ---- Injuries ---- */}
      {(homeInjuries.length > 0 || awayInjuries.length > 0) && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Injuries
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { team: match.home_name, list: homeInjuries },
              { team: match.away_name, list: awayInjuries },
            ].map(
              ({ team, list }) =>
                list.length > 0 && (
                  <div key={team}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {team}
                    </p>
                    <ul className="space-y-1.5">
                      {list.map((inj) => (
                        <li key={inj.player.id} className="flex items-center gap-2">
                          {inj.player.photo && (
                            <Image
                              src={inj.player.photo}
                              alt={inj.player.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <span className="text-sm text-zinc-200">{inj.player.name}</span>
                          <span className="ml-auto text-[10px] text-zinc-500">{inj.player.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )}
          </div>
        </section>
      )}

      {/* ---- Post-Match Summary ---- */}
      {isFinished && latestAnalysis?.analysis && (
        <section className="rounded-lg border-l-4 border-yellow-400 bg-zinc-800 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Post-Match Analysis
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {latestAnalysis.analysis}
          </p>
        </section>
      )}
    </div>
  );
}
