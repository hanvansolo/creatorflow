// @ts-nocheck
import { Target, TrendingUp, Medal, BarChart3 } from 'lucide-react';

interface AccuracyOverviewProps {
  stats: {
    totalRaces: number;
    avgPositionError: number;
    avgPodiumAccuracy: number;
    avgTopTenAccuracy: number;
    avgPositionAccuracy: number;
  };
}

function AccuracyStat({ icon: Icon, label, value, subtext, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-500">{subtext}</p>
      </div>
    </div>
  );
}

export function AccuracyOverview({ stats }: AccuracyOverviewProps) {
  if (stats.totalRaces === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <Target className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-lg font-medium text-zinc-400">No accuracy data yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Prediction accuracy will be tracked after races are completed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AccuracyStat
        icon={Target}
        label="Exact Position"
        value={`${stats.avgPositionAccuracy.toFixed(0)}%`}
        subtext="Positions predicted exactly"
        color="#ef4444"
      />
      <AccuracyStat
        icon={Medal}
        label="Podium Accuracy"
        value={`${stats.avgPodiumAccuracy.toFixed(0)}%`}
        subtext="Podium finishers correct"
        color="#f59e0b"
      />
      <AccuracyStat
        icon={TrendingUp}
        label="Top 10 Accuracy"
        value={`${stats.avgTopTenAccuracy.toFixed(0)}%`}
        subtext="Top 10 predicted in top 10"
        color="#22c55e"
      />
      <AccuracyStat
        icon={BarChart3}
        label="Avg Position Error"
        value={stats.avgPositionError.toFixed(1)}
        subtext={`Across ${stats.totalRaces} race${stats.totalRaces > 1 ? 's' : ''}`}
        color="#3b82f6"
      />
    </div>
  );
}
