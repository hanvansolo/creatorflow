// @ts-nocheck
'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Shield,
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

/* ---------- inline StatBar ---------- */

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

/* ---------- helpers ---------- */

function playerName(evt: MatchEvent): string {
  return (
    evt.player_known_as ||
    [evt.player_first_name, evt.player_last_name].filter(Boolean).join(' ') ||
    evt.club_name ||
    'Goal'
  );
}

function eventIcon(type: string): string {
  switch (type) {
    case 'Goal':
      return '\u26BD';
    case 'Penalty':
      return '\uD83C\uDFAF';
    case 'Red Card':
      return '\uD83D\uDFE5';
    default:
      return '\u26BD';
  }
}

function isKeyEvent(evt: MatchEvent): boolean {
  const t = evt.event_type?.toLowerCase() ?? '';
  return (
    t.includes('goal') ||
    t === 'red card' ||
    t === 'penalty' ||
    t.includes('own goal')
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
  const homeColor = match.home_color || '#10b981';
  const awayColor = match.away_color || '#3b82f6';

  const keyEvents = useMemo(
    () =>
      events
        .filter(isKeyEvent)
        .sort((a, b) => a.minute - b.minute),
    [events],
  );

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
    match.status === 'PEN';

  /* quick stats data */
  const quickStats = useMemo(() => {
    if (!homeStats || !awayStats) return [];
    return [
      {
        label: 'Possession',
        home: homeStats.possession ?? 0,
        away: awayStats.possession ?? 0,
        pct: true,
      },
      {
        label: 'Shots on Target',
        home: homeStats.shots_on_target ?? 0,
        away: awayStats.shots_on_target ?? 0,
      },
      {
        label: 'xG',
        home: homeStats.expected_goals ?? 0,
        away: awayStats.expected_goals ?? 0,
      },
      {
        label: 'Corners',
        home: homeStats.corners ?? 0,
        away: awayStats.corners ?? 0,
      },
      {
        label: 'Passes',
        home: homeStats.passes_total ?? 0,
        away: awayStats.passes_total ?? 0,
      },
    ];
  }, [homeStats, awayStats]);

  return (
    <div className="space-y-6">
      {/* ---- Key Events ---- */}
      {keyEvents.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Activity className="h-4 w-4 text-emerald-400" />
            Key Events
          </h3>
          <div className="space-y-2">
            {keyEvents.map((evt, i) => {
              const isHome =
                evt.is_home ??
                evt.club_name === match.home_name;
              return (
                <div
                  key={evt.id ?? i}
                  className={`flex items-center gap-3 ${
                    isHome ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <span
                    className={`shrink-0 text-xs font-bold ${
                      isHome ? 'text-right' : 'text-left'
                    } w-full max-w-[40%] truncate text-zinc-200`}
                  >
                    {playerName(evt)}
                  </span>
                  <span className="shrink-0 text-base">
                    {eventIcon(evt.event_type)}
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    {evt.minute}&apos;
                    {evt.added_time ? `+${evt.added_time}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Quick Stats ---- */}
      {quickStats.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Shield className="h-4 w-4 text-emerald-400" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            {quickStats.map((s) => (
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

      {/* ---- AI Prediction ---- */}
      {latestAnalysis && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Brain className="h-4 w-4 text-emerald-400" />
            AI Prediction
          </h3>

          {/* probability bars */}
          <div className="mb-4 space-y-2">
            {[
              {
                label: match.home_name,
                value: latestAnalysis.home_win,
                color: 'bg-emerald-500',
              },
              {
                label: 'Draw',
                value: latestAnalysis.draw,
                color: 'bg-zinc-500',
              },
              {
                label: match.away_name,
                value: latestAnalysis.away_win,
                color: 'bg-blue-500',
              },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{row.label}</span>
                  <span className="font-bold text-zinc-200">
                    {row.value != null ? `${row.value}%` : '-'}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                    style={{ width: `${row.value ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* key insight */}
          {latestAnalysis.key_insight && (
            <p className="mb-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm italic text-zinc-300">
              &ldquo;{latestAnalysis.key_insight}&rdquo;
            </p>
          )}

          {/* confidence + momentum */}
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            {latestAnalysis.confidence != null && (
              <span className="flex items-center gap-1">
                Confidence:{' '}
                <span className="font-bold text-emerald-400">
                  {latestAnalysis.confidence}%
                </span>
              </span>
            )}
            {latestAnalysis.momentum && (
              <span className="flex items-center gap-1">
                Momentum:{' '}
                {latestAnalysis.momentum === 'home' && (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                )}
                {latestAnalysis.momentum === 'away' && (
                  <TrendingDown className="h-3.5 w-3.5 text-blue-400" />
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
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
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
                        <li
                          key={inj.player.id}
                          className="flex items-center gap-2"
                        >
                          {inj.player.photo && (
                            <Image
                              src={inj.player.photo}
                              alt={inj.player.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <span className="text-sm text-zinc-200">
                            {inj.player.name}
                          </span>
                          <span className="ml-auto text-[10px] text-zinc-500">
                            {inj.player.reason}
                          </span>
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
        <section className="rounded-xl border border-emerald-900/40 bg-zinc-900/80 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
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
