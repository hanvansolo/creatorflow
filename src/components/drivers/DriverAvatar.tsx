// @ts-nocheck
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverAvatarProps {
  headshotUrl?: string | null;
  firstName: string;
  lastName: string;
  code?: string;
  teamColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function DriverAvatar({
  headshotUrl,
  firstName,
  lastName,
  code,
  teamColor,
  size = 'md',
  className,
}: DriverAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = code || `${firstName[0]}${lastName[0]}`;
  const sizeClass = sizeClasses[size];

  // Show fallback if no URL or image failed to load
  if (!headshotUrl || imageError) {
    return (
      <div
        className={cn(
          sizeClass,
          'flex items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 overflow-hidden',
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
        'relative rounded-full overflow-hidden bg-zinc-800',
        className
      )}
    >
      <Image
        src={headshotUrl}
        alt={`${firstName} ${lastName}`}
        fill
        className="object-cover object-top"
        sizes={size === 'lg' ? '56px' : size === 'md' ? '40px' : '32px'}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
