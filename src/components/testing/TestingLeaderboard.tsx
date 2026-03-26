// @ts-nocheck
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  position: number;
  driverCode: string;
  driverName: string;
  teamName: string;
  teamColor: string;
  bestLapTime: string | null;
  gapToLeader: string | null;
  totalLaps: number;
  tyreCompound: string | null;
}

interface TestingLeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
}

const TYRE_COLORS: Record<string, string> = {
  C1: '#f1f1f1', // Hard - white
  C2: '#fbbf24', // Medium-Hard - yellow-ish
  C3: '#fbbf24', // Medium - yellow
  C4: '#ef4444', // Soft - red
  C5: '#ef4444', // Ultra Soft - red
  Hard: '#f1f1f1',
  Medium: '#fbbf24',
  Soft: '#ef4444',
};

export function TestingLeaderboard({ entries, title }: TestingLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-zinc-400">No timing data available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {title && (
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
      )}
      {/* Header */}
      <div className="grid grid-cols-[2.5rem_3rem_1fr_7rem_5rem_4rem_3.5rem] gap-2 border-b border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-500">
        <span>Pos</span>
        <span>Code</span>
        <span>Driver / Team</span>
        <span className="text-right">Best Lap</span>
        <span className="text-right">Gap</span>
        <span className="text-right">Laps</span>
        <span className="text-center">Tyre</span>
      </div>
      {/* Rows */}
      {entries.map((entry, i) => (
        <div
          key={entry.driverCode}
          className={cn(
            'grid grid-cols-[2.5rem_3rem_1fr_7rem_5rem_4rem_3.5rem] gap-2 items-center px-4 py-2.5 text-sm',
            i % 2 === 0 ? 'bg-zinc-900/30' : ''
          )}
        >
          <span className="font-bold text-zinc-400">
            {entry.position}
          </span>
          <span className="font-bold" style={{ color: entry.teamColor }}>
            {entry.driverCode}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-white">{entry.driverName}</p>
            <p className="truncate text-xs text-zinc-500">{entry.teamName}</p>
          </div>
          <span className="text-right font-mono text-sm text-white">
            {entry.bestLapTime || '—'}
          </span>
          <span className={cn(
            'text-right font-mono text-xs',
            entry.position === 1 ? 'text-zinc-500' : 'text-yellow-500'
          )}>
            {entry.position === 1 ? 'LEADER' : entry.gapToLeader || '—'}
          </span>
          <span className="text-right text-xs text-zinc-400">
            {entry.totalLaps}
          </span>
          <div className="flex justify-center">
            {entry.tyreCompound && (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  backgroundColor: `${TYRE_COLORS[entry.tyreCompound] || '#a1a1aa'}20`,
                  color: TYRE_COLORS[entry.tyreCompound] || '#a1a1aa',
                }}
              >
                {entry.tyreCompound}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
