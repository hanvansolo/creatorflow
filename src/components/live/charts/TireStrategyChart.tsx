'use client';

import { useMemo } from 'react';
import type { Driver, Stint } from '@/lib/api/openf1/types';
import { TIRE_COLORS } from '@/lib/constants/tires';

interface StintHistory {
  driver_number: number;
  stints: Array<{
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
    lap_start: number;
    lap_end: number | null;
  }>;
}

interface TireStrategyChartProps {
  stintHistory: StintHistory[];
  drivers: Driver[];
  currentLap: number;
  totalLaps: number;
}

export function TireStrategyChart({ stintHistory, drivers, currentLap, totalLaps }: TireStrategyChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Sort by position (we'll use driver order as proxy)
  const sortedStints = useMemo(() => {
    return [...stintHistory].slice(0, 10); // Show top 10 drivers
  }, [stintHistory]);

  // Chart dimensions
  const width = 100;
  const rowHeight = 6;
  const padding = { top: 8, right: 8, bottom: 4, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + sortedStints.length * rowHeight;

  const lapScale = (lap: number) => padding.left + (lap / totalLaps) * chartWidth;

  if (sortedStints.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Tire Strategy</h3>
        </div>
        <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
          No stint data yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Tire Strategy</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Soft
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white" />
            Hard
          </span>
        </div>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${sortedStints.length * 24 + 30}px` }}>
          {/* Lap markers */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const lap = Math.round(totalLaps * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={lapScale(lap)}
                  y1={padding.top - 3}
                  x2={lapScale(lap)}
                  y2={height - padding.bottom}
                  stroke="#374151"
                  strokeWidth="0.2"
                  strokeDasharray="1 1"
                />
                <text
                  x={lapScale(lap)}
                  y={padding.top - 4}
                  fontSize="2"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  L{lap}
                </text>
              </g>
            );
          })}

          {/* Current lap marker */}
          <line
            x1={lapScale(currentLap)}
            y1={padding.top}
            x2={lapScale(currentLap)}
            y2={height - padding.bottom}
            stroke="#ef4444"
            strokeWidth="0.3"
          />

          {/* Driver rows */}
          {sortedStints.map((driverStints, idx) => {
            const driver = driverMap.get(driverStints.driver_number);
            const y = padding.top + idx * rowHeight;

            return (
              <g key={driverStints.driver_number}>
                {/* Driver label */}
                <text
                  x={padding.left - 1}
                  y={y + rowHeight / 2 + 1}
                  fontSize="2.5"
                  fill={driver?.team_colour ? `#${driver.team_colour}` : '#fff'}
                  textAnchor="end"
                  fontWeight="bold"
                >
                  {driver?.name_acronym || driverStints.driver_number}
                </text>

                {/* Stints */}
                {driverStints.stints.map((stint, stintIdx) => {
                  const startX = lapScale(stint.lap_start);
                  const endX = lapScale(stint.lap_end || currentLap);
                  const tireColor = TIRE_COLORS[stint.compound]?.hex || '#666';

                  return (
                    <rect
                      key={stintIdx}
                      x={startX}
                      y={y + 1}
                      width={Math.max(endX - startX, 1)}
                      height={rowHeight - 2}
                      fill={tireColor}
                      rx="0.5"
                      opacity={0.9}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
