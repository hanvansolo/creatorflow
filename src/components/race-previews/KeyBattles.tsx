// @ts-nocheck
import { Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyBattle {
  drivers: string[];
  description: string;
  prediction: string;
}

interface KeyBattlesProps {
  battles: KeyBattle[];
  className?: string;
}

export function KeyBattles({ battles, className }: KeyBattlesProps) {
  if (!battles || battles.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Swords className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-white">Key Battles to Watch</h2>
      </div>

      <div className="space-y-4">
        {battles.map((battle, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-700/30 bg-zinc-900/50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {battle.drivers.map((driver, i) => (
                  <span key={driver}>
                    <span className="font-medium text-white">{driver}</span>
                    {i < battle.drivers.length - 1 && (
                      <span className="text-zinc-500 mx-1">vs</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-2">{battle.description}</p>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-orange-500 uppercase tracking-wide shrink-0">
                Prediction:
              </span>
              <p className="text-sm text-zinc-300">{battle.prediction}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
