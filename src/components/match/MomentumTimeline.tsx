'use client';

import type { MatchAnalysisRow } from './types';

interface MomentumTimelineProps {
  analyses: MatchAnalysisRow[];
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
}

interface Segment {
  startMinute: number;
  endMinute: number;
  momentum: 'home' | 'away' | 'neutral';
}

function buildSegments(analyses: MatchAnalysisRow[]): Segment[] {
  if (!analyses.length) return [];

  // Sort by minute
  const sorted = [...analyses]
    .filter(a => a.minute !== null)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  if (!sorted.length) return [];

  const segments: Segment[] = [];
  const maxMinute = 90;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const startMinute = current.minute ?? 0;
    const endMinute = i < sorted.length - 1 ? (sorted[i + 1].minute ?? maxMinute) : maxMinute;

    let momentum: 'home' | 'away' | 'neutral' = 'neutral';
    const m = current.momentum?.toLowerCase() ?? '';
    if (m.includes('home')) momentum = 'home';
    else if (m.includes('away')) momentum = 'away';

    segments.push({ startMinute, endMinute, momentum });
  }

  // Fill gap from 0 to first analysis
  const firstMinute = sorted[0].minute ?? 0;
  if (firstMinute > 0) {
    segments.unshift({ startMinute: 0, endMinute: firstMinute, momentum: 'neutral' });
  }

  return segments;
}

const MINUTE_MARKERS = [0, 15, 30, 45, 60, 75, 90];

export default function MomentumTimeline({
  analyses,
  homeName,
  awayName,
  homeColor,
  awayColor,
}: MomentumTimelineProps) {
  const segments = buildSegments(analyses);

  if (!segments.length) {
    return (
      <div className="flex items-center justify-center h-20 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <p className="text-zinc-400 text-sm">No momentum data available</p>
      </div>
    );
  }

  const maxMinute = 90;

  const getMomentumColor = (momentum: 'home' | 'away' | 'neutral') => {
    switch (momentum) {
      case 'home':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-blue-500';
      default:
        return 'bg-zinc-600';
    }
  };

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>{homeName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span>{awayName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-600" />
          <span>Neutral</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative">
        <div className="flex h-8 rounded-md overflow-hidden">
          {segments.map((seg, i) => {
            const widthPct = ((seg.endMinute - seg.startMinute) / maxMinute) * 100;
            if (widthPct <= 0) return null;
            return (
              <div
                key={i}
                className={`${getMomentumColor(seg.momentum)} transition-colors relative group`}
                style={{ width: `${widthPct}%` }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-20 border border-zinc-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {seg.startMinute}&apos; - {seg.endMinute}&apos;:{' '}
                  {seg.momentum === 'home'
                    ? homeName
                    : seg.momentum === 'away'
                      ? awayName
                      : 'Neutral'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Minute markers */}
        <div className="relative h-5 mt-1">
          {MINUTE_MARKERS.map(min => {
            const leftPct = (min / maxMinute) * 100;
            return (
              <div
                key={min}
                className="absolute -translate-x-1/2 text-[10px] text-zinc-500"
                style={{ left: `${leftPct}%` }}
              >
                <div className="w-px h-1.5 bg-zinc-600 mx-auto mb-0.5" />
                {min}&apos;
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
