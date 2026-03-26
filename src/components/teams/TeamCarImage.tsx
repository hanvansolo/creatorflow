// @ts-nocheck
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TeamCarImageProps {
  carImageUrl?: string | null;
  teamName: string;
  teamColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-16',
  md: 'h-10 w-20',
  lg: 'h-14 w-28',
};

export function TeamCarImage({
  carImageUrl,
  teamName,
  teamColor,
  size = 'md',
  className,
}: TeamCarImageProps) {
  const [imageError, setImageError] = useState(false);

  const initials = teamName.slice(0, 2).toUpperCase();
  const sizeClass = sizeClasses[size];

  // Show fallback if no URL or image failed to load
  if (!carImageUrl || imageError) {
    return (
      <div
        className={cn(
          sizeClass,
          'flex items-center justify-center rounded-lg text-xs font-bold text-white',
          className
        )}
        style={{ backgroundColor: teamColor || '#374151' }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        'relative overflow-hidden rounded-lg bg-zinc-800',
        className
      )}
    >
      <Image
        src={carImageUrl}
        alt={`${teamName} car`}
        fill
        className="object-contain"
        sizes={size === 'lg' ? '112px' : size === 'md' ? '80px' : '64px'}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
