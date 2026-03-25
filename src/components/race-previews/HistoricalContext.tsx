import { History, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoricalContextData {
  previousWinners: string[];
  trackCharacteristics: string;
  keyFacts: string[];
}

interface HistoricalContextProps {
  context: HistoricalContextData;
  className?: string;
}

export function HistoricalContext({ context, className }: HistoricalContextProps) {
  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-white">Historical Context</h2>
      </div>

      <div className="space-y-4">
        {context.previousWinners.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Recent Winners</h3>
            <div className="flex flex-wrap gap-2">
              {context.previousWinners.map((winner, index) => (
                <span
                  key={index}
                  className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-sm text-amber-400"
                >
                  {winner}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Track Characteristics</h3>
          <p className="text-sm text-zinc-300">{context.trackCharacteristics}</p>
        </div>

        {context.keyFacts.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Key Facts</h3>
            <ul className="space-y-2">
              {context.keyFacts.map((fact, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-zinc-300">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
