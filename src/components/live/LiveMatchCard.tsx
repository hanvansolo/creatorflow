'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MatchEvent {
  event_type: string;
  minute: number;
  added_time?: number | null;
  player_name?: string | null;
  club_name?: string | null;
}

interface LiveMatch {
  id: string;
  home_name: string;
  away_name: string;
  home_code?: string | null;
  away_code?: string | null;
  home_logo?: string | null;
  away_logo?: string | null;
  home_color?: string | null;
  away_color?: string | null;
  home_score: number;
  away_score: number;
  home_score_ht?: number | null;
  away_score_ht?: number | null;
  status: string;
  minute?: number | null;
}

interface LiveMatchCardProps {
  match: LiveMatch;
  events: MatchEvent[];
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'goal':
      return (
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-emerald-400/40" />
          <span className="relative text-base">⚽</span>
        </span>
      );
    case 'own_goal':
      return (
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-red-400/40" />
          <span className="relative text-base">⚽</span>
        </span>
      );
    case 'penalty_scored':
      return (
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-emerald-400/40" />
          <span className="relative text-base">⚽</span>
        </span>
      );
    case 'penalty_missed':
      return <span className="text-sm text-red-400 font-bold">✗</span>;
    case 'yellow_card':
      return (
        <span className="relative">
          <span className="absolute -inset-1 animate-pulse rounded bg-yellow-400/20" />
          <span className="relative inline-block h-4 w-3 rounded-[2px] bg-yellow-400 shadow-lg shadow-yellow-400/30" />
        </span>
      );
    case 'second_yellow':
      return (
        <span className="relative">
          <span className="absolute -inset-1 animate-pulse rounded bg-red-400/20" />
          <span className="relative inline-block h-4 w-3 rounded-[2px] bg-yellow-400 ring-2 ring-red-500 shadow-lg shadow-red-400/30" />
        </span>
      );
    case 'red_card':
      return (
        <span className="relative">
          <span className="absolute -inset-1.5 animate-ping rounded bg-red-500/30" style={{ animationDuration: '1.5s' }} />
          <span className="relative inline-block h-4 w-3 rounded-[2px] bg-red-500 shadow-lg shadow-red-500/50" />
        </span>
      );
    case 'substitution':
      return <span className="text-xs text-emerald-400">↕</span>;
    case 'var_decision':
      return (
        <span className="relative">
          <span className="absolute -inset-1 animate-pulse rounded bg-blue-400/20" />
          <span className="relative text-[9px] font-black text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/30">VAR</span>
        </span>
      );
    default:
      return <span className="text-zinc-500 text-xs">•</span>;
  }
}

function EventLabel({ event }: { event: MatchEvent }) {
  const name = event.player_name || event.club_name || '';
  const isGoal = ['goal', 'own_goal', 'penalty_scored'].includes(event.event_type);
  const isCard = ['yellow_card', 'second_yellow', 'red_card'].includes(event.event_type);

  return (
    <span className={`text-[11px] leading-tight ${isGoal ? 'font-semibold text-white' : isCard ? 'text-zinc-300' : 'text-zinc-500'}`}>
      {name}
      {event.event_type === 'own_goal' && <span className="text-red-400 ml-0.5">(OG)</span>}
      {event.event_type === 'penalty_scored' && <span className="text-amber-400 ml-0.5">(P)</span>}
      {event.event_type === 'penalty_missed' && <span className="text-red-400 ml-0.5">(Pen missed)</span>}
    </span>
  );
}

