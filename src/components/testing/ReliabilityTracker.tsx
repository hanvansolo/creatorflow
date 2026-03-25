import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ReliabilityEntry {
  teamName: string;
  teamColor: string;
  totalLaps: number;
  issues: string[];
}

interface ReliabilityTrackerProps {
  data: ReliabilityEntry[];
}

export function ReliabilityTracker({ data }: ReliabilityTrackerProps) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.totalLaps - a.totalLaps);
  const maxLaps = sorted[0]?.totalLaps || 1;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-bold text-white">Reliability & Mileage</h3>
      <div className="space-y-3">
        {sorted.map((entry) => {
          const barWidth = (entry.totalLaps / maxLaps) * 100;
          const hasIssues = entry.issues.length > 0;

          return (
            <div key={entry.teamName}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasIssues ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  )}
                  <span className="text-sm font-medium" style={{ color: entry.teamColor }}>
                    {entry.teamName}
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {entry.totalLaps} laps
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: hasIssues ? '#eab308' : entry.teamColor,
                    opacity: 0.7,
                  }}
                />
              </div>
              {hasIssues && (
                <div className="mt-1 space-y-0.5">
                  {entry.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-yellow-500/80">
                      {issue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
