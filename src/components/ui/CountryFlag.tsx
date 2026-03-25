'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getCountryCode } from '@/lib/constants/countries';

interface CountryFlagProps {
  nationality: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const sizeConfig = {
  sm: { width: 20, height: 15 },
  md: { width: 24, height: 18 },
  lg: { width: 32, height: 24 },
};

export function CountryFlag({
  nationality,
  size = 'md',
  className,
  showText = false,
}: CountryFlagProps) {
  const countryCode = getCountryCode(nationality);

  if (!countryCode) {
    if (showText && nationality) {
      return <span className={cn('text-zinc-400', className)}>{nationality}</span>;
    }
    return null;
  }

  const { width, height } = sizeConfig[size];
  const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

  return (
    <Image
      src={flagUrl}
      alt={nationality || 'Country flag'}
      width={width}
      height={height}
      className={cn('inline-block rounded-sm object-cover', className)}
      title={nationality || undefined}
    />
  );
}
