// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { MatchDetail, MatchEvent } from '@/components/match/types';

/* ---------- helpers ---------- */

function playerName(evt: MatchEvent): string {
  return (
    evt.player_known_as ||
    [evt.player_first_name, evt.player_last_name].filter(Boolean).join(' ') ||
    evt.club_name ||
    'Unknown'
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

/* ---------- event rendering ---------- */

function eventDescription(evt: MatchEvent, match: MatchDetail): string {
  const t = evt.event_type?.toLowerCase() ?? '';
  const name = playerName(evt);
  const second = secondPlayerName(evt);
  const isHome = evt.is_home ?? evt.club_name === match.home_name;
  const team = isHome ? match.home_name : match.away_name;

  if (t.includes('goal') || t === 'penalty_scored') {
    const assist = second ? ` Assisted by ${second}.` : '';
    const suffix = t === 'own_goal' ? ' (Own Goal)' : t === 'penalty_scored' ? ' (Penalty)' : '';
    return `GOAL! ${name} scores for ${team}${suffix}.${assist}`;
  }
  if (t === 'yellow_card' || t === 'yellow card') {
    return `${name} (${team}) receives a yellow card.`;
  }
  if (t === 'red_card' || t === 'red card') {
    return `${name} (${team}) is shown a red card!`;
  }
  if (t === 'second_yellow' || t === 'yellowred' || t === 'second yellow') {
    return `${name} (${team}) receives a second yellow card and is sent off!`;
  }
  if (t.includes('subst') || t === 'substitution') {
    return `Substitution for ${team}: ${second ? `${second} replaces ${name}` : `${name} comes off`}.`;
  }
  if (t.includes('var')) {
    return `VAR Review: ${evt.description || name}`;
  }
  return evt.description || `${name} — ${evt.event_type}`;
}

function isGoal(type: string): boolean {
  const t = type?.toLowerCase() ?? '';
  return t.includes('goal') || t === 'penalty_scored' || t === 'penalty scored';
}

function isCard(type: string): boolean {
  const t = type?.toLowerCase() ?? '';
  return t === 'yellow_card' || t === 'yellow card' || t === 'red_card' || t === 'red card' || t === 'second_yellow' || t === 'yellowred' || t === 'second yellow';
}

/* ---------- component ---------- */

interface TimelineTabProps {
  match: MatchDetail;
  events: MatchEvent[];
}

export default function TimelineTab({ match, events }: TimelineTabProps) {
  // Sort DESCENDING (newest first, like BBC Live Text)
  const sorted = useMemo(
    () => [...events].sort((a, b) => {
      const minDiff = b.minute - a.minute;
      if (minDiff !== 0) return minDiff;
      return (b.added_time ?? 0) - (a.added_time ?? 0);
    }),
    [events],
  );

  // Determine "live" minute for NEW badge
  const currentMinute = match.minute ?? 0;

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <Clock className="h-8 w-8" />
        <p className="text-sm">No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((evt, i) => {
        const goal = isGoal(evt.event_type);
        const card = isCard(evt.event_type);
        const isRecent = currentMinute > 0 && evt.minute >= currentMinute - 2;

        return (
          <div
            key={evt.id ?? i}
            className={`relative rounded-lg bg-zinc-800 border-t-2 ${
              goal ? 'border-yellow-400' : card ? 'border-red-500' : 'border-zinc-700'
            } p-4`}
          >
            {/* Minute badge + optional NEW */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-yellow-400 text-black font-bold px-2 py-0.5 text-sm rounded">
                {minuteLabel(evt)}
              </span>
              {isRecent && (
                <span className="inline-block bg-cyan-500 text-black font-bold px-1.5 py-0.5 text-[10px] rounded uppercase">
                  New
                </span>
              )}
              {goal && <span className="text-lg">⚽</span>}
            </div>

            {/* Event text */}
            <p className={`leading-relaxed ${goal ? 'text-base font-semibold text-white' : 'text-sm text-zinc-300'}`}>
              {eventDescription(evt, match)}
            </p>

            {/* Extra description if present and not already used */}
            {evt.description && !isGoal(evt.event_type) && !evt.event_type?.toLowerCase().includes('subst') && !evt.event_type?.toLowerCase().includes('var') && (
              <p className="mt-1 text-xs text-zinc-500">{evt.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
