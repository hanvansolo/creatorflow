'use client';

import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
} from 'lucide-react';
import { getCircuitHistoricalWeather } from '@/lib/constants/circuit-data';

interface HistoricalWeatherBadgeProps {
  circuitSlug: string;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function HistoricalWeatherBadge({
  circuitSlug,
  variant = 'compact',
  className = '',
}: HistoricalWeatherBadgeProps) {
  const weather = getCircuitHistoricalWeather(circuitSlug);

  if (!weather) {
    return null;
  }

  // Determine icon based on typical conditions and rain chance
  const getWeatherIcon = () => {
    if (weather.rainChance >= 40) {
      return <CloudRain className="h-4 w-4 text-blue-400" />;
    }
    if (weather.rainChance >= 25) {
      return <Cloud className="h-4 w-4 text-gray-400" />;
    }
    if (weather.typicalCondition === 'hot') {
      return <Sun className="h-4 w-4 text-yellow-400" />;
    }
    return <CloudSun className="h-4 w-4 text-gray-300" />;
  };

  // Get condition color
  const getConditionColor = () => {
    switch (weather.typicalCondition) {
      case 'hot':
        return 'text-orange-400';
      case 'tropical':
        return 'text-emerald-400';
      case 'mild':
        return 'text-green-400';
      case 'cool':
        return 'text-blue-300';
      case 'cold':
        return 'text-blue-400';
      default:
        return 'text-zinc-400';
    }
  };

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-1.5 text-xs ${className}`}
        title={`Historical: ${weather.avgTempC}°C, ${weather.rainChance}% rain chance${weather.notes ? ` - ${weather.notes}` : ''}`}
      >
        {getWeatherIcon()}
        <span className={getConditionColor()}>{weather.avgTempC}°C</span>
        {weather.rainChance >= 20 && (
          <span className="flex items-center gap-0.5 text-blue-400">
            <Droplets className="h-3 w-3" />
            {weather.rainChance}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg bg-zinc-800/50 border border-zinc-700 p-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getWeatherIcon()}
          <span className="text-sm font-medium text-zinc-300">
            Typical Conditions
          </span>
        </div>
        <span
          className={`text-xs font-medium capitalize ${getConditionColor()}`}
        >
          {weather.typicalCondition}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-zinc-400">
            <Thermometer className="h-3 w-3" />
          </div>
          <p className="mt-1 font-semibold text-white">{weather.avgTempC}°C</p>
          <p className="text-[10px] text-zinc-500">Air Temp</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-zinc-400">
            <Thermometer className="h-3 w-3 text-orange-400" />
          </div>
          <p className="mt-1 font-semibold text-white">
            {weather.avgTrackTempC}°C
          </p>
          <p className="text-[10px] text-zinc-500">Track Temp</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-zinc-400">
            <Droplets className="h-3 w-3 text-blue-400" />
          </div>
          <p
            className={`mt-1 font-semibold ${weather.rainChance >= 30 ? 'text-blue-400' : 'text-white'}`}
          >
            {weather.rainChance}%
          </p>
          <p className="text-[10px] text-zinc-500">Rain</p>
        </div>
      </div>

      {weather.notes && (
        <p className="mt-2 text-[11px] text-zinc-500 italic text-center">
          {weather.notes}
        </p>
      )}
    </div>
  );
}
