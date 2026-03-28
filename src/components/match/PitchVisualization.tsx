// @ts-nocheck
'use client';

import { useState } from 'react';
import type { LineupData } from './types';

interface PitchVisualizationProps {
  lineups: LineupData[];
  homeName: string;
  awayName: string;
}

function parseGrid(grid: string | null): { row: number; col: number } | null {
  if (!grid) return null;
  const parts = grid.split(':');
  if (parts.length !== 2) return null;
  return { row: parseInt(parts[0], 10), col: parseInt(parts[1], 10) };
}

function getPlayerPosition(
  grid: { row: number; col: number },
  maxRow: number,
  maxCol: number,
  isHome: boolean
): { top: string; left: string } {
  const rowPct = maxRow > 1 ? (grid.row - 1) / (maxRow - 1) : 0.5;
  const colPct = maxCol > 1 ? (grid.col - 1) / (maxCol - 1) : 0.5;

  let top: number;
  if (isHome) {
    top = 92 - rowPct * 42;
  } else {
    top = 8 + rowPct * 42;
  }

  const left = 10 + colPct * 80;

  return { top: `${top}%`, left: `${left}%` };
}

function PlayerDot({
  player,
  isHome,
  maxRow,
  maxCol,
}: {
  player: { name: string; number: number; grid: string | null };
  isHome: boolean;
  maxRow: number;
  maxCol: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const gridPos = parseGrid(player.grid);
  if (!gridPos) return null;

  const pos = getPlayerPosition(gridPos, maxRow, maxCol, isHome);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-transform hover:scale-110 ${
          isHome
            ? 'bg-yellow-400 text-black'
            : 'bg-zinc-400 text-black'
        }`}
      >
        {player.number}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-20 border border-zinc-700">
          {player.name}
        </div>
      )}
    </div>
  );
}

export default function PitchVisualization({
  lineups,
  homeName,
  awayName,
}: PitchVisualizationProps) {
  if (!lineups || lineups.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <p className="text-zinc-400 text-sm">Lineups not yet available</p>
      </div>
    );
  }

  const homeLineup = lineups[0];
  const awayLineup = lineups[1];

  const getMaxRowCol = (lineup: LineupData) => {
    let maxRow = 1;
    let maxCol = 1;
    for (const { player } of lineup.startXI) {
      const g = parseGrid(player.grid);
      if (g) {
        if (g.row > maxRow) maxRow = g.row;
        if (g.col > maxCol) maxCol = g.col;
      }
    }
    return { maxRow, maxCol };
  };

  const homeMax = getMaxRowCol(homeLineup);
  const awayMax = getMaxRowCol(awayLineup);

  return (
    <div className="w-full">
      <div
        className="relative w-full bg-emerald-800 rounded-lg border-2 border-white/30 overflow-hidden"
        style={{ aspectRatio: '3 / 4' }}
      >
        {/* Pitch markings */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[44%] h-[16%] border-b border-l border-r border-white/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[22%] h-[7%] border-b border-l border-r border-white/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[44%] h-[16%] border-t border-l border-r border-white/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[22%] h-[7%] border-t border-l border-r border-white/30" />
        <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-full" />
        <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-full" />

        {/* Formation labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <span className="text-[10px] sm:text-xs text-white/60 font-medium bg-zinc-900/50 px-2 py-0.5 rounded">
            {awayName} {awayLineup.formation}
          </span>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <span className="text-[10px] sm:text-xs text-white/60 font-medium bg-zinc-900/50 px-2 py-0.5 rounded">
            {homeName} {homeLineup.formation}
          </span>
        </div>

        {/* Home team players (bottom half) — yellow dots */}
        {homeLineup.startXI.map(({ player }, i) => (
          <PlayerDot
            key={`home-${i}`}
            player={player}
            isHome={true}
            maxRow={homeMax.maxRow}
            maxCol={homeMax.maxCol}
          />
        ))}

        {/* Away team players (top half) — gray dots */}
        {awayLineup.startXI.map(({ player }, i) => (
          <PlayerDot
            key={`away-${i}`}
            player={player}
            isHome={false}
            maxRow={awayMax.maxRow}
            maxCol={awayMax.maxCol}
          />
        ))}
      </div>
    </div>
  );
}
