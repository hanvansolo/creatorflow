// @ts-nocheck
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodiumPosition {
  driver: string;
  team: string;
  confidence: number;
}

interface PodiumPredictionProps {
  prediction: {
    p1: PodiumPosition;
    p2: PodiumPosition;
    p3: PodiumPosition;
  };
  className?: string;
}

export function PodiumPrediction({ prediction, className }: PodiumPredictionProps) {
  const positions = [
    { position: 1, data: prediction.p1, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' },
    { position: 2, data: prediction.p2, color: 'text-zinc-400', bgColor: 'bg-zinc-500/20', borderColor: 'border-zinc-500/50' },
    { position: 3, data: prediction.p3, color: 'text-amber-700', bgColor: 'bg-amber-700/20', borderColor: 'border-amber-700/50' },
  ];

  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-white">Podium Prediction</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {positions.map(({ position, data, color, bgColor, borderColor }) => (
          <div
            key={position}
            className={cn(
              'rounded-lg border p-4 text-center',
              borderColor,
              bgColor
            )}
          >
            <div className={cn('text-3xl font-bold mb-1', color)}>P{position}</div>
            <div className="text-lg font-semibold text-white">{data.driver}</div>
            <div className="text-sm text-zinc-400 mb-2">{data.team}</div>
            <div className="flex items-center justify-center gap-1">
              <div className="h-1.5 flex-1 rounded-full bg-zinc-700 overflow-hidden">
                <div
                  className={cn('h-full rounded-full', color.replace('text-', 'bg-'))}
                  style={{ width: `${data.confidence}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 ml-1">{data.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
