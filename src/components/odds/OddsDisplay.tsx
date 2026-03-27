'use client';

import { formatOdds, type OddsFormat } from '@/lib/utils/odds-format';

interface OddsDisplayProps {
  odds: string | number;
  format: OddsFormat;
  className?: string;
}

export function OddsDisplay({ odds, format, className = '' }: OddsDisplayProps) {
  return (
    <span className={className}>
      {formatOdds(odds, format)}
    </span>
  );
}
