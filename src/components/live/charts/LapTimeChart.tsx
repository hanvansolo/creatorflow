'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface LapTime {
  driver_number: number;
  lap_number: number;
  lap_time: number; // in seconds
  is_pit_lap?: boolean;
}

interface LapTimeChartProps {
  lapTimes: LapTime[];
  drivers: Driver[];
  currentLap: number;
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

export function LapTimeChart({ lapTimes, drivers, currentLap }: LapTimeChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Group lap times by driver
  const driverLapTimes = useMemo(() => {
    const grouped = new Map<number, LapTime[]>();
    for (const lt of lapTimes) {
      if (!grouped.has(lt.driver_number)) {
        grouped.set(lt.driver_number, []);
      }
      grouped.get(lt.driver_number)!.push(lt);
    }
    // Sort each driver's laps by lap number
    for (const laps of grouped.values()) {
      laps.sort((a, b) => a.lap_number - b.lap_number);
    }
    return grouped;
  }, [lapTimes]);

  // Get top 5 drivers by most recent lap times
  const trackedDrivers = useMemo(() => {
    return Array.from(driverLapTimes.entries())
      .filter(([, laps]) => laps.length > 0)
      .sort((a, b) => {
        const aLastLap = a[1][a[1].length - 1];
        const bLastLap = b[1][b[1].length - 1];
        return aLastLap.lap_time - bLastLap.lap_time;
      })
      .slice(0, 5)
      .map(([driverNum]) => driverNum);
  }, [driverLapTimes]);

  // Calculate time bounds (exclude pit laps for better scaling)
  const { minTime, maxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const driverNum of trackedDrivers) {
      const laps = driverLapTimes.get(driverNum) || [];
      for (const lap of laps) {
        if (!lap.is_pit_lap && lap.lap_time > 0) {
          min = Math.min(min, lap.lap_time);
          max = Math.max(max, lap.lap_time);
        }
      }
    }
    // Add some padding
    const range = max - min;
    return { minTime: min - range * 0.05, maxTime: max + range * 0.1 };
  }, [trackedDrivers, driverLapTimes]);

  // Chart dimensions
  const width = 100;
  const height = 60;
  const padding = { top: 8, right: 8, bottom: 10, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxLap = Math.max(currentLap, 1);
  const lapScale = (lap: number) => padding.left + (lap / maxLap) * chartWidth;
  const timeScale = (time: number) => {
    const normalized = (time - minTime) / (maxTime - minTime);
    return padding.top + chartHeight - normalized * chartHeight; // Invert: faster times at top
  };

  if (lapTimes.length === 0 || trackedDrivers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Lap Times</h3>
        </div>
        <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">
          No lap time data yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Lap Times</h3>
        <div className="flex items-center gap-2 text-xs">
          {trackedDrivers.slice(0, 3).map(driverNum => {
            const driver = driverMap.get(driverNum);
            const color = driver?.team_colour ? `#${driver.team_colour}` : '#666';
            return (
              <span key={driverNum} className="flex items-center gap-1">
                <span className="w-2 h-0.5 rounded" style={{ backgroundColor: color }} />
                <span style={{ color }}>{driver?.name_acronym || driverNum}</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '180px' }}>
          {/* Time grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const time = minTime + (maxTime - minTime) * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={timeScale(time)}
                  x2={width - padding.right}
                  y2={timeScale(time)}
                  stroke="#374151"
                  strokeWidth="0.2"
                  strokeDasharray="1 1"
                />
                <text
                  x={padding.left - 1}
                  y={timeScale(time) + 1}
                  fontSize="1.8"
                  fill="#9ca3af"
                  textAnchor="end"
                >
                  {formatLapTime(time)}
                </text>
              </g>
            );
          })}

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

          {/* Driver lap time lines */}
          {trackedDrivers.map(driverNum => {
            const driver = driverMap.get(driverNum);
            const color = driver?.team_colour ? `#${driver.team_colour}` : '#666';
            const laps = driverLapTimes.get(driverNum) || [];

            // Filter out pit laps and invalid times for the line
            const validLaps = laps.filter(l => !l.is_pit_lap && l.lap_time > 0);
            if (validLaps.length < 2) return null;

            const points = validLaps.map(l => ({
              x: lapScale(l.lap_number),
              y: timeScale(l.lap_time),
            }));

            const pathD = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            return (
              <g key={driverNum}>
                {/* Line */}
                <path
                  d={pathD}
                  stroke={color}
                  strokeWidth="0.6"
                  fill="none"
                  opacity={0.85}
                />
                {/* Data points */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="0.6"
                    fill={color}
                  />
                ))}
              </g>
            );
          })}

          {/* Best lap indicator */}
          {(() => {
            let bestLap: LapTime | null = null;
            for (const driverNum of trackedDrivers) {
              const laps = driverLapTimes.get(driverNum) || [];
              for (const lap of laps) {
                if (!lap.is_pit_lap && lap.lap_time > 0) {
                  if (!bestLap || lap.lap_time < bestLap.lap_time) {
                    bestLap = lap;
                  }
                }
              }
            }
            if (!bestLap) return null;
            const driver = driverMap.get(bestLap.driver_number);
            return (
              <g>
                <circle
                  cx={lapScale(bestLap.lap_number)}
                  cy={timeScale(bestLap.lap_time)}
                  r="1.5"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="0.4"
                />
                <text
                  x={lapScale(bestLap.lap_number)}
                  y={timeScale(bestLap.lap_time) - 2.5}
                  fontSize="2"
                  fill="#a855f7"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  BEST {driver?.name_acronym || bestLap.driver_number}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
