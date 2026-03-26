// @ts-nocheck
'use client';

import type { Driver } from '@/lib/api/openf1/types';
import { formatDistanceToNow } from 'date-fns';

type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

interface PitStopWithTires {
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  date: string;
  compound_before?: TireCompound;
  compound_after?: TireCompound;
  meeting_key: number;
  session_key: number;
}

interface PitStopListProps {
  pitStops: PitStopWithTires[];
  drivers: Driver[];
  limit?: number;
}

const TIRE_COLORS: Record<string, { bg: string; text: string }> = {
  SOFT: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  MEDIUM: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
  HARD: { bg: 'bg-white', text: 'text-white' },
  INTERMEDIATE: { bg: 'bg-green-500', text: 'text-green-500' },
  WET: { bg: 'bg-blue-500', text: 'text-blue-500' },
  UNKNOWN: { bg: 'bg-zinc-500', text: 'text-zinc-500' },
};

export function PitStopList({ pitStops, drivers, limit = 10 }: PitStopListProps) {
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  // Sort by date descending (most recent first) and limit
  const recentStops = [...pitStops]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  if (recentStops.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Pit Stops</h3>
        <p className="text-sm text-zinc-500">No pit stops yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <h3 className="text-sm font-semibold text-white">
          Pit Stops
          <span className="ml-2 text-zinc-500 font-normal">({pitStops.length} total)</span>
        </h3>
      </div>
      <div className="max-h-60 overflow-y-auto">
        <div className="divide-y divide-zinc-800/50">
          {recentStops.map((stop, index) => {
            const driver = driverMap.get(stop.driver_number);
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';
            const tireBefore = stop.compound_before ? TIRE_COLORS[stop.compound_before] : null;
            const tireAfter = stop.compound_after ? TIRE_COLORS[stop.compound_after] : null;

            return (
              <div key={index} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: teamColor }}
                  />
                  <div>
                    <span className="text-sm font-medium text-white">
                      {driver?.name_acronym || `#${stop.driver_number}`}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">Lap {stop.lap_number}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Tire change indicator */}
                  {tireBefore && tireAfter && (
                    <div className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${tireBefore.bg}`} />
                      <span className="text-zinc-500 text-xs">→</span>
                      <span className={`w-3 h-3 rounded-full ${tireAfter.bg}`} />
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-sm font-mono text-white">
                      {stop.pit_duration.toFixed(1)}s
                    </span>
                    <div className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(stop.date), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
