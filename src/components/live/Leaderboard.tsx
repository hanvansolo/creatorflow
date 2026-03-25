'use client';

import type { Driver, Position, Interval, Stint, Lap } from '@/lib/api/openf1/types';
import { LeaderboardRow } from './LeaderboardRow';

interface LeaderboardProps {
  positions: Position[];
  drivers: Driver[];
  intervals: Interval[];
  stints: Stint[];
  laps: Map<number, Lap>;
  getPositionDelta: (driverNumber: number) => number;
  getCurrentStint: (driverNumber: number) => Stint | null;
  getInterval: (driverNumber: number) => Interval | null;
  getLastLap: (driverNumber: number) => Lap | null;
  getBestLap: (driverNumber: number) => Lap | null;
  sessionType?: string; // "Race", "Qualifying", "Practice", "Sprint", "Sprint Qualifying"
}

export function Leaderboard({
  positions,
  drivers,
  getPositionDelta,
  getCurrentStint,
  getInterval,
  getLastLap,
  getBestLap,
  sessionType,
}: LeaderboardProps) {
  const isQualifying = sessionType === 'Qualifying' || sessionType === 'Sprint Qualifying';
  // Create a map of drivers for quick lookup
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  // Get the current lap number from the leader's last lap
  const leaderPosition = positions.find(p => p.position === 1);
  const leaderLap = leaderPosition ? getLastLap(leaderPosition.driver_number) : null;
  const currentLap = leaderLap?.lap_number;

  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-zinc-500">No position data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-800/50">
            <th className="py-2 px-2 text-left text-xs font-medium text-zinc-400 uppercase">
              Pos
            </th>
            <th className="py-2 px-2 text-left text-xs font-medium text-zinc-400 uppercase">
              Driver
            </th>
            <th className="py-2 px-2 text-right text-xs font-medium text-zinc-400 uppercase hidden sm:table-cell">
              {isQualifying ? 'Best Lap' : 'Gap'}
            </th>
            {!isQualifying && (
              <th className="py-2 px-2 text-left text-xs font-medium text-zinc-400 uppercase">
                Tire
              </th>
            )}
            <th className="py-2 px-2 text-right text-xs font-medium text-zinc-400 uppercase hidden md:table-cell">
              {isQualifying ? 'Gap' : 'Last Lap'}
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map(position => (
            <LeaderboardRow
              key={position.driver_number}
              position={position}
              driver={driverMap.get(position.driver_number) || null}
              interval={getInterval(position.driver_number)}
              currentStint={getCurrentStint(position.driver_number)}
              lastLap={getLastLap(position.driver_number)}
              bestLap={getBestLap(position.driver_number)}
              positionDelta={getPositionDelta(position.driver_number)}
              currentLap={currentLap}
              isQualifying={isQualifying}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
