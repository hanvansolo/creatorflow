// @ts-nocheck
'use client';

import { memo } from 'react';
import type { Driver, Position, Interval, Stint, Lap } from '@/lib/api/openf1/types';
import { PositionDelta } from './PositionDelta';
import { GapDisplay } from './GapDisplay';
import { TireBadge } from './TireBadge';

interface LeaderboardRowProps {
  position: Position;
  driver: Driver | null;
  interval: Interval | null;
  currentStint: Stint | null;
  lastLap: Lap | null;
  bestLap: Lap | null;
  positionDelta: number;
  currentLap?: number;
  isQualifying?: boolean;
}

function formatLapTime(duration: number | null): string {
  if (duration === null) return '-';

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }
  return seconds.toFixed(3);
}

export const LeaderboardRow = memo(function LeaderboardRow({
  position,
  driver,
  interval,
  currentStint,
  lastLap,
  bestLap,
  positionDelta,
  currentLap,
  isQualifying = false,
}: LeaderboardRowProps) {
  const isLeader = position.position === 1;
  const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';

  // Calculate tire age based on current lap
  const tireAge =
    currentStint && currentLap
      ? currentLap - currentStint.lap_start + currentStint.tyre_age_at_start
      : currentStint?.tyre_age_at_start;

  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
      {/* Position */}
      <td className="py-2 px-2 w-12">
        <div className="flex items-center gap-1">
          <span
            className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: isLeader ? '#FFD700' : teamColor }}
          >
            {position.position}
          </span>
          <PositionDelta delta={positionDelta} />
        </div>
      </td>

      {/* Driver */}
      <td className="py-2 px-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-8 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-white">
                {driver?.name_acronym || `#${position.driver_number}`}
              </span>
              <span className="text-xs text-zinc-500 hidden sm:inline">
                {driver?.first_name}
              </span>
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {driver?.team_name || 'Unknown Team'}
            </div>
          </div>
        </div>
      </td>

      {/* Best Lap (qualifying) or Gap (race) */}
      <td className="py-2 px-2 w-24 hidden sm:table-cell">
        {isQualifying ? (
          <span className="font-mono text-sm text-zinc-300">
            {formatLapTime(bestLap?.lap_duration ?? null)}
          </span>
        ) : (
          <GapDisplay
            gapToLeader={interval?.gap_to_leader ?? null}
            interval={interval?.interval ?? null}
            isLeader={isLeader}
          />
        )}
      </td>

      {/* Tire - hidden for qualifying */}
      {!isQualifying && (
        <td className="py-2 px-2 w-16">
          {currentStint ? (
            <TireBadge
              compound={currentStint.compound}
              age={tireAge}
              showAge={true}
            />
          ) : (
            <span className="text-zinc-600">-</span>
          )}
        </td>
      )}

      {/* Gap (qualifying) or Last Lap (race) */}
      <td className="py-2 px-2 w-20 text-right hidden md:table-cell">
        {isQualifying ? (
          <GapDisplay
            gapToLeader={interval?.gap_to_leader ?? null}
            interval={interval?.interval ?? null}
            isLeader={isLeader}
          />
        ) : (
          <span className="font-mono text-sm text-zinc-300">
            {formatLapTime(lastLap?.lap_duration ?? null)}
          </span>
        )}
      </td>
    </tr>
  );
}, (prev, next) => (
  prev.position.position === next.position.position &&
  prev.position.driver_number === next.position.driver_number &&
  prev.interval?.gap_to_leader === next.interval?.gap_to_leader &&
  prev.interval?.interval === next.interval?.interval &&
  prev.currentStint?.compound === next.currentStint?.compound &&
  prev.currentStint?.stint_number === next.currentStint?.stint_number &&
  prev.lastLap?.lap_duration === next.lastLap?.lap_duration &&
  prev.lastLap?.lap_number === next.lastLap?.lap_number &&
  prev.bestLap?.lap_duration === next.bestLap?.lap_duration &&
  prev.positionDelta === next.positionDelta &&
  prev.currentLap === next.currentLap &&
  prev.isQualifying === next.isQualifying
));
