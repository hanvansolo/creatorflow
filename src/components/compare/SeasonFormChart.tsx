'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SeasonFormChartProps {
  data: Record<string, string | number>[];
  driver1: { code: string; name: string; color: string };
  driver2: { code: string; name: string; color: string };
}

export function SeasonFormChart({ data, driver1, driver2 }: SeasonFormChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <p className="text-sm text-zinc-500">Season data will appear once races are completed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="round" stroke="#71717a" fontSize={12} tickLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const driver = name === driver1.code ? driver1 : driver2;
              return [`${value ?? 0} pts`, driver.name];
            }}
          />
          <Line
            type="monotone"
            dataKey={driver1.code}
            stroke={driver1.color}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: driver1.color }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey={driver2.code}
            stroke={driver2.color}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: driver2.color }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
