// @ts-nocheck
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DriverHelmetProps {
  helmetImageUrl?: string | null;
  driverName: string;
  driverCode?: string;
  teamColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function DriverHelmet({
  helmetImageUrl,
  driverName,
  driverCode,
  teamColor,
  size = 'md',
  className,
}: DriverHelmetProps) {
  const [imageError, setImageError] = useState(false);

  const initials = driverCode || driverName.slice(0, 2).toUpperCase();
  const sizeClass = sizeClasses[size];

  // Show fallback if no URL or image failed to load
  if (!helmetImageUrl || imageError) {
    return (
      <div
        className={cn(
          sizeClass,
          'flex items-center justify-center bg-zinc-800 text-xs font-bold text-zinc-300',
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        'relative overflow-hidden bg-transparent',
        className
      )}
    >
      <Image
        src={helmetImageUrl}
        alt={`${driverName} helmet`}
        fill
        className="object-contain"
        sizes={size === 'lg' ? '56px' : size === 'md' ? '40px' : '32px'}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
