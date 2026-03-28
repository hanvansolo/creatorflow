// @ts-nocheck
'use client';

import { useMemo } from 'react';
import {
  ArrowRightLeft,
  RectangleVertical,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import type { MatchDetail, MatchEvent } from '@/components/match/types';

/* ---------- helpers ---------- */

function playerName(evt: MatchEvent): string {
  return (
    evt.player_known_as ||
    [evt.player_first_name, evt.player_last_name].filter(Boolean).join(' ') ||
    evt.club_name ||
    'Goal'
  );
}

function secondPlayerName(evt: MatchEvent): string | null {
  const name =
    evt.second_player_known_as ||
    [evt.second_player_first_name, evt.second_player_last_name]
      .filter(Boolean)
      .join(' ');
  return name || null;
}

function minuteLabel(evt: MatchEvent): string {
  return `${evt.minute}'${evt.added_time ? `+${evt.added_time}` : ''}`;
}

/* ---------- event styling ---------- */

function eventStyles(type: string) {
  const t = type?.toLowerCase() ?? '';
  if (t.includes('goal') || t === 'penalty')
    return {
      bg: 'bg-emerald-900/40 border-emerald-700/40',
      icon: <span className="text-lg">{'\u26BD'}</span>,
      highlight: true,
    };
  if (t === 'yellow card')
    return {
      bg: 'bg-yellow-900/20 border-yellow-800/30',
      icon: (
        <RectangleVertical className="h-4 w-4 animate-pulse fill-yellow-400 text-yellow-400" />
      ),
      highlight: false,
    };
  if (t === 'red card')
    return {
      bg: 'bg-red-900/20 border-red-800/30',
      icon: (
        <span className="relative">
          <RectangleVertical className="h-4 w-4 animate-ping fill-red-500 text-red-500 absolute inset-0 opacity-40" />
          <RectangleVertical className="h-4 w-4 fill-red-500 text-red-500 relative" />
        </span>
      ),
      highlight: false,
    };
  if (t === 'yellowred' || t === 'second yellow')
    return {
      bg: 'bg-orange-900/20 border-orange-800/30',
      icon: (
        <span className="relative flex items-center justify-center">
          <span className="absolute h-5 w-5 rounded-full ring-2 ring-red-500" />
          <RectangleVertical className="h-4 w-4 fill-yellow-400 text-yellow-400 relative" />
        </span>
      ),
      highlight: false,
    };
  if (t.includes('subst'))
    return {
      bg: 'bg-zinc-800/60 border-zinc-700/40',
      icon: <ArrowRightLeft className="h-4 w-4 text-sky-400" />,
      highlight: false,
    };
  if (t.includes('var'))
    return {
      bg: 'bg-blue-900/20 border-blue-800/30',
      icon: (
        <span className="rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white">
          VAR
        </span>
      ),
      highlight: false,
    };
  return {
    bg: 'bg-zinc-800/40 border-zinc-700/30',
    icon: <ShieldCheck className="h-4 w-4 text-zinc-500" />,
    highlight: false,
  };
}

/* ---------- component ---------- */

interface TimelineTabProps {
  match: MatchDetail;
  events: MatchEvent[];
}

export default function TimelineTab({ match, events }: TimelineTabProps) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.minute - b.minute),
    [events],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <Clock className="h-8 w-8" />
        <p className="text-sm">No events recorded</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl py-4">
      {/* center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-zinc-700/60" />

      <div className="space-y-4">
        {sorted.map((evt, i) => {
          const isHome =
            evt.is_home ?? evt.club_name === match.home_name;
          const styles = eventStyles(evt.event_type);
          const second = secondPlayerName(evt);

          return (
            <div
              key={evt.id ?? i}
              className={`relative flex items-start ${
                isHome ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* event card */}
              <div
                className={`w-[44%] rounded-lg border p-3 ${styles.bg} ${
                  styles.highlight ? 'shadow-lg shadow-emerald-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {styles.icon}
                  <span
                    className={`font-semibold ${
                      styles.highlight
                        ? 'text-base text-emerald-300'
                        : 'text-sm text-zinc-200'
                    }`}
                  >
                    {playerName(evt)}
                  </span>
                </div>
                {second && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {evt.event_type?.toLowerCase().includes('subst')
                      ? `\u2B05 ${second}`
                      : second}
                  </p>
                )}
                {evt.description && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {evt.description}
                  </p>
                )}
              </div>

              {/* minute badge centered on line */}
              <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center justify-center">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-2 ring-zinc-700">
                  {minuteLabel(evt)}
                </span>
              </div>

              {/* spacer for opposite side */}
              <div className="w-[44%]" />
              {/* gap between card and center */}
              <div className="w-[12%]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
