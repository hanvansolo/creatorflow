'use client';

import { useMemo } from 'react';
import type { MatchDetail, MatchEvent, TeamStats } from '@/components/match/types';

interface MomentumTimelineProps {
  match: MatchDetail;
  events: MatchEvent[];
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
}

/* Helpers */
function playerName(e: MatchEvent): string {
  return (
    e.player_known_as ||
    [e.player_first_name, e.player_last_name].filter(Boolean).join(' ') ||
    'Unknown'
  );
}

function secondPlayerName(e: MatchEvent): string {
  return (
    e.second_player_known_as ||
    [e.second_player_first_name, e.second_player_last_name].filter(Boolean).join(' ') ||
    ''
  );
}

function eventMinuteLabel(e: MatchEvent): string {
  return e.added_time ? `${e.minute}'+${e.added_time}` : `${e.minute}'`;
}

const TIME_MARKERS = [0, 15, 30, 45, 60, 75, 90];

type EventCategory = 'goal' | 'yellow' | 'red' | 'sub' | 'other';

function categorize(type: string): EventCategory {
  if (['goal', 'own_goal', 'penalty_scored'].includes(type)) return 'goal';
  if (type === 'yellow_card') return 'yellow';
  if (type === 'red_card') return 'red';
  if (type === 'substitution') return 'sub';
  return 'other';
}

function eventIcon(cat: EventCategory): string {
  switch (cat) {
    case 'goal':
      return '\u26BD';
    case 'yellow':
      return '\uD83D\uDFE8';
    case 'red':
      return '\uD83D\uDFE5';
    case 'sub':
      return '\uD83D\uDD04';
    default:
      return '\u25CF';
  }
}

function dotColor(cat: EventCategory): string {
  switch (cat) {
    case 'goal':
      return 'bg-emerald-400';
    case 'yellow':
      return 'bg-yellow-400';
    case 'red':
      return 'bg-red-500';
    case 'sub':
      return 'bg-blue-400';
    default:
      return 'bg-zinc-400';
  }
}

function dotSize(cat: EventCategory): string {
  return cat === 'sub' ? 'h-2 w-2' : 'h-3 w-3';
}