export function LiveMatchCard({ match, events }: LiveMatchCardProps) {
  // Pulsing minute counter
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  const isHT = match.status === 'halftime';
  const isET = match.status === 'extra_time';
  const isPEN = match.status === 'penalties';
  const statusText = isHT ? 'HT' : isET ? 'ET' : isPEN ? 'PEN' : `${match.minute || 0}'`;

  // Split events by type for display
  const goals = events.filter(e => ['goal', 'own_goal', 'penalty_scored'].includes(e.event_type));
  const cards = events.filter(e => ['yellow_card', 'second_yellow', 'red_card'].includes(e.event_type));
  const subs = events.filter(e => e.event_type === 'substitution');
  const varEvents = events.filter(e => e.event_type === 'var_decision');
  const significantEvents = [...goals, ...cards.filter(e => e.event_type !== 'yellow_card'), ...varEvents]
    .sort((a, b) => a.minute - b.minute);

  // Most recent event for the "flash" animation
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const isRecentGoal = latestEvent && ['goal', 'own_goal', 'penalty_scored'].includes(latestEvent.event_type);
  const isRecentRed = latestEvent && latestEvent.event_type === 'red_card';

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`block relative overflow-hidden rounded-lg transition-all hover:scale-[1.01] ${
        isRecentGoal
          ? 'ring-2 ring-emerald-500/50 bg-emerald-950/20'
          : isRecentRed
          ? 'ring-2 ring-red-500/50 bg-red-950/20'
          : 'bg-zinc-800/40 hover:bg-zinc-800/60'
      }`}
    >
      {/* Animated border pulse for goals */}
      {isRecentGoal && (
        <div className="absolute inset-0 rounded-lg animate-pulse ring-1 ring-emerald-400/30" style={{ animationDuration: '2s' }} />
      )}

      <div className="relative px-4 py-3">
        {/* Status bar */}
        <div className="flex items-center justify-center mb-2.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            isHT
              ? 'bg-amber-500/15 text-amber-400'
              : isPEN
              ? 'bg-red-500/15 text-red-400'
              : 'bg-emerald-500/15 text-emerald-400'
          }`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHT ? 'bg-amber-400' : isPEN ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-ping'
              }`} style={{ animationDuration: '1.5s' }} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                isHT ? 'bg-amber-400' : isPEN ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
            </span>
            {statusText}
          </span>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center justify-center gap-3">
          {/* Home */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span className="text-sm font-semibold text-white text-right truncate">
              <span className="hidden sm:inline">{match.home_name}</span>
              <span className="sm:hidden">{match.home_code || match.home_name?.slice(0, 3).toUpperCase()}</span>
            </span>
            {match.home_logo ? (
              <Image src={match.home_logo} alt="" width={32} height={32} className="h-8 w-8 object-contain shrink-0" />
            ) : (
              <span className="h-6 w-6 rounded-full shrink-0" style={{ backgroundColor: match.home_color || '#52525b' }} />
            )}
          </div>

          {/* Score */}
          <div className="flex items-baseline gap-2 mx-2 tabular-nums">
            <span className={`text-3xl font-black ${isRecentGoal ? 'text-emerald-400' : 'text-white'} transition-colors`}>
              {match.home_score ?? 0}
            </span>
            <span className={`text-lg font-light ${pulse ? 'text-zinc-400' : 'text-zinc-600'} transition-colors`}>:</span>
            <span className={`text-3xl font-black ${isRecentGoal ? 'text-emerald-400' : 'text-white'} transition-colors`}>
              {match.away_score ?? 0}
            </span>
          </div>

          {/* Away */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.away_logo ? (
              <Image src={match.away_logo} alt="" width={32} height={32} className="h-8 w-8 object-contain shrink-0" />
            ) : (
              <span className="h-6 w-6 rounded-full shrink-0" style={{ backgroundColor: match.away_color || '#52525b' }} />
            )}
            <span className="text-sm font-semibold text-white truncate">
              <span className="hidden sm:inline">{match.away_name}</span>
              <span className="sm:hidden">{match.away_code || match.away_name?.slice(0, 3).toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* HT score */}
        {match.home_score_ht != null && (
          <p className="text-center text-[10px] text-zinc-600 mt-0.5">
            HT {match.home_score_ht} - {match.away_score_ht}
          </p>
        )}

        {/* Goal scorers */}
        {goals.length > 0 && (
          <div className="mt-2.5 border-t border-zinc-700/30 pt-2">
            <div className="flex justify-center gap-4">
              {/* Home goals */}
              <div className="flex-1 text-right">
                {goals
                  .filter(g => g.club_name === match.home_name)
                  .map((g, i) => (
                    <div key={i} className="text-[11px] text-zinc-300">
                      <span className="font-medium">{g.player_name || g.club_name}</span>
                      <span className="text-emerald-500 ml-1">{g.minute}&apos;</span>
                      {g.event_type === 'penalty_scored' && <span className="text-amber-400 text-[9px] ml-0.5">(P)</span>}
                      {g.event_type === 'own_goal' && <span className="text-red-400 text-[9px] ml-0.5">(OG)</span>}
                    </div>
                  ))}
              </div>
              <span className="text-emerald-600 text-xs self-center">⚽</span>
              {/* Away goals */}
              <div className="flex-1 text-left">
                {goals
                  .filter(g => g.club_name === match.away_name)
                  .map((g, i) => (
                    <div key={i} className="text-[11px] text-zinc-300">
                      <span className="text-emerald-500 mr-1">{g.minute}&apos;</span>
                      <span className="font-medium">{g.player_name || g.club_name}</span>
                      {g.event_type === 'penalty_scored' && <span className="text-amber-400 text-[9px] ml-0.5">(P)</span>}
                      {g.event_type === 'own_goal' && <span className="text-red-400 text-[9px] ml-0.5">(OG)</span>}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Cards & VAR (compact row) */}
        {(cards.length > 0 || varEvents.length > 0) && (
          <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
            {cards.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <EventIcon type={c.event_type} />
                <span className="text-[10px] text-zinc-500">{c.minute}&apos;</span>
              </span>
            ))}
            {varEvents.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <EventIcon type="var_decision" />
                <span className="text-[10px] text-zinc-500">{v.minute}&apos;</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
