// @ts-nocheck
import Link from 'next/link';
import { Calendar, MapPin, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodiumPrediction {
  p1: { driver: string; team: string; confidence: number };
  p2: { driver: string; team: string; confidence: number };
  p3: { driver: string; team: string; confidence: number };
}

interface PreviewCardProps {
  preview: {
    raceSlug: string | null;
    raceName: string | null;
    raceDatetime: Date | null;
    circuitName: string | null;
    circuitCountry: string | null;
    executiveSummary: string | null;
    podiumPrediction: PodiumPrediction | unknown;
  };
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PreviewCard({ preview, variant = 'default', className }: PreviewCardProps) {
  const podium = preview.podiumPrediction as PodiumPrediction | null;

  if (variant === 'compact') {
    return (
      <Link
        href={`/calendar/${preview.raceSlug}`}
        className={cn(
          'group block rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-800',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
              {preview.raceName}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {preview.circuitCountry} · {formatDate(preview.raceDatetime)}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/calendar/${preview.raceSlug}`}
        className={cn(
          'group block rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
            <Trophy className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
            AI Race Preview
          </span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {preview.raceName}
        </h2>

        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{preview.circuitName}, {preview.circuitCountry}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(preview.raceDatetime)}</span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 line-clamp-2 mb-4">
          {preview.executiveSummary}
        </p>

        {podium && (
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-700/50">
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Predicted Podium:</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-yellow-500 font-medium">{podium.p1.driver}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">{podium.p2.driver}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-700">{podium.p3.driver}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
          <span>Read full preview</span>
          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/calendar/${preview.raceSlug}/preview`}
      className={cn(
        'group block rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-800',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-4 w-4 text-emerald-500" />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Preview
        </span>
      </div>

      <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
        {preview.raceName}
      </h3>

      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
        <span>{preview.circuitCountry}</span>
        <span>·</span>
        <span>{formatDate(preview.raceDatetime)}</span>
      </div>

      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
        {preview.executiveSummary}
      </p>

      {podium && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-zinc-500">P1:</span>
          <span className="text-yellow-500 font-medium">{podium.p1.driver}</span>
          <span className="text-zinc-600">({podium.p1.confidence}%)</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
        <span>View preview</span>
        <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
