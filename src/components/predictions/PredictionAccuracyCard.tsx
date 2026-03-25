import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, Minus } from 'lucide-react';

interface PredictionAccuracyCardProps {
  raceId: string;
  raceName: string;
  circuitName: string;
  country: string;
  raceDate: Date;
  round: number;
  accuracy: {
    positionAccuracy: number;
    podiumAccuracy: number;
    topTenAccuracy: number;
    averagePositionError: number;
  };
}

function getGrade(podiumAccuracy: number, topTenAccuracy: number, avgError: number): { grade: string; color: string } {
  const score = (podiumAccuracy * 0.3) + (topTenAccuracy * 0.4) + (Math.max(0, 100 - avgError * 10) * 0.3);
  if (score >= 80) return { grade: 'A', color: '#22c55e' };
  if (score >= 65) return { grade: 'B', color: '#84cc16' };
  if (score >= 50) return { grade: 'C', color: '#f59e0b' };
  if (score >= 35) return { grade: 'D', color: '#f97316' };
  return { grade: 'F', color: '#ef4444' };
}

function AccuracyMeter({ label, value }: { label: string; value: number }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-300">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: clampedValue >= 66 ? '#22c55e' : clampedValue >= 33 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  );
}

export function PredictionAccuracyCard({
  raceId,
  raceName,
  circuitName,
  country,
  raceDate,
  round,
  accuracy,
}: PredictionAccuracyCardProps) {
  const { grade, color } = getGrade(accuracy.podiumAccuracy, accuracy.topTenAccuracy, accuracy.averagePositionError);

  return (
    <Link
      href={`/predictions/${raceId}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:bg-zinc-800/50"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <Badge variant="outline">Round {round}</Badge>
          <h3 className="mt-2 text-lg font-bold text-white">{raceName}</h3>
          <p className="text-sm text-zinc-400">
            {circuitName}, {country}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {format(new Date(raceDate), 'MMM d, yyyy')}
          </p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {grade}
        </div>
      </div>

      <div className="space-y-2.5">
        <AccuracyMeter label="Podium Accuracy" value={accuracy.podiumAccuracy} />
        <AccuracyMeter label="Top 10 Accuracy" value={accuracy.topTenAccuracy} />
        <AccuracyMeter label="Exact Position" value={accuracy.positionAccuracy} />
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
        <span>Avg position error:</span>
        <span className="font-medium text-zinc-300">{accuracy.averagePositionError.toFixed(1)} places</span>
      </div>
    </Link>
  );
}
