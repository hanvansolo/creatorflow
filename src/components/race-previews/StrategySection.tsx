// @ts-nocheck
import { Route } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrategyPrediction {
  strategy: string;
  likelihood: string;
  teams: string[];
  explanation: string;
}

interface StrategySectionProps {
  strategies: StrategyPrediction[];
  className?: string;
}

const likelihoodColors: Record<string, string> = {
  'Most likely': 'text-green-500 bg-green-500/10 border-green-500/30',
  'Likely': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  'Possible': 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  'Unlikely': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
};

export function StrategySection({ strategies, className }: StrategySectionProps) {
  if (!strategies || strategies.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-white">Strategy Predictions</h2>
      </div>

      <div className="space-y-3">
        {strategies.map((strategy, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-700/30 bg-zinc-900/50 p-4"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-medium text-white">{strategy.strategy}</h3>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
                  likelihoodColors[strategy.likelihood] || 'text-zinc-400 bg-zinc-700/50 border-zinc-600'
                )}
              >
                {strategy.likelihood}
              </span>
            </div>

            <p className="text-sm text-zinc-400 mb-2">{strategy.explanation}</p>

            {strategy.teams.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-500">Teams:</span>
                {strategy.teams.map((team) => (
                  <span
                    key={team}
                    className="text-xs text-zinc-300 bg-zinc-700/50 rounded px-1.5 py-0.5"
                  >
                    {team}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
