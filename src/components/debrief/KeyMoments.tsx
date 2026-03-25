import { Zap } from 'lucide-react';

interface KeyMomentsProps {
  moments: string[];
}

export function KeyMoments({ moments }: KeyMomentsProps) {
  if (moments.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Zap className="h-5 w-5 text-yellow-500" />
        Key Moments
      </h3>
      <div className="space-y-3">
        {moments.map((moment, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
              {index + 1}
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{moment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
