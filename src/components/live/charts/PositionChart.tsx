'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface PositionHistory {
  lap: number;
  positions: Map<number, number>; // driver_number -> position
}

interface PositionChartProps {
  positionHistory: PositionHistory[];
  drivers: Driver[];
  currentLap: number;
}

export function PositionChart({ positionHistory, drivers, currentLap }: PositionChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Get unique drivers from history (top 10)
  const trackedDrivers = useMemo(() => {
    if (positionHistory.length === 0) return [];

    const lastLap = positionHistory[positionHistory.length - 1];
    const driverPositions = Array.from(lastLap.positions.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10)
      .map(([driverNum]) => driverNum);

    return driverPositions;
  }, [positionHistory]);

  // Chart dimensions
  const width = 100;
  const height = 70;
  const padding = { top: 8, right: 12, bottom: 8, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxLap = Math.max(currentLap, 1);
  const lapScale = (lap: number) => padding.left + (lap / maxLap) * chartWidth;
  const positionScale = (pos: number) => padding.top + ((pos - 1) / 9) * chartHeight; // 1-10 positions

  if (positionHistory.length === 0 || trackedDrivers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Position Changes</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
          No position data yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <h3 className="text-sm font-semibold text-white">Position Changes</h3>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '200px' }}>
          {/* Position grid lines */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pos => (
            <g key={pos}>
              <line
                x1={padding.left}
                y1={positionScale(pos)}
                x2={width - padding.right}
                y2={positionScale(pos)}
                stroke="#374151"
                strokeWidth="0.2"
                strokeDasharray="1 1"
              />
              <text
                x={width - padding.right + 2}
                y={positionScale(pos) + 1}
                fontSize="2.5"
                fill="#9ca3af"
              >
                P{pos}
              </text>
            </g>
          ))}

          {/* Lap markers */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const lap = Math.round(maxLap * ratio);
            return (
              <text
                key={ratio}
                x={lapScale(lap)}
                y={height - 2}
                fontSize="2"
                fill="#9ca3af"
                textAnchor="middle"
              >
                L{lap}
              </text>
            );
          })}

          {/* Driver position lines */}
          {trackedDrivers.map(driverNum => {
            const driver = driverMap.get(driverNum);
            const color = driver?.team_colour ? `#${driver.team_colour}` : '#666';

            // Build path from position history
            const points = positionHistory
              .filter(h => h.positions.has(driverNum))
              .map(h => ({
                x: lapScale(h.lap),
                y: positionScale(h.positions.get(driverNum)!),
              }));

            if (points.length < 2) return null;

            const pathD = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            const lastPoint = points[points.length - 1];

            return (
              <g key={driverNum}>
                {/* Line */}
                <path
                  d={pathD}
                  stroke={color}
                  strokeWidth="0.8"
                  fill="none"
                  opacity={0.9}
                />
                {/* Current position dot */}
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="1.5"
                  fill={color}
                />
                {/* Driver label at end */}
                <text
                  x={lastPoint.x + 2}
                  y={lastPoint.y + 0.5}
                  fontSize="2"
                  fill={color}
                  fontWeight="bold"
                >
                  {driver?.name_acronym || driverNum}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
