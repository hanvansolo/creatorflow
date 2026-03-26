// @ts-nocheck
'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface GapDataPoint {
  lap: number;
  gaps: Map<number, number>; // driver_number -> gap to leader
}

interface GapChartProps {
  data: GapDataPoint[];
  drivers: Driver[];
  selectedDrivers?: number[]; // Show only these drivers (top 5 by default)
  currentLap: number;
}

export function GapChart({ data, drivers, selectedDrivers, currentLap }: GapChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Get top 5 drivers or selected drivers
  const driversToShow = useMemo(() => {
    if (selectedDrivers) return selectedDrivers;
    if (data.length === 0) return [];
    const lastData = data[data.length - 1];
    const sorted = Array.from(lastData.gaps.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([num]) => num);
    return sorted;
  }, [data, selectedDrivers]);

  // Chart dimensions
  const width = 100;
  const height = 60;
  const padding = { top: 5, right: 5, bottom: 12, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const { xScale, yScale, maxGap } = useMemo(() => {
    const maxLap = Math.max(currentLap, 10);
    const allGaps = data.flatMap(d =>
      driversToShow.map(num => d.gaps.get(num) || 0)
    );
    const maxGap = Math.max(...allGaps, 10);

    return {
      xScale: (lap: number) => padding.left + (lap / maxLap) * chartWidth,
      yScale: (gap: number) => padding.top + chartHeight - (gap / maxGap) * chartHeight,
      maxGap,
    };
  }, [data, currentLap, driversToShow, chartWidth, chartHeight]);

  // Generate path for each driver
  const paths = useMemo(() => {
    return driversToShow.map(driverNum => {
      const driver = driverMap.get(driverNum);
      const points = data
        .filter(d => d.gaps.has(driverNum))
        .map(d => ({
          x: xScale(d.lap),
          y: yScale(d.gaps.get(driverNum) || 0),
        }));

      if (points.length < 2) return null;

      const pathD = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
      ).join(' ');

      return {
        driverNum,
        color: driver?.team_colour ? `#${driver.team_colour}` : '#666',
        acronym: driver?.name_acronym || `${driverNum}`,
        pathD,
        lastPoint: points[points.length - 1],
      };
    }).filter(Boolean);
  }, [driversToShow, data, driverMap, xScale, yScale]);

  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Gap to Leader</h3>
        </div>
        <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">
          Collecting data...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <h3 className="text-sm font-semibold text-white">Gap to Leader</h3>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="#374151"
              strokeWidth="0.2"
              strokeDasharray="1 1"
            />
          ))}

          {/* Y-axis labels */}
          <text x={padding.left - 1} y={padding.top + 2} fontSize="2.5" fill="#9ca3af" textAnchor="end">
            {maxGap.toFixed(0)}s
          </text>
          <text x={padding.left - 1} y={padding.top + chartHeight} fontSize="2.5" fill="#9ca3af" textAnchor="end">
            0s
          </text>

          {/* X-axis label */}
          <text x={width / 2} y={height - 1} fontSize="2.5" fill="#9ca3af" textAnchor="middle">
            Lap {currentLap}
          </text>

          {/* Driver lines */}
          {paths.map(path => path && (
            <g key={path.driverNum}>
              <path
                d={path.pathD}
                fill="none"
                stroke={path.color}
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Current position dot */}
              <circle
                cx={path.lastPoint.x}
                cy={path.lastPoint.y}
                r="1.2"
                fill={path.color}
              />
              {/* Driver label */}
              <text
                x={path.lastPoint.x + 1.5}
                y={path.lastPoint.y + 0.8}
                fontSize="2.2"
                fill={path.color}
                fontWeight="bold"
              >
                {path.acronym}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