export default function MomentumTimeline({
  match,
  events,
  homeStats,
  awayStats,
}: MomentumTimelineProps) {
  const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(
    match.status,
  );

  /* Max minute for timeline scale (handle extra time) */
  const maxMinute = useMemo(() => {
    const eventMax = events.reduce(
      (m, e) => Math.max(m, e.minute + (e.added_time ?? 0)),
      0,
    );
    return Math.max(90, eventMax, match.minute ?? 0);
  }, [events, match.minute]);

  /* Determine home/away for each event */
  const classifiedEvents = useMemo(() => {
    return events
      .filter((e) => categorize(e.event_type) !== 'other')
      .map((e) => {
        const isHome =
          e.is_home ?? (e.club_name ? e.club_name === match.home_name : false);
        return { ...e, isHome, category: categorize(e.event_type) };
      })
      .sort((a, b) => a.minute - b.minute);
  }, [events, match.home_name]);

  /* Significant events for the key-moments list */
  const keyMoments = useMemo(() => {
    return classifiedEvents.filter((e) =>
      ['goal', 'yellow', 'red', 'sub'].includes(e.category),
    );
  }, [classifiedEvents]);

  const homePossession = homeStats?.possession ?? 50;
  const awayPossession = awayStats?.possession ?? 50;

  function pctPosition(
    minute: number,
    addedTime?: number | null,
  ): number {
    const total = minute + (addedTime ?? 0);
    return Math.min((total / maxMinute) * 100, 100);
  }

  return (
    <section className="rounded-lg bg-zinc-800 p-4">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
        Match Timeline
      </h3>

      {/* ---- Horizontal Timeline ---- */}
      <div className="overflow-x-auto pb-2">
        <div className="relative min-w-[480px]">
          {/* Home events (above line) */}
          <div className="relative h-10 mb-1">
            {classifiedEvents
              .filter((e) => e.isHome)
              .map((e, i) => (
                <div
                  key={`home-${e.id ?? i}`}
                  className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center group"
                  style={{
                    left: `${pctPosition(e.minute, e.added_time)}%`,
                  }}
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full mb-1 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200 shadow-lg z-10">
                    {eventMinuteLabel(e)} {playerName(e)}
                  </div>
                  <div
                    className={`rounded-full ${dotColor(e.category)} ${dotSize(e.category)} ring-2 ring-zinc-800`}
                  />
                </div>
              ))}
          </div>

          {/* Timeline track */}
          <div className="relative h-2 rounded-full bg-zinc-900">
            {/* Progress fill for live matches */}
            {isLive && match.minute != null && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-zinc-700 transition-all duration-500"
                style={{ width: `${pctPosition(match.minute)}%` }}
              />
            )}

            {/* Time markers */}
            {TIME_MARKERS.map((m) => (
              <div
                key={m}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${pctPosition(m)}%` }}
              >
                <div
                  className={`h-3 w-px ${m === 45 ? 'bg-zinc-400' : 'bg-zinc-600'}`}
                />
              </div>
            ))}

            {/* HT dashed line */}
            <div
              className="absolute -top-10 h-[calc(100%+5rem)] border-l border-dashed border-zinc-500/40"
              style={{ left: `${pctPosition(45)}%` }}
            />

            {/* Current minute pulsing dot */}
            {isLive && match.minute != null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${pctPosition(match.minute)}%` }}
              >
                <div className="h-3.5 w-3.5 rounded-full bg-yellow-400 ring-2 ring-yellow-400/30 animate-pulse" />
              </div>
            )}
          </div>

          {/* Away events (below line) */}
          <div className="relative h-10 mt-1">
            {classifiedEvents
              .filter((e) => !e.isHome)
              .map((e, i) => (
                <div
                  key={`away-${e.id ?? i}`}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center group"
                  style={{
                    left: `${pctPosition(e.minute, e.added_time)}%`,
                  }}
                >
                  <div
                    className={`rounded-full ${dotColor(e.category)} ${dotSize(e.category)} ring-2 ring-zinc-800`}
                  />
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute top-full mt-1 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200 shadow-lg z-10">
                    {eventMinuteLabel(e)} {playerName(e)}
                  </div>
                </div>
              ))}
          </div>

          {/* Minute labels */}
          <div className="relative h-4 mt-1">
            {TIME_MARKERS.map((m) => (
              <span
                key={m}
                className="absolute -translate-x-1/2 text-[10px] text-zinc-500"
                style={{ left: `${pctPosition(m)}%` }}
              >
                {m === 45 ? 'HT' : m}
              </span>
            ))}
          </div>

          {/* Team labels */}
          <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
            <span>
              {match.home_code || match.home_name} events above
            </span>
            <span>
              {match.away_code || match.away_name} events below
            </span>
          </div>
        </div>
      </div>

      {/* ---- Possession Flow Bar ---- */}
      {(homeStats?.possession != null || awayStats?.possession != null) && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="font-medium text-yellow-400">
              {homePossession}%
            </span>
            <span className="text-[10px] uppercase tracking-wider">
              Possession
            </span>
            <span className="font-medium text-blue-400">
              {awayPossession}%
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-yellow-400 transition-all duration-700 ease-out"
              style={{ width: `${homePossession}%` }}
            />
            <div
              className="bg-blue-400 transition-all duration-700 ease-out"
              style={{ width: `${awayPossession}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
            <span>{match.home_code || match.home_name}</span>
            <span>{match.away_code || match.away_name}</span>
          </div>
        </div>
      )}

      {/* ---- Key Moments Summary ---- */}
      {keyMoments.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Key Moments
          </h4>
          <div className="space-y-1.5">
            {keyMoments.map((e, i) => {
              const cat = e.category;
              const desc = (() => {
                if (cat === 'goal') {
                  const suffix =
                    e.event_type === 'own_goal'
                      ? ' (OG)'
                      : e.event_type === 'penalty_scored'
                        ? ' (Pen)'
                        : '';
                  return `Goal${suffix} for ${e.club_name || (e.isHome ? match.home_name : match.away_name)}`;
                }
                if (cat === 'yellow') return 'Yellow card';
                if (cat === 'red') return 'Red card';
                if (cat === 'sub') {
                  const out = secondPlayerName(e);
                  return out ? `On for ${out}` : 'Substitution';
                }
                return e.description || '';
              })();

              return (
                <div
                  key={`km-${e.id ?? i}`}
                  className="flex items-center gap-2 rounded bg-zinc-900/50 px-2.5 py-1.5"
                >
                  <span className="flex h-6 min-w-[2.5rem] items-center justify-center rounded bg-zinc-700 text-[10px] font-bold text-zinc-200">
                    {eventMinuteLabel(e)}
                  </span>
                  <span className="text-sm">{eventIcon(cat)}</span>
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {playerName(e)}
                  </span>
                  <span className="ml-auto text-[10px] text-zinc-500 truncate max-w-[140px]">
                    {desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
