// @ts-nocheck
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TeamPaceEntry {
  teamName: string;
  teamSlug: string;
  teamColor: string;
  bestTime: string;
  bestTimeMs: number;
  totalLaps: number;
}

interface TeamPaceChartProps {
  data: TeamPaceEntry[];
}

export function TeamPaceChart({ data }: TeamPaceChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-zinc-400">No team pace data available yet.</p>
      </div>
    );
  }

  // Calculate gap from fastest for chart
  const fastest = Math.min(...data.map(d => d.bestTimeMs));
  const chartData = data.map(d => ({
    ...d,
    gap: ((d.bestTimeMs - fastest) / 1000),
    shortName: d.teamName.split(' ')[0],
  }));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis
            type="number"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => `+${v.toFixed(3)}s`}
            domain={[0, 'auto']}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number | undefined) => [
              `+${(value ?? 0).toFixed(3)}s`,
              'Gap to fastest'
            ]}
            labelFormatter={(label) => {
              const team = chartData.find(d => d.shortName === label);
              return team ? `${team.teamName} — ${team.bestTime}` : String(label);
            }}
          />
          <Bar dataKey="gap" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.teamSlug} fill={entry.teamColor} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
