import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low' | 'speculative';
  className?: string;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  high: {
    label: 'High Confidence',
    color: 'text-green-400 bg-green-500/10 border-green-500/30',
  },
  medium: {
    label: 'Medium Confidence',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  low: {
    label: 'Low Confidence',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  },
  speculative: {
    label: 'Speculative',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
};

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const config = levelConfig[level] || levelConfig.speculative;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
