// @ts-nocheck
'use client';

import { Radio, Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import type { Session, Weather } from '@/lib/api/openf1/types';
import { format } from 'date-fns';

interface SessionHeaderProps {
  session: Session;
  weather: Weather | null;
  isLive: boolean;
  lastUpdated: Date | null;
}

export function SessionHeader({ session, weather, isLive, lastUpdated }: SessionHeaderProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Session Info */}
        <div>
          <div className="flex items-center gap-3">
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
            <h1 className="text-xl font-bold text-white">{session.session_name}</h1>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
            <span>{session.circuit_short_name}</span>
            <span>•</span>
            <span>{session.country_name}</span>
            {!isLive && (
              <>
                <span>•</span>
                <span>{format(new Date(session.date_start), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>

        {/* Weather */}
        {weather && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Thermometer className="h-4 w-4" />
              <span>Air {Math.round(weather.air_temperature)}°C</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-orange-400">Track {Math.round(weather.track_temperature)}°C</span>
            </div>
            {weather.rainfall > 0 && (
              <div className="flex items-center gap-1.5 text-blue-400">
                <Droplets className="h-4 w-4" />
                <span>Rain</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Wind className="h-4 w-4" />
              <span>{Math.round(weather.wind_speed)} m/s</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Cloud className="h-4 w-4" />
              <span>{Math.round(weather.humidity)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
          <Radio className="h-3 w-3" />
          <span>
            Last updated: {format(lastUpdated, 'HH:mm:ss')}
            {isLive && ' (auto-refreshing)'}
          </span>
        </div>
      )}
    </div>
  );
}
