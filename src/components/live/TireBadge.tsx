// @ts-nocheck
'use client';

import type { TireCompound } from '@/lib/api/openf1/types';
import { getTireStyle } from '@/lib/constants/tires';

interface TireBadgeProps {
  compound: TireCompound | string;
  age?: number;
  showAge?: boolean;
  size?: 'sm' | 'md';
}

export function TireBadge({ compound, age, showAge = true, size = 'sm' }: TireBadgeProps) {
  const style = getTireStyle(compound);

  const sizeClasses = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className={`${sizeClasses} ${style.bg} rounded-full flex items-center justify-center font-bold text-black`}
        title={style.name}
      >
        {style.shortName}
      </div>
      {showAge && age !== undefined && (
        <span className="text-xs text-zinc-500">{age}L</span>
      )}
    </div>
  );
}
