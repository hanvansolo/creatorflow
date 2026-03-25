import Link from 'next/link';
import { MessageCircleQuestion, ArrowRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceBadge } from './ConfidenceBadge';

interface ScenarioCardProps {
  scenario: {
    slug: string;
    question: string;
    shortAnswer: string | null;
    scenarioType: string;
    confidenceLevel: string | null;
    viewCount: number | null;
    tags: string[] | null;
  };
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

const typeLabels: Record<string, string> = {
  driver_transfer: 'Transfer',
  historical: 'Historical',
  regulation: 'Regulation',
  championship: 'Championship',
};

const typeColors: Record<string, string> = {
  driver_transfer: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  historical: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  regulation: 'text-green-400 bg-green-500/10 border-green-500/30',
  championship: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

export function ScenarioCard({ scenario, variant = 'default', className }: ScenarioCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/what-if/${scenario.slug}`}
        className={cn(
          'group block rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3 transition-all hover:border-purple-500/50 hover:bg-zinc-800',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
              {scenario.question}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px]', typeColors[scenario.scenarioType])}>
                {typeLabels[scenario.scenarioType] || scenario.scenarioType}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {scenario.viewCount || 0}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-purple-400 transition-colors shrink-0" />
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/what-if/${scenario.slug}`}
        className={cn(
          'group block rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-zinc-800/50 p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleQuestion className="h-5 w-5 text-purple-400" />
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
            Featured Scenario
          </span>
        </div>

        <h2 className="text-lg font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
          {scenario.question}
        </h2>

        {scenario.shortAnswer && (
          <p className="text-sm text-zinc-300 line-clamp-3 mb-4">
            {scenario.shortAnswer}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full border px-2 py-0.5 text-xs', typeColors[scenario.scenarioType])}>
              {typeLabels[scenario.scenarioType] || scenario.scenarioType}
            </span>
            {scenario.confidenceLevel && (
              <ConfidenceBadge level={scenario.confidenceLevel as 'high' | 'medium' | 'low' | 'speculative'} />
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Eye className="h-3 w-3" />
            {scenario.viewCount || 0} views
          </span>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/what-if/${scenario.slug}`}
      className={cn(
        'group block rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 transition-all hover:border-purple-500/50 hover:bg-zinc-800',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <MessageCircleQuestion className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
            {scenario.question}
          </h3>

          {scenario.shortAnswer && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
              {scenario.shortAnswer}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full border px-2 py-0.5 text-xs', typeColors[scenario.scenarioType])}>
                {typeLabels[scenario.scenarioType] || scenario.scenarioType}
              </span>
              {scenario.confidenceLevel && (
                <ConfidenceBadge level={scenario.confidenceLevel as 'high' | 'medium' | 'low' | 'speculative'} />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Eye className="h-3 w-3" />
              <span>{scenario.viewCount || 0}</span>
            </div>
          </div>

          {scenario.tags && scenario.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {scenario.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
