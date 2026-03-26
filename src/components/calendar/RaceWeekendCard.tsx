// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Flag,
  ChevronDown,
  ChevronUp,
  Ruler,
  CornerUpRight,
  Clock,
  Bot,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { TrackLayout } from '@/components/tracks/TrackLayout';
import { CircuitStats } from '@/components/tracks/CircuitStats';
import { HistoricalWeatherBadge } from '@/components/weather/HistoricalWeatherBadge';
import { SessionSchedule } from '@/components/calendar/SessionSchedule';
import { RegionSelector } from '@/components/ui/RegionSelector';
import { formatDate, isInPast } from '@/lib/utils';
import type { Race } from '@/types';

interface RaceSession {
  id: string;
  sessionName: string;
  sessionType: string;
  startDatetime: string;
  endDatetime?: string | null;
}

interface BroadcastChannel {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isStreaming: boolean | null;
  region?: string;
}

interface ExtendedCircuit {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode?: string;
  lengthMeters?: number;
  turns?: number;
  lapRecordTime?: string;
  lapRecordDriver?: string;
  lapRecordYear?: number;
  circuitType?: string;
  direction?: string;
  firstGrandPrixYear?: number;
  layoutImageUrl?: string;
}

interface RaceWeekendCardProps {
  race: Race & { circuit?: ExtendedCircuit };
  sessions?: RaceSession[];
  broadcasts?: Record<string, BroadcastChannel[]>;
  showCountdown?: boolean;
  compact?: boolean;
  defaultExpanded?: boolean;
}

export function RaceWeekendCard({
  race,
  sessions = [],
  broadcasts = {},
  compact = false,
  defaultExpanded = false,
}: RaceWeekendCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isPast = isInPast(race.raceDatetime);

  // Format track length helper
  const formatLength = (meters: number) => {
    return `${(meters / 1000).toFixed(3)} km`;
  };

  return (
    <Card
      className={`overflow-hidden transition-all ${isPast ? 'opacity-60' : ''}`}
    >
      <div className="relative">
        {/* Race round indicator */}
        <div className="absolute left-0 top-0 flex h-full w-12 items-center justify-center bg-zinc-800 border-r border-zinc-700">
          <span className="text-lg font-bold text-white">R{race.round}</span>
        </div>

        <CardContent className={`pl-16 ${compact ? 'py-3' : 'py-4'}`}>
          {/* Main content row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}
                >
                  <Link
                    href={`/calendar/${race.slug}`}
                    className="hover:text-emerald-400"
                  >
                    {race.name}
                  </Link>
                </h3>
                {race.isSprintWeekend && (
                  <Badge variant="warning" className="text-xs">
                    Sprint
                  </Badge>
                )}
                {race.status === 'completed' && (
                  <Badge variant="secondary" className="text-xs">
                    Completed
                  </Badge>
                )}
              </div>

              {/* Info row */}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                {race.circuit && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {race.circuit.name}, {race.circuit.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(race.raceDatetime, 'MMM d, yyyy')}
                </span>
              </div>

              {/* Action links for races */}
              <div className="mt-2 flex flex-wrap gap-2">
                {isPast ? (
                  <>
                    <Link
                      href={`/races/${race.id}/debrief`}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <Bot className="h-3 w-3" />
                      AI Debrief
                    </Link>
                    <Link
                      href={`/predictions/${race.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Prediction
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/calendar/${race.slug}`}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    Race Preview
                  </Link>
                )}
              </div>

              {/* Quick stats row - visible when not expanded */}
              {!compact && !isExpanded && race.circuit && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  {race.circuit.lengthMeters && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {formatLength(race.circuit.lengthMeters)}
                    </span>
                  )}
                  {race.circuit.turns && (
                    <span className="flex items-center gap-1">
                      <CornerUpRight className="h-3 w-3" />
                      {race.circuit.turns} turns
                    </span>
                  )}
                  {race.circuit.slug && (
                    <HistoricalWeatherBadge
                      circuitSlug={race.circuit.slug}
                      variant="compact"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Right side - expand button & flag */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!compact && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="hidden sm:inline">More</span>
                    </>
                  )}
                </button>
              )}
              <div className="flex h-8 w-12 items-center justify-center rounded bg-zinc-800">
                <Flag className="h-4 w-4 text-zinc-500" />
              </div>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && race.circuit && (
            <div className="mt-4 pt-4 border-t border-zinc-700/50">
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Track Layout */}
                <div className="lg:col-span-1">
                  <h4 className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Track Layout
                  </h4>
                  <TrackLayout
                    circuitSlug={race.circuit.slug}
                    layoutImageUrl={race.circuit.layoutImageUrl}
                    className="w-full"
                  />
                </div>

                {/* Circuit Stats */}
                <div className="lg:col-span-1">
                  <h4 className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Circuit Info
                  </h4>
                  <div className="space-y-2">
                    {/* Basic stats grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {race.circuit.lengthMeters && (
                        <div className="rounded bg-zinc-800/50 px-3 py-2">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Ruler className="h-3 w-3" />
                            <span className="text-[10px]">Length</span>
                          </div>
                          <p className="font-semibold text-white text-sm">
                            {formatLength(race.circuit.lengthMeters)}
                          </p>
                        </div>
                      )}
                      {race.circuit.turns && (
                        <div className="rounded bg-zinc-800/50 px-3 py-2">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <CornerUpRight className="h-3 w-3" />
                            <span className="text-[10px]">Turns</span>
                          </div>
                          <p className="font-semibold text-white text-sm">
                            {race.circuit.turns}
                          </p>
                        </div>
                      )}
                      {race.circuit.firstGrandPrixYear && (
                        <div className="rounded bg-zinc-800/50 px-3 py-2">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            <span className="text-[10px]">First GP</span>
                          </div>
                          <p className="font-semibold text-white text-sm">
                            {race.circuit.firstGrandPrixYear}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Lap Record */}
                    {race.circuit.lapRecordTime && (
                      <div className="rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 px-3 py-2">
                        <div className="flex items-center gap-1 text-purple-400">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-medium">
                            Lap Record
                          </span>
                        </div>
                        <p className="font-bold font-mono text-white">
                          {race.circuit.lapRecordTime}
                        </p>
                        {race.circuit.lapRecordDriver && (
                          <p className="text-[11px] text-zinc-400">
                            {race.circuit.lapRecordDriver}
                            {race.circuit.lapRecordYear &&
                              ` (${race.circuit.lapRecordYear})`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Circuit Type */}
                    <div className="flex flex-wrap gap-1.5">
                      {race.circuit.circuitType && (
                        <Badge
                          variant={
                            race.circuit.circuitType === 'street'
                              ? 'warning'
                              : race.circuit.circuitType === 'permanent'
                                ? 'success'
                                : 'default'
                          }
                          className="text-[10px]"
                        >
                          {race.circuit.circuitType}
                        </Badge>
                      )}
                      {race.circuit.direction && (
                        <Badge variant="secondary" className="text-[10px]">
                          {race.circuit.direction === 'clockwise'
                            ? 'Clockwise'
                            : 'Anti-clockwise'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather Prediction */}
                <div className="lg:col-span-1">
                  <h4 className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Typical Weather
                  </h4>
                  {race.circuit.slug && (
                    <HistoricalWeatherBadge
                      circuitSlug={race.circuit.slug}
                      variant="detailed"
                    />
                  )}
                </div>
              </div>

              {/* Session Schedule */}
              {sessions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Session Times
                    </h4>
                    <RegionSelector />
                  </div>
                  <SessionSchedule sessions={sessions} broadcasts={broadcasts} compact />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
