'use client';

import {
  Ruler,
  CornerUpRight,
  Zap,
  Clock,
  User,
  Calendar,
  MapPin,
  Compass,
  Activity,
  Gauge,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  getCircuitHistoricalWeather,
  getCircuitCharacteristics,
} from '@/lib/constants/circuit-data';

interface CircuitStatsProps {
  circuit: {
    name: string;
    slug?: string;
    country: string;
    lengthMeters?: number | null;
    turns?: number | null;
    drsZones?: number | null;
    lapRecordTime?: string | null;
    lapRecordDriver?: string | null;
    lapRecordYear?: number | null;
    circuitType?: string | null;
    direction?: string | null;
    firstGrandPrixYear?: number | null;
  };
  variant?: 'compact' | 'full';
  showWeather?: boolean;
  showCharacteristics?: boolean;
}

export function CircuitStats({
  circuit,
  variant = 'compact',
  showWeather = false,
  showCharacteristics = false,
}: CircuitStatsProps) {
  const historicalWeather = circuit.slug
    ? getCircuitHistoricalWeather(circuit.slug)
    : null;
  const characteristics = circuit.slug
    ? getCircuitCharacteristics(circuit.slug)
    : null;

  // Format track length
  const formatLength = (meters: number) => {
    return `${(meters / 1000).toFixed(3)} km`;
  };

  // Get circuit type badge color
  const getCircuitTypeBadge = (type: string) => {
    switch (type) {
      case 'street':
        return (
          <Badge variant="warning" className="text-xs">
            Street
          </Badge>
        );
      case 'permanent':
        return (
          <Badge variant="success" className="text-xs">
            Permanent
          </Badge>
        );
      case 'semi-permanent':
        return (
          <Badge variant="default" className="text-xs">
            Semi-Permanent
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get characteristic badge colors
  const getCharacteristicBadge = (
    label: string,
    value: string,
    type: 'type' | 'tire' | 'overtaking' | 'safety'
  ) => {
    const colorMap: Record<string, Record<string, string>> = {
      type: {
        power: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        downforce: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        balanced: 'bg-green-500/20 text-green-400 border-green-500/30',
        street: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      tire: {
        low: 'bg-green-500/20 text-green-400 border-green-500/30',
        medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        extreme: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      },
      overtaking: {
        easy: 'bg-green-500/20 text-green-400 border-green-500/30',
        medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        very_hard: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      },
      safety: {
        low: 'bg-green-500/20 text-green-400 border-green-500/30',
        medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      },
    };

    const color = colorMap[type]?.[value] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';

    return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${color}`}
      >
        {label}: {value.replace('_', ' ')}
      </span>
    );
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        {circuit.lengthMeters && (
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {formatLength(circuit.lengthMeters)}
          </span>
        )}
        {circuit.turns && (
          <span className="flex items-center gap-1">
            <CornerUpRight className="h-3 w-3" />
            {circuit.turns} turns
          </span>
        )}
        {circuit.drsZones && (
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-green-500" />
            {circuit.drsZones} DRS
          </span>
        )}
        {circuit.circuitType && getCircuitTypeBadge(circuit.circuitType)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Basic Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {circuit.lengthMeters && (
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Ruler className="h-4 w-4" />
              <span className="text-xs">Length</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatLength(circuit.lengthMeters)}
            </p>
          </div>
        )}
        {circuit.turns && (
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <CornerUpRight className="h-4 w-4" />
              <span className="text-xs">Turns</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white">
              {circuit.turns}
            </p>
          </div>
        )}
        {circuit.drsZones && (
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-xs">DRS Zones</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white">
              {circuit.drsZones}
            </p>
          </div>
        )}
        {circuit.firstGrandPrixYear && (
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">First GP</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white">
              {circuit.firstGrandPrixYear}
            </p>
          </div>
        )}
      </div>

      {/* Lap Record */}
      {circuit.lapRecordTime && (
        <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3">
          <div className="flex items-center gap-2 text-purple-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Lap Record</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-white">
            {circuit.lapRecordTime}
          </p>
          {circuit.lapRecordDriver && (
            <p className="mt-1 text-sm text-zinc-400">
              <User className="mr-1 inline h-3 w-3" />
              {circuit.lapRecordDriver}
              {circuit.lapRecordYear && ` (${circuit.lapRecordYear})`}
            </p>
          )}
        </div>
      )}

      {/* Circuit Type & Direction */}
      <div className="flex flex-wrap items-center gap-2">
        {circuit.circuitType && getCircuitTypeBadge(circuit.circuitType)}
        {circuit.direction && (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-800/50 px-2 py-1 text-xs text-zinc-400">
            <Compass className="h-3 w-3" />
            {circuit.direction === 'clockwise' ? 'Clockwise' : 'Anti-clockwise'}
          </span>
        )}
      </div>

      {/* Characteristics */}
      {showCharacteristics && characteristics && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-300">
            Circuit Characteristics
          </h4>
          <div className="flex flex-wrap gap-2">
            {getCharacteristicBadge('Type', characteristics.type, 'type')}
            {getCharacteristicBadge(
              'Tire Wear',
              characteristics.tireWear,
              'tire'
            )}
            {getCharacteristicBadge(
              'Overtaking',
              characteristics.overtakingDifficulty,
              'overtaking'
            )}
            {getCharacteristicBadge(
              'Safety Car',
              characteristics.safetyCarLikelihood,
              'safety'
            )}
          </div>
          {characteristics.keyCorners.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-zinc-400">Key corners: </span>
              <span className="text-xs text-white">
                {characteristics.keyCorners.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Historical Weather */}
      {showWeather && historicalWeather && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-300">
            Typical Race Weekend Weather
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded bg-zinc-800/50 px-3 py-2">
              <span className="text-xs text-zinc-400">Avg Temp</span>
              <p className="font-semibold text-white">
                {historicalWeather.avgTempC}°C
              </p>
            </div>
            <div className="rounded bg-zinc-800/50 px-3 py-2">
              <span className="text-xs text-zinc-400">Track Temp</span>
              <p className="font-semibold text-white">
                {historicalWeather.avgTrackTempC}°C
              </p>
            </div>
            <div className="rounded bg-zinc-800/50 px-3 py-2">
              <span className="text-xs text-zinc-400">Humidity</span>
              <p className="font-semibold text-white">
                {historicalWeather.avgHumidity}%
              </p>
            </div>
            <div className="rounded bg-zinc-800/50 px-3 py-2">
              <span className="text-xs text-zinc-400">Rain Chance</span>
              <p
                className={`font-semibold ${
                  historicalWeather.rainChance > 30
                    ? 'text-blue-400'
                    : 'text-white'
                }`}
              >
                {historicalWeather.rainChance}%
              </p>
            </div>
          </div>
          {historicalWeather.notes && (
            <p className="text-xs text-zinc-500 italic">
              {historicalWeather.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
