'use client';

import type { DriverPrediction } from '@/types/predictions';
import { Card } from '@/components/ui/Card';
import { ConfidenceBar } from './ConfidenceBar';

interface PredictionCardProps {
  prediction: DriverPrediction;
  isPodium?: boolean;
  podiumPosition?: number;
  compact?: boolean;
  showFactors?: boolean;
}

const PODIUM_STYLES = {
  1: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
  2: 'border-gray-300 bg-gray-50 dark:bg-gray-800/50',
  3: 'border-amber-600 bg-amber-50 dark:bg-amber-950/20',
} as const;

const PODIUM_BADGES = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
} as const;

export function PredictionCard({
  prediction,
  isPodium = false,
  podiumPosition,
  compact = false,
  showFactors = false,
}: PredictionCardProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold w-8 text-center text-gray-500">
            P{prediction.predictedPosition}
          </span>
          <div
            className="w-1 h-8 rounded-full"
            style={{ backgroundColor: prediction.teamColor }}
          />
          <div>
            <span className="font-medium">{prediction.driverName}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              {prediction.teamName}
            </span>
          </div>
        </div>
        <ConfidenceBar confidence={prediction.confidenceScore} compact />
      </div>
    );
  }

  return (
    <Card
      className={`p-4 border-2 transition-all ${
        isPodium && podiumPosition
          ? PODIUM_STYLES[podiumPosition as 1 | 2 | 3]
          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isPodium && podiumPosition && (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                PODIUM_BADGES[podiumPosition as 1 | 2 | 3]
              }`}
            >
              {podiumPosition}
            </div>
          )}
          {!isPodium && (
            <span className="font-mono text-2xl font-bold text-gray-400">
              {prediction.predictedPosition}
            </span>
          )}
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: prediction.teamColor }}
        />
      </div>

      <h3 className="text-xl font-bold">{prediction.driverName}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {prediction.teamName}
      </p>

      <ConfidenceBar confidence={prediction.confidenceScore} />

      {showFactors && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
          <FactorRow
            label="Championship Form"
            value={prediction.factors.championshipForm}
          />
          <FactorRow
            label="Circuit History"
            value={prediction.factors.circuitHistory}
          />
          <FactorRow
            label="Team Performance"
            value={prediction.factors.teamPerformance}
          />
          <FactorRow
            label="Weather Adjustment"
            value={prediction.factors.weatherAdjustment}
            isNeutral={Math.abs(prediction.factors.weatherAdjustment - 0.5) < 0.05}
          />
          <FactorRow
            label="Qualifying Pace"
            value={prediction.factors.qualifyingEstimate}
          />
        </div>
      )}
    </Card>
  );
}

function FactorRow({
  label,
  value,
  isNeutral = false,
}: {
  label: string;
  value: number;
  isNeutral?: boolean;
}) {
  const percentage = (value * 100).toFixed(0);
  const getColor = () => {
    if (isNeutral) return 'text-gray-500';
    if (value >= 0.7) return 'text-green-600 dark:text-green-400';
    if (value >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${getColor()}`}>
        {percentage}%
        {isNeutral && <span className="text-gray-400 text-xs ml-1">(N/A)</span>}
      </span>
    </div>
  );
}
