import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlternativeOutcome {
  scenario: string;
  probability: string;
  reasoning: string;
}

interface AlternativeOutcomesProps {
  outcomes: AlternativeOutcome[];
  className?: string;
}

const probabilityColors: Record<string, string> = {
  'Likely': 'text-green-400 bg-green-500/10 border-green-500/30',
  'Possible': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Unlikely': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

export function AlternativeOutcomes({ outcomes, className }: AlternativeOutcomesProps) {
  if (!outcomes || outcomes.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-white">Alternative Outcomes</h2>
      </div>

      <div className="space-y-3">
        {outcomes.map((outcome, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-700/30 bg-zinc-900/50 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-medium text-white">{outcome.scenario}</h3>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
                  probabilityColors[outcome.probability] || 'text-zinc-400 bg-zinc-700/50 border-zinc-600'
                )}
              >
                {outcome.probability}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{outcome.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
