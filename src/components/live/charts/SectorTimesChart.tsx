// @ts-nocheck
'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface SectorData {
  driver_number: number;
  sector_1: number;
  sector_2: number;
  sector_3: number;
  lap_number: number;
}

interface SectorTimesChartProps {
  sectorData: SectorData[];
  drivers: Driver[];
}

export function SectorTimesChart({ sectorData, drivers }: SectorTimesChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Get latest sector times for top 6 drivers
  const latestSectors = useMemo(() => {
    const latest = new Map<number, SectorData>();
    for (const data of sectorData) {
      const existing = latest.get(data.driver_number);
      if (!existing || data.lap_number > existing.lap_number) {
        latest.set(data.driver_number, data);
      }
    }
    return Array.from(latest.values())
      .sort((a, b) => (a.sector_1 + a.sector_2 + a.sector_3) - (b.sector_1 + b.sector_2 + b.sector_3))
      .slice(0, 6);
  }, [sectorData]);

  // Find best sectors across all drivers
  const bestSectors = useMemo(() => {
    let bestS1 = Infinity, bestS2 = Infinity, bestS3 = Infinity;
    for (const data of latestSectors) {
      if (data.sector_1 < bestS1) bestS1 = data.sector_1;
      if (data.sector_2 < bestS2) bestS2 = data.sector_2;
      if (data.sector_3 < bestS3) bestS3 = data.sector_3;
    }
    return { s1: bestS1, s2: bestS2, s3: bestS3 };
  }, [latestSectors]);

  // Chart dimensions
  const width = 200;
  const rowHeight = 20;
  const padding = { top: 20, right: 2, bottom: 8, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + Math.max(latestSectors.length, 1) * rowHeight;

  const sectorWidth = chartWidth / 3;

  if (latestSectors.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Sector Times</h3>
        </div>
        <div className="h-24 flex items-center justify-center text-zinc-500 text-sm">
          No sector data yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Sector Times</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Best
          </span>
        </div>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${latestSectors.length * 36 + 36}px` }}>
          {/* Header */}
          <text x={padding.left + sectorWidth * 0.5} y={padding.top - 6} fontSize="6" fill="#ef4444" textAnchor="middle" fontWeight="bold">S1</text>
          <text x={padding.left + sectorWidth * 1.5} y={padding.top - 6} fontSize="6" fill="#eab308" textAnchor="middle" fontWeight="bold">S2</text>
          <text x={padding.left + sectorWidth * 2.5} y={padding.top - 6} fontSize="6" fill="#22c55e" textAnchor="middle" fontWeight="bold">S3</text>

          {/* Driver rows */}
          {latestSectors.map((data, idx) => {
            const driver = driverMap.get(data.driver_number);
            const y = padding.top + idx * rowHeight;
            const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';

            const isS1Best = data.sector_1 <= bestSectors.s1;
            const isS2Best = data.sector_2 <= bestSectors.s2;
            const isS3Best = data.sector_3 <= bestSectors.s3;

            return (
              <g key={data.driver_number}>
                {/* Driver label */}
                <text
                  x={padding.left - 2}
                  y={y + rowHeight / 2 + 1.5}
                  fontSize="6"
                  fill={teamColor}
                  textAnchor="end"
                  fontWeight="bold"
                >
                  {driver?.name_acronym || data.driver_number}
                </text>

                {/* Sector 1 */}
                <rect
                  x={padding.left + 2}
                  y={y + 3}
                  width={sectorWidth - 4}
                  height={rowHeight - 6}
                  fill={isS1Best ? '#a855f7' : '#374151'}
                  rx="2"
                  opacity={0.6}
                />
                <text
                  x={padding.left + sectorWidth * 0.5}
                  y={y + rowHeight / 2 + 2}
                  fontSize="5.5"
                  fill={isS1Best ? '#fff' : '#9ca3af'}
                  textAnchor="middle"
                  fontWeight={isS1Best ? 'bold' : 'normal'}
                >
                  {data.sector_1.toFixed(2)}
                </text>

                {/* Sector 2 */}
                <rect
                  x={padding.left + sectorWidth + 2}
                  y={y + 3}
                  width={sectorWidth - 4}
                  height={rowHeight - 6}
                  fill={isS2Best ? '#a855f7' : '#374151'}
                  rx="2"
                  opacity={0.6}
                />
                <text
                  x={padding.left + sectorWidth * 1.5}
                  y={y + rowHeight / 2 + 2}
                  fontSize="5.5"
                  fill={isS2Best ? '#fff' : '#9ca3af'}
                  textAnchor="middle"
                  fontWeight={isS2Best ? 'bold' : 'normal'}
                >
                  {data.sector_2.toFixed(2)}
                </text>

                {/* Sector 3 */}
                <rect
                  x={padding.left + sectorWidth * 2 + 2}
                  y={y + 3}
                  width={sectorWidth - 4}
                  height={rowHeight - 6}
                  fill={isS3Best ? '#a855f7' : '#374151'}
                  rx="2"
                  opacity={0.6}
                />
                <text
                  x={padding.left + sectorWidth * 2.5}
                  y={y + rowHeight / 2 + 2}
                  fontSize="5.5"
                  fill={isS3Best ? '#fff' : '#9ca3af'}
                  textAnchor="middle"
                  fontWeight={isS3Best ? 'bold' : 'normal'}
                >
                  {data.sector_3.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
