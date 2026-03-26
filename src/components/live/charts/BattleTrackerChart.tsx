// @ts-nocheck
'use client';

import { useMemo } from 'react';
import type { Driver } from '@/lib/api/openf1/types';

interface BattleData {
  driver_ahead: number;
  driver_behind: number;
  gap: number; // seconds
  position: number;
}

interface BattleTrackerChartProps {
  battles: BattleData[];
  drivers: Driver[];
}

export function BattleTrackerChart({ battles, drivers }: BattleTrackerChartProps) {
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.driver_number, d])), [drivers]);

  // Filter to battles within 1 second and sort by closest
  const closeBattles = useMemo(() => {
    return battles
      .filter(b => b.gap <= 1.0 && b.gap > 0)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 6);
  }, [battles]);

  // Chart dimensions
  const width = 100;
  const rowHeight = 12;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const height = padding.top + padding.bottom + Math.max(closeBattles.length, 1) * rowHeight;

  if (closeBattles.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Live Battles</h3>
          <span className="text-xs text-zinc-500">&lt;1s gap</span>
        </div>
        <div className="h-20 flex items-center justify-center text-zinc-500 text-sm">
          No close battles
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Live Battles</h3>
        <span className="inline-flex items-center gap-1 text-xs text-orange-400">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          {closeBattles.length} active
        </span>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${closeBattles.length * 32 + 16}px` }}>
          {closeBattles.map((battle, idx) => {
            const driverAhead = driverMap.get(battle.driver_ahead);
            const driverBehind = driverMap.get(battle.driver_behind);
            const y = padding.top + idx * rowHeight;

            const colorAhead = driverAhead?.team_colour ? `#${driverAhead.team_colour}` : '#666';
            const colorBehind = driverBehind?.team_colour ? `#${driverBehind.team_colour}` : '#666';

            // Gap indicator width (0-1s mapped to bar)
            const gapPercent = (1 - battle.gap) * 100;
            const intensity = battle.gap < 0.3 ? 'high' : battle.gap < 0.6 ? 'medium' : 'low';
            const intensityColor = intensity === 'high' ? '#ef4444' : intensity === 'medium' ? '#f97316' : '#eab308';

            return (
              <g key={`${battle.driver_ahead}-${battle.driver_behind}`}>
                {/* Position badge */}
                <rect
                  x={2}
                  y={y + 1}
                  width={6}
                  height={rowHeight - 2}
                  fill="#374151"
                  rx="1"
                />
                <text
                  x={5}
                  y={y + rowHeight / 2 + 1}
                  fontSize="2.5"
                  fill="#fff"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  P{battle.position}
                </text>

                {/* Driver ahead */}
                <circle cx={14} cy={y + rowHeight / 2} r={2} fill={colorAhead} />
                <text
                  x={18}
                  y={y + rowHeight / 2 + 0.8}
                  fontSize="2.5"
                  fill={colorAhead}
                  fontWeight="bold"
                >
                  {driverAhead?.name_acronym || battle.driver_ahead}
                </text>

                {/* Gap indicator */}
                <rect
                  x={32}
                  y={y + rowHeight / 2 - 1.5}
                  width={30}
                  height={3}
                  fill="#1f2937"
                  rx="1"
                />
                <rect
                  x={32}
                  y={y + rowHeight / 2 - 1.5}
                  width={30 * (gapPercent / 100)}
                  height={3}
                  fill={intensityColor}
                  rx="1"
                />

                {/* Gap time */}
                <text
                  x={67}
                  y={y + rowHeight / 2 + 0.8}
                  fontSize="2.5"
                  fill={intensityColor}
                  fontWeight="bold"
                >
                  +{battle.gap.toFixed(3)}s
                </text>

                {/* Driver behind */}
                <circle cx={84} cy={y + rowHeight / 2} r={2} fill={colorBehind} />
                <text
                  x={88}
                  y={y + rowHeight / 2 + 0.8}
                  fontSize="2.5"
                  fill={colorBehind}
                  fontWeight="bold"
                >
                  {driverBehind?.name_acronym || battle.driver_behind}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
