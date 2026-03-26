// @ts-nocheck
'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface PitStop {
  driver_number: number;
  lap_number: number;
  pit_duration: number; // in seconds
  compound_before?: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
  compound_after?: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
}

interface PitStopChartProps {
  pitStops: PitStop[];
  drivers: Driver[];
}

const TIRE_COLORS: Record<string, string> = {
  SOFT: '#ef4444',
  MEDIUM: '#eab308',
  HARD: '#ffffff',
  INTERMEDIATE: '#22c55e',
  WET: '#3b82f6',
};

export function PitStopChart({ pitStops, drivers }: PitStopChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Sort pit stops by duration (fastest first)
  const sortedPitStops = useMemo(() => {
    return [...pitStops].sort((a, b) => a.pit_duration - b.pit_duration);
  }, [pitStops]);

  // Calculate time bounds
  const { minTime, maxTime } = useMemo(() => {
    if (pitStops.length === 0) return { minTime: 20, maxTime: 30 };
    const times = pitStops.map(p => p.pit_duration);
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { minTime: Math.max(0, min - 1), maxTime: max + 2 };
  }, [pitStops]);

  // Chart dimensions - full width
  const width = 300;
  const rowHeight = 28;
  const padding = { top: 24, right: 60, bottom: 12, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + Math.min(sortedPitStops.length, 10) * rowHeight;

  const timeScale = (time: number) => padding.left + ((time - minTime) / (maxTime - minTime)) * chartWidth;

  if (pitStops.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Pit Stop Times</h3>
        </div>
        <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
          No pit stops yet
        </div>
      </div>
    );
  }

  // Find fastest pit stop
  const fastestTime = sortedPitStops[0]?.pit_duration || 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Pit Stop Times</h3>
        <span className="text-xs text-zinc-500">{pitStops.length} stops</span>
      </div>
      <div className="px-2 py-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 'auto' }}>
          {/* Time grid lines */}
          {[0, 0.5, 1].map(ratio => {
            const time = minTime + (maxTime - minTime) * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={timeScale(time)}
                  y1={padding.top - 2}
                  x2={timeScale(time)}
                  y2={height - padding.bottom}
                  stroke="#374151"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                />
                <text
                  x={timeScale(time)}
                  y={padding.top - 6}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {time.toFixed(1)}s
                </text>
              </g>
            );
          })}

          {/* Pit stop bars */}
          {sortedPitStops.slice(0, 10).map((stop, idx) => {
            const driver = driverMap.get(stop.driver_number);
            const y = padding.top + idx * rowHeight;
            const barWidth = timeScale(stop.pit_duration) - padding.left;
            const isFastest = stop.pit_duration === fastestTime;
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';
            const tireX = width - 52; // Fixed position for tire indicators

            return (
              <g key={`${stop.driver_number}-${stop.lap_number}`}>
                {/* Driver label */}
                <text
                  x={padding.left - 4}
                  y={y + rowHeight / 2 + 4}
                  fontSize="12"
                  fill={teamColor}
                  textAnchor="end"
                  fontWeight="bold"
                >
                  {driver?.name_acronym || stop.driver_number}
                </text>

                {/* Pit stop bar */}
                <rect
                  x={padding.left}
                  y={y + 5}
                  width={Math.max(barWidth, 4)}
                  height={rowHeight - 10}
                  fill={isFastest ? '#a855f7' : teamColor}
                  rx="2"
                  opacity={0.85}
                />

                {/* Duration label */}
                <text
                  x={padding.left + barWidth + 4}
                  y={y + rowHeight / 2 + 4}
                  fontSize="10"
                  fill={isFastest ? '#a855f7' : '#fff'}
                  fontWeight={isFastest ? 'bold' : 'normal'}
                >
                  {stop.pit_duration.toFixed(2)}s{isFastest && ' ⚡'}
                </text>

                {/* Tire change indicator - fixed position on right */}
                {stop.compound_before && stop.compound_after && (
                  <g>
                    <circle
                      cx={tireX}
                      cy={y + rowHeight / 2}
                      r="9"
                      fill={TIRE_COLORS[stop.compound_before] || '#666'}
                      stroke="#27272a"
                      strokeWidth="1"
                    />
                    {/* Arrow */}
                    <text
                      x={tireX + 14}
                      y={y + rowHeight / 2 + 4}
                      fontSize="10"
                      fill="#a1a1aa"
                    >
                      →
                    </text>
                    <circle
                      cx={tireX + 30}
                      cy={y + rowHeight / 2}
                      r="9"
                      fill={TIRE_COLORS[stop.compound_after] || '#666'}
                      stroke="#27272a"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
