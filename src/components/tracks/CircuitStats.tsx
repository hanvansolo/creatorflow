// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

'use client';

interface CircuitStatsProps {
  circuit: {
    name: string;
    slug?: string;
    country: string;
    lengthMeters?: number | null;
    turns?: number | null;
    drsZones?: number | null;
    lapRecordTime?: string | null;
    lapRecordDriver?: string | null;
    lapRecordYear?: number | null;
    circuitType?: string | null;
    direction?: string | null;
    firstGrandPrixYear?: number | null;
  };
  variant?: 'compact' | 'full';
  showWeather?: boolean;
  showCharacteristics?: boolean;
}

export function CircuitStats(_props: CircuitStatsProps) {
  return null;
}
