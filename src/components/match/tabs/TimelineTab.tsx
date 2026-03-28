// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { MatchDetail, MatchEvent } from '@/components/match/types';

function playerName(evt: MatchEvent): string {
  return (
    evt.player_known_as ||
    [evt.player_first_name, evt.player_last_name].filter(Boolean).join(' ') ||
    evt.club_name ||
    'Goal'
  );
}

function secondPlayer(evt: MatchEvent): string | null {
  return evt.second_player_known_as ||
    [evt.second_player_first_name, evt.second_player_last_name].filter(Boolean).join(' ') || null;
}

function minuteLabel(evt: MatchEvent): string {
  return `${evt.minute}'${evt.added_time ? `+${evt.added_time}` : ''}`;
}

function isGoalEvent(t: string): boolean {
  const type = t?.toLowerCase() ?? '';
  return type.includes('goal') || type === 'penalty_scored';
}

function isCardEvent(t: string): boolean {
  const type = t?.toLowerCase() ?? '';
  return type.includes('yellow') || type.includes('red') || type === 'second_yellow';
}

function isSubEvent(t: string): boolean {
  const type = t?.toLowerCase() ?? '';
  return type.includes('subst');
}

function eventIcon(type: string): string {
  const t = type?.toLowerCase() ?? '';
  if (t.includes('goal') || t === 'penalty_scored') return '⚽';
  if (t === 'own_goal') return '⚽';
  if (t === 'yellow_card' || t === 'yellow card') return '🟨';
  if (t === 'red_card' || t === 'red card') return '🟥';
  if (t === 'second_yellow' || t === 'yellowred') return '🟨🟥';
  if (t.includes('subst')) return '🔄';
  if (t.includes('var')) return '📺';
  if (t === 'penalty_missed') return '❌';
  return '•';
}

function eventLabel(evt: MatchEvent): string {
  const t = evt.event_type?.toLowerCase() ?? '';
  if (t === 'own_goal') return 'Own Goal';
  if (t === 'penalty_scored') return 'Penalty';
  if (t === 'penalty_missed') return 'Penalty Missed';
  if (t === 'yellow_card' || t === 'yellow card') return 'Yellow Card';
  if (t === 'red_card' || t === 'red card') return 'Red Card';
  if (t === 'second_yellow' || t === 'yellowred') return 'Second Yellow';
  if (t.includes('subst')) return evt.description || 'Substitution';
  if (t.includes('var')) return 'VAR Decision';
  if (t.includes('goal')) return 'Normal Goal';
  return evt.description || evt.event_type || '';
}

interface TimelineTabProps {
  match: MatchDetail;
  events: MatchEvent[];
}

export default function TimelineTab({ match, events }: TimelineTabProps) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => {
      const minDiff = b.minute - a.minute;
      if (minDiff !== 0) return minDiff;
      return (b.added_time ?? 0) - (a.added_time ?? 0);
    }),
    [events],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <Clock className="h-8 w-8" />
        <p className="text-sm">No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700 -translate-x-1/2" />

      <div className="space-y-4">
        {sorted.map((evt, i) => {
          const isHome = evt.is_home === true || evt.club_id === 'home' || evt.club_name === match.home_name;
          const isGoal = isGoalEvent(evt.event_type);
          const isCard = isCardEvent(evt.event_type);
          const isSub = isSubEvent(evt.event_type);
          const icon = eventIcon(evt.event_type);
          const name = playerName(evt);
          const second = secondPlayer(evt);
          const label = eventLabel(evt);

          return (
            <div
              key={evt.id ?? `${evt.minute}-${evt.event_type}-${i}`}
              className={`relative flex items-start gap-3 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Event card */}
              <div className={`flex-1 ${isHome ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                <div
                  className={`inline-block rounded-lg px-4 py-3 max-w-[90%] ${
                    isGoal
                      ? 'bg-emerald-900/60 border border-emerald-500/30'
                      : isCard
                      ? 'bg-zinc-800 border border-zinc-700/50'
                      : 'bg-zinc-800/60'
                  }`}
                >
                  {/* Player name + icon */}
                  <div className={`flex items-center gap-2 ${isHome ? 'justify-end' : 'justify-start'}`}>
                    {!isHome && <span className="text-lg">{icon}</span>}
                    <span className={`font-semibold ${isGoal ? 'text-white text-base' : 'text-zinc-200 text-sm'}`}>
                      {name}
                    </span>
                    {isHome && <span className="text-lg">{icon}</span>}
                  </div>

                  {/* Assist / second player */}
                  {second && (
                    <p className={`text-xs text-zinc-400 mt-0.5 ${isHome ? 'text-right' : 'text-left'}`}>
                      {isSub ? (
                        <>🔻 <span className="text-zinc-500">{second}</span></>
                      ) : (
                        <>Assist: {second}</>
                      )}
                    </p>
                  )}

                  {/* Event label */}
                  <p className={`text-xs mt-0.5 ${
                    isGoal ? 'text-emerald-400' : isCard ? 'text-yellow-400' : 'text-zinc-500'
                  } ${isHome ? 'text-right' : 'text-left'}`}>
                    {label}
                  </p>
                </div>
              </div>

              {/* Minute badge - centered on the line */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
                  isGoal
                    ? 'bg-emerald-500 text-white'
                    : isCard
                    ? 'bg-yellow-400 text-black'
                    : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {minuteLabel(evt)}
                </span>
              </div>

              {/* Empty space for the other side */}
              <div className="flex-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
