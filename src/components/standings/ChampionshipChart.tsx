'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DriverInfo {
  code: string;
  name: string;
  color: string;
  finalPoints: number;
}

interface ChampionshipChartProps {
  data: Record<string, string | number>[];
  drivers: DriverInfo[];
}

export function ChampionshipChart({ data, drivers }: ChampionshipChartProps) {
  const [showAll, setShowAll] = useState(false);
  const [hiddenDrivers, setHiddenDrivers] = useState<Set<string>>(new Set());

  // Sort drivers by final points (descending) and show top 10 by default
  const sortedDrivers = [...drivers].sort((a, b) => b.finalPoints - a.finalPoints);
  const visibleDrivers = showAll ? sortedDrivers : sortedDrivers.slice(0, 10);

  const toggleDriver = (code: string) => {
    setHiddenDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-12">
        <p className="text-lg font-medium text-zinc-400">No race data yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          The championship battle chart will appear once the season begins.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {visibleDrivers.map((d) => (
            <button
              key={d.code}
              type="button"
              onClick={() => toggleDriver(d.code)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all"
              style={{
                backgroundColor: hiddenDrivers.has(d.code) ? '#27272a' : `${d.color}20`,
                color: hiddenDrivers.has(d.code) ? '#71717a' : d.color,
                opacity: hiddenDrivers.has(d.code) ? 0.5 : 1,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: hiddenDrivers.has(d.code) ? '#71717a' : d.color }}
              />
              {d.code}
            </button>
          ))}
        </div>
        {drivers.length > 10 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="rounded-md px-3 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {showAll ? 'Top 10' : 'Show all'}
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="round"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
              itemStyle={{ padding: '2px 0' }}
              formatter={(value: number | undefined, name: string | undefined) => {
                const driver = drivers.find((d) => d.code === name);
                return [
                  `${value ?? 0} pts`,
                  driver ? `${driver.name}` : name ?? '',
                ];
              }}
              labelFormatter={(label) => {
                const point = data.find((d) => d.round === label);
                return point ? String(point.roundName) : String(label);
              }}
            />
            {visibleDrivers.map((d) => (
              <Line
                key={d.code}
                type="monotone"
                dataKey={d.code}
                stroke={d.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                hide={hiddenDrivers.has(d.code)}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
