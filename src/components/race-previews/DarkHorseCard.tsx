import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DarkHorsePick {
  driver: string;
  team: string;
  reason: string;
  outsiderOdds: string;
}

interface DarkHorseCardProps {
  pick: DarkHorsePick;
  className?: string;
}

export function DarkHorseCard({ pick, className }: DarkHorseCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-zinc-800/50 p-6',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Dark Horse Pick</h2>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-purple-400">{pick.driver}</h3>
          <p className="text-zinc-400">{pick.team}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-500 uppercase tracking-wide block">Outsider Odds</span>
          <span className="text-lg font-bold text-white">{pick.outsiderOdds}</span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700/30 bg-zinc-900/30 p-3">
        <span className="text-xs text-purple-400 uppercase tracking-wide block mb-1">
          Why they could surprise
        </span>
        <p className="text-sm text-zinc-300">{pick.reason}</p>
      </div>
    </div>
  );
}
