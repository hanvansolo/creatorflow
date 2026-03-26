// @ts-nocheck
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { NewsSource } from '@/types';

interface SourceBadgeProps {
  source: NewsSource;
  showLogo?: boolean;
  className?: string;
}

export function SourceBadge({ source, showLogo = true, className }: SourceBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-2.5 py-1',
        className
      )}
    >
      {showLogo && source.logoUrl && (
        <Image
          src={source.logoUrl}
          alt={source.name}
          width={16}
          height={16}
          className="rounded-sm"
        />
      )}
      <span className="text-xs font-medium text-zinc-300">{source.name}</span>
    </div>
  );
}
