import { cn } from '@/lib/utils';
import type { CredibilityRating } from '@/types';

interface CredibilityBadgeProps {
  rating: CredibilityRating;
  className?: string;
}

const ratingConfig: Record<CredibilityRating, { label: string; className: string }> = {
  verified: {
    label: 'Verified',
    className: 'bg-green-600 text-white border-green-500',
  },
  unverified: {
    label: 'Unverified',
    className: 'bg-zinc-500 text-white border-zinc-400',
  },
  clickbait: {
    label: 'Clickbait',
    className: 'bg-emerald-600 text-white border-emerald-500',
  },
  opinion: {
    label: 'Opinion',
    className: 'bg-blue-600 text-white border-blue-500',
  },
  rumour: {
    label: 'Rumour',
    className: 'bg-amber-500 text-black border-amber-400',
  },
};

export function CredibilityBadge({ rating, className }: CredibilityBadgeProps) {
  const config = ratingConfig[rating];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
