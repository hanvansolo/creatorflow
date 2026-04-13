'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { MatchDetail, PlayerRating } from './types';

interface PlayerPerformanceGridProps {
  match: MatchDetail;
  playerRatings: PlayerRating[];
}

const POS_COLORS: Record<string, string> = {
  G: 'bg-yellow-500/20 text-yellow-400',
  D: 'bg-blue-500/20 text-blue-400',
  M: 'bg-emerald-500/20 text-emerald-400',
  F: 'bg-red-500/20 text-red-400',
};

const POS_LABELS: Record<string, string> = {
  G: 'GK',
  D: 'DEF',
  M: 'MID',
  F: 'FWD',
};

function ratingColor(rating: string | null): string {
  if (!rating) return 'text-zinc-500';
  const num = parseFloat(rating);
  if (num >= 7.5) return 'text-emerald-400';
  if (num >= 6.5) return 'text-yellow-400';
  return 'text-red-400';
}

function PlayerCard({
  player,
  isMvp,
}: {
  player: PlayerRating;
  isMvp: boolean;
}) {
  const posKey = player.position?.charAt(0)?.toUpperCase() || '';
  const posColor = POS_COLORS[posKey] || 'bg-zinc-600/20 text-zinc-400';
  const posLabel = POS_LABELS[posKey] || player.position || '?';

  const stats: { emoji: string; value: number }[] = [];
  if (player.goals) stats.push({ emoji: '\u26BD', value: player.goals });
  if (player.assists) stats.push({ emoji: '\uD83C\uDD70\uFE0F', value: player.assists });
  if (player.shots) stats.push({ emoji: '\uD83C\uDFAF', value: player.shots });
  if (player.passes) stats.push({ emoji: '\u2705', value: player.passes });
  if (player.tackles) stats.push({ emoji: '\uD83D\uDEE1\uFE0F', value: player.tackles });

  return (
    <div
      className={`rounded-lg bg-zinc-800 p-3 flex items-start gap-3 ${
        isMvp ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      {/* Photo */}
      <div className="shrink-0">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-zinc-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white truncate">
            {player.name}
          </span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${posColor}`}
          >
            {posLabel}
          </span>
          {isMvp && (
            <span className="shrink-0 rounded-full bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
              MVP
            </span>
          )}
        </div>

        {/* Mini stat row */}
        {stats.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-400">
            {stats.map((s) => (
              <span key={s.emoji}>
                {s.emoji} {s.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="shrink-0 text-right">
        <span className={`text-xl font-black ${ratingColor(player.rating)}`}>
          {player.rating ? parseFloat(player.rating).toFixed(1) : '-'}
        </span>
      </div>
    </div>
  );
}

export default function PlayerPerformanceGrid({
  match,
  playerRatings,
}: PlayerPerformanceGridProps) {
  const [showAllHome, setShowAllHome] = useState(false);
  const [showAllAway, setShowAllAway] = useState(false);

  const { homePlayers, awayPlayers, mvpName } = useMemo(() => {
    const home = playerRatings
      .filter((p) => p.teamId === match.home_api_id)
      .sort((a, b) => {
        const ra = a.rating ? parseFloat(a.rating) : -1;
        const rb = b.rating ? parseFloat(b.rating) : -1;
        return rb - ra;
      });

    const away = playerRatings
      .filter((p) => p.teamId === match.away_api_id)
      .sort((a, b) => {
        const ra = a.rating ? parseFloat(a.rating) : -1;
        const rb = b.rating ? parseFloat(b.rating) : -1;
        return rb - ra;
      });

    // Find MVP across all players
    let bestRating = -1;
    let bestName = '';
    for (const p of playerRatings) {
      const r = p.rating ? parseFloat(p.rating) : -1;
      if (r > bestRating) {
        bestRating = r;
        bestName = p.name;
      }
    }

    return { homePlayers: home, awayPlayers: away, mvpName: bestName };
  }, [playerRatings, match.home_api_id, match.away_api_id]);

  const visibleHome = showAllHome ? homePlayers : homePlayers.slice(0, 6);
  const visibleAway = showAllAway ? awayPlayers : awayPlayers.slice(0, 6);

  return (
    <section className="rounded-lg bg-zinc-900 p-4">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
        Player Performance
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Home column */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {match.home_name}
          </p>
          <div className="space-y-2">
            {visibleHome.map((p) => (
              <PlayerCard
                key={p.name + p.teamId}
                player={p}
                isMvp={p.name === mvpName}
              />
            ))}
          </div>
          {homePlayers.length > 6 && (
            <button
              onClick={() => setShowAllHome((v) => !v)}
              className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:text-yellow-400 transition-colors"
            >
              {showAllHome ? 'Show less' : `Show all (${homePlayers.length})`}
            </button>
          )}
        </div>

        {/* Away column */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {match.away_name}
          </p>
          <div className="space-y-2">
            {visibleAway.map((p) => (
              <PlayerCard
                key={p.name + p.teamId}
                player={p}
                isMvp={p.name === mvpName}
              />
            ))}
          </div>
          {awayPlayers.length > 6 && (
            <button
              onClick={() => setShowAllAway((v) => !v)}
              className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:text-yellow-400 transition-colors"
            >
              {showAllAway ? 'Show less' : `Show all (${awayPlayers.length})`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
