import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyFactor {
  factor: string;
  impact: string;
}

interface KeyFactorsListProps {
  factors: KeyFactor[];
  className?: string;
}

export function KeyFactorsList({ factors, className }: KeyFactorsListProps) {
  if (!factors || factors.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-white">Key Factors</h2>
      </div>

      <div className="space-y-3">
        {factors.map((factor, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-700/30 bg-zinc-900/50 p-4"
          >
            <h3 className="font-medium text-white mb-1">{factor.factor}</h3>
            <p className="text-sm text-zinc-400">{factor.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
