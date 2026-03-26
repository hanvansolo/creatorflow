// @ts-nocheck
'use client';

interface GapDisplayProps {
  gapToLeader: number | null;
  interval: number | null;
  isLeader?: boolean;
}

function formatGap(gap: number | null): string {
  if (gap === null) return '-';
  if (gap === 0) return '-';

  // If gap is very large, it might be lapped
  if (gap > 120) {
    const laps = Math.floor(gap / 90); // Rough estimate
    if (laps >= 1) {
      return `+${laps} LAP${laps > 1 ? 'S' : ''}`;
    }
  }

  // Format as seconds with 3 decimal places
  return `+${gap.toFixed(3)}`;
}

export function GapDisplay({ gapToLeader, interval, isLeader = false }: GapDisplayProps) {
  if (isLeader) {
    return (
      <div className="text-right">
        <span className="text-sm font-medium text-zinc-400">LEADER</span>
      </div>
    );
  }

  return (
    <div className="text-right space-y-0.5">
      <div className="text-sm font-mono text-white">{formatGap(gapToLeader)}</div>
      {interval !== null && interval !== gapToLeader && (
        <div className="text-xs font-mono text-zinc-500">{formatGap(interval)}</div>
      )}
    </div>
  );
}
