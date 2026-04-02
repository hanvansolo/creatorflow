// @ts-nocheck
'use client';

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

function getMaxCols(players: any[]): Map<number, number> {
  const rowCounts = new Map<number, number>();
  for (const p of players) {
    const g = parseGrid(p.player?.grid);
    if (g) rowCounts.set(g.row, Math.max(rowCounts.get(g.row) || 0, g.col));
  }
  return rowCounts;
}

function SinglePitch({ lineup, isHome }: { lineup: LineupData; isHome: boolean }) {
  const players = lineup.startXI || [];
  const formation = lineup.formation || '';
  const maxCols = getMaxCols(players);
  const color = isHome ? 'bg-yellow-400 text-black' : 'bg-zinc-400 text-black';

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`inline-flex h-4 w-4 rounded-full ${isHome ? 'bg-yellow-400' : 'bg-zinc-400'}`} />
        <span className="text-xs font-bold text-white truncate">{lineup.team?.name || (isHome ? 'Home' : 'Away')}</span>
        {formation && <span className="text-[10px] text-zinc-500 ml-auto">{formation}</span>}
      </div>

      {/* Pitch */}
      <div className="relative bg-emerald-800/80 rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {/* Pitch markings */}
        <div className="absolute inset-0">
          {/* Halfway line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20" />
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/15" />
          {/* Penalty area top */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[18%] border-b border-l border-r border-white/15" />
          {/* Penalty area bottom */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-[18%] border-t border-l border-r border-white/15" />
        </div>

        {/* Players */}
        {players.map((p: any, i: number) => {
          const grid = parseGrid(p.player?.grid);
          if (!grid) return null;

          const maxCol = maxCols.get(grid.row) || 1;
          // Position: row 1 = GK (bottom for home, top for away)
          const maxRow = Math.max(...Array.from(maxCols.keys()));
          const yPct = isHome
            ? 95 - ((grid.row - 1) / maxRow) * 85
            : 5 + ((grid.row - 1) / maxRow) * 85;
          const xPct = maxCol === 1
            ? 50
            : 8 + ((grid.col - 1) / (maxCol - 1)) * 84;

          return (
            <div
              key={p.player?.id || i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ top: `${yPct}%`, left: `${xPct}%` }}
            >
              <span className={`flex items-center justify-center h-6 w-6 rounded-full text-[9px] font-bold ${color} shadow-sm`}>
                {p.player?.number || '?'}
              </span>
              <span className="text-[7px] text-white/70 mt-0.5 max-w-[50px] truncate text-center leading-tight">
                {p.player?.name?.split(' ').pop() || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PitchVisualization({ lineups, homeName, awayName }: PitchVisualizationProps) {
  if (!lineups || lineups.length < 2) return null;

  const homeLineup = lineups[0];
  const awayLineup = lineups[1];

  return (
    <div className="flex gap-2">
      <SinglePitch lineup={homeLineup} isHome={true} />
      <SinglePitch lineup={awayLineup} isHome={false} />
    </div>
  );
}
