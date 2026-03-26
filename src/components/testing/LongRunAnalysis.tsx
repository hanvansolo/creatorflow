// @ts-nocheck
interface LongRunEntry {
  driverCode: string;
  teamName: string;
  teamColor: string;
  longRunPace: string | null;
  longRunPaceMs: number | null;
  longRunLaps: number;
  tyreCompound: string | null;
}

interface LongRunAnalysisProps {
  data: LongRunEntry[];
}

export function LongRunAnalysis({ data }: LongRunAnalysisProps) {
  const withData = data
    .filter(d => d.longRunPaceMs && d.longRunLaps > 0)
    .sort((a, b) => (a.longRunPaceMs || 0) - (b.longRunPaceMs || 0));

  if (withData.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-zinc-400">No long run data available yet.</p>
        <p className="mt-1 text-xs text-zinc-500">Long run pace data shows real race simulation performance.</p>
      </div>
    );
  }

  const fastestMs = withData[0].longRunPaceMs!;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Long Run Pace (Race Simulation)</h3>
        <span className="text-xs text-zinc-500">Avg lap time over stint</span>
      </div>
      <div className="space-y-2">
        {withData.map((entry, i) => {
          const gapMs = (entry.longRunPaceMs || 0) - fastestMs;
          const maxGap = ((withData[withData.length - 1].longRunPaceMs || 0) - fastestMs) || 1;
          const barWidth = i === 0 ? 100 : Math.max(5, (gapMs / maxGap) * 100);

          return (
            <div key={entry.driverCode} className="flex items-center gap-3">
              <span
                className="w-10 text-sm font-bold"
                style={{ color: entry.teamColor }}
              >
                {entry.driverCode}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                    {i === 0 ? (
                      <div
                        className="h-full rounded-full"
                        style={{ width: '100%', backgroundColor: entry.teamColor, opacity: 0.6 }}
                      />
                    ) : (
                      <div
                        className="h-full rounded-full bg-zinc-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <span className="w-20 text-right font-mono text-xs text-zinc-300">
                {entry.longRunPace}
              </span>
              <span className="w-14 text-right font-mono text-xs text-yellow-500">
                {i === 0 ? '' : `+${(gapMs / 1000).toFixed(3)}s`}
              </span>
              <span className="w-10 text-right text-xs text-zinc-500">
                {entry.longRunLaps}L
              </span>
              {entry.tyreCompound && (
                <span className="w-6 text-center text-[10px] font-bold text-zinc-400">
                  {entry.tyreCompound}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
