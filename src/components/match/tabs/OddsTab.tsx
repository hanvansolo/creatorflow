// @ts-nocheck
'use client';

import { ReceiptText } from 'lucide-react';
import { OddsPanel } from '@/components/odds';

interface OddsTabProps {
  odds: any | null;
}

export default function OddsTab({ odds }: OddsTabProps) {
  if (!odds) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <ReceiptText className="h-8 w-8" />
        <p className="text-sm">Odds not available for this match</p>
      </div>
    );
  }

  return <OddsPanel oddsData={odds} />;
}
