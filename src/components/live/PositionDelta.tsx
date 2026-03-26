// @ts-nocheck
'use client';

import { ChevronUp, ChevronDown, Minus } from 'lucide-react';

interface PositionDeltaProps {
  delta: number;
  showZero?: boolean;
}

export function PositionDelta({ delta, showZero = false }: PositionDeltaProps) {
  if (delta === 0 && !showZero) {
    return null;
  }

  if (delta > 0) {
    // Gained positions (moved up the grid)
    return (
      <span className="inline-flex items-center text-green-500 text-xs font-medium">
        <ChevronUp className="h-3 w-3" />
        <span>{delta}</span>
      </span>
    );
  }

  if (delta < 0) {
    // Lost positions (moved down the grid)
    return (
      <span className="inline-flex items-center text-emerald-500 text-xs font-medium">
        <ChevronDown className="h-3 w-3" />
        <span>{Math.abs(delta)}</span>
      </span>
    );
  }

  // Delta is 0 and showZero is true
  return (
    <span className="inline-flex items-center text-zinc-500 text-xs font-medium">
      <Minus className="h-3 w-3" />
    </span>
  );
}
