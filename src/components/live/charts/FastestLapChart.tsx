// @ts-nocheck
'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface FastestLapData {
  driver_number: number;
  lap_time: number;
  lap_number: number;
}

interface FastestLapChartProps {
  fastestLaps: FastestLapData[];
  drivers: Driver[];
  currentLap: number;
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

export function FastestLapChart({ fastestLaps, drivers, currentLap }: FastestLapChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Sort by lap time (fastest first)
  const sortedLaps = useMemo(() => {
    return [...fastestLaps]
      .sort((a, b) => a.lap_time - b.lap_time)
      .slice(0, 5);
  }, [fastestLaps]);

  const fastestTime = sortedLaps[0]?.lap_time || 0;
  const currentHolder = sortedLaps[0];

  if (sortedLaps.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Fastest Lap</h3>
        </div>
        <div className="h-20 flex items-center justify-center text-zinc-500 text-sm">
          No lap times yet
        </div>
      </div>
    );
  }

  const holderDriver = currentHolder ? driverMap.get(currentHolder.driver_number) : null;
  const holderColor = holderDriver?.team_colour ? `#${holderDriver.team_colour}` : '#a855f7';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Fastest Lap</h3>
        <span className="inline-flex items-center gap-1 text-xs text-purple-400">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          L{currentHolder?.lap_number}
        </span>
      </div>

      {/* Current fastest lap holder - prominent display */}
      <div className="px-4 py-3 bg-purple-500/10 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: holderColor }}
            />
            <span className="text-white font-bold">
              {holderDriver?.name_acronym || currentHolder?.driver_number}
            </span>
            <span className="text-zinc-400 text-xs">
              {holderDriver?.team_name}
            </span>
          </div>
          <span className="text-purple-400 font-mono font-bold text-lg">
            {formatLapTime(fastestTime)}
          </span>
        </div>
      </div>

      {/* Other top laps */}
      <div className="p-2">
        <div className="space-y-1">
          {sortedLaps.slice(1).map((lap, idx) => {
            const driver = driverMap.get(lap.driver_number);
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';
            const delta = lap.lap_time - fastestTime;

            return (
              <div
                key={`${lap.driver_number}-${lap.lap_number}`}
                className="flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs w-4">{idx + 2}.</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: teamColor }}
                  />
                  <span className="text-zinc-300 text-sm font-medium">
                    {driver?.name_acronym || lap.driver_number}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-xs font-mono">
                    {formatLapTime(lap.lap_time)}
                  </span>
                  <span className="text-emerald-400 text-xs font-mono">
                    +{delta.toFixed(3)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
