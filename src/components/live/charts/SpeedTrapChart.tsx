// @ts-nocheck
'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface SpeedTrapData {
  driver_number: number;
  speed: number; // km/h
  lap_number: number;
}

interface SpeedTrapChartProps {
  speedData: SpeedTrapData[];
  drivers: Driver[];
}

export function SpeedTrapChart({ speedData, drivers }: SpeedTrapChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Get best speed for each driver
  const bestSpeeds = useMemo(() => {
    const best = new Map<number, SpeedTrapData>();
    for (const data of speedData) {
      const existing = best.get(data.driver_number);
      if (!existing || data.speed > existing.speed) {
        best.set(data.driver_number, data);
      }
    }
    return Array.from(best.values())
      .sort((a, b) => b.speed - a.speed)
      .slice(0, 8);
  }, [speedData]);

  // Calculate bounds
  const { minSpeed, maxSpeed } = useMemo(() => {
    if (bestSpeeds.length === 0) return { minSpeed: 300, maxSpeed: 350 };
    const speeds = bestSpeeds.map(s => s.speed);
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    return { minSpeed: min - 5, maxSpeed: max + 2 };
  }, [bestSpeeds]);

  // Chart dimensions
  const width = 200;
  const rowHeight = 12;
  const padding = { top: 12, right: 16, bottom: 8, left: 28 };
  const chartWidth = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + Math.max(bestSpeeds.length, 1) * rowHeight;

  const speedScale = (speed: number) => padding.left + ((speed - minSpeed) / (maxSpeed - minSpeed)) * chartWidth;

  if (bestSpeeds.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Speed Trap</h3>
        </div>
        <div className="h-24 flex items-center justify-center text-zinc-500 text-sm">
          No speed data yet
        </div>
      </div>
    );
  }

  const fastestSpeed = bestSpeeds[0]?.speed || 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Speed Trap</h3>
        <span className="text-xs text-zinc-500">km/h</span>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${bestSpeeds.length * 28 + 24}px` }}>
          {/* Speed grid lines */}
          {[0, 0.5, 1].map(ratio => {
            const speed = minSpeed + (maxSpeed - minSpeed) * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={speedScale(speed)}
                  y1={padding.top - 2}
                  x2={speedScale(speed)}
                  y2={height - padding.bottom}
                  stroke="#374151"
                  strokeWidth="0.2"
                  strokeDasharray="1 1"
                />
                <text
                  x={speedScale(speed)}
                  y={padding.top - 4}
                  fontSize="4"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {Math.round(speed)}
                </text>
              </g>
            );
          })}

          {/* Speed bars */}
          {bestSpeeds.map((data, idx) => {
            const driver = driverMap.get(data.driver_number);
            const y = padding.top + idx * rowHeight;
            const barWidth = speedScale(data.speed) - padding.left;
            const isFastest = data.speed === fastestSpeed;
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';

            return (
              <g key={data.driver_number}>
                {/* Driver label */}
                <text
                  x={padding.left - 2}
                  y={y + rowHeight / 2 + 1.5}
                  fontSize="5"
                  fill={teamColor}
                  textAnchor="end"
                  fontWeight="bold"
                >
                  {driver?.name_acronym || data.driver_number}
                </text>

                {/* Speed bar */}
                <rect
                  x={padding.left}
                  y={y + 2}
                  width={Math.max(barWidth, 2)}
                  height={rowHeight - 4}
                  fill={isFastest ? '#a855f7' : teamColor}
                  rx="1"
                  opacity={0.85}
                />

                {/* Speed label */}
                <text
                  x={padding.left + barWidth + 2}
                  y={y + rowHeight / 2 + 1.5}
                  fontSize="4.5"
                  fill={isFastest ? '#a855f7' : '#fff'}
                  fontWeight={isFastest ? 'bold' : 'normal'}
                >
                  {data.speed.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
