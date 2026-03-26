// @ts-nocheck
'use client';

import type { DriverPrediction } from '@/types/predictions';
import { PredictionCard } from './PredictionCard';
import { Card } from '@/components/ui/Card';

interface PredictionsListProps {
  predictions: DriverPrediction[];
  raceName: string;
  showFactors?: boolean;
}

export function PredictionsList({
  predictions,
  raceName,
  showFactors = false,
}: PredictionsListProps) {
  const podiumPredictions = predictions.slice(0, 3);
  const restPredictions = predictions.slice(3, 10);
  const backmarkers = predictions.slice(10);

  return (
    <div className="space-y-6">
      {/* Podium Predictions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Predicted Podium</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {podiumPredictions.map((prediction, index) => (
            <PredictionCard
              key={prediction.driverId}
              prediction={prediction}
              isPodium
              podiumPosition={index + 1}
              showFactors={showFactors}
            />
          ))}
        </div>
      </div>

      {/* Rest of Top 10 */}
      {restPredictions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Positions 4-10</h3>
          <div className="space-y-2">
            {restPredictions.map((prediction) => (
              <PredictionCard
                key={prediction.driverId}
                prediction={prediction}
                compact={!showFactors}
                showFactors={showFactors}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Backmarkers */}
      {backmarkers.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Rest of Grid</h3>
          <div className="space-y-2">
            {backmarkers.map((prediction) => (
              <PredictionCard
                key={prediction.driverId}
                prediction={prediction}
                compact
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function PredictionsListCompact({
  predictions,
}: {
  predictions: DriverPrediction[];
}) {
  return (
    <div className="space-y-1">
      {predictions.slice(0, 5).map((prediction) => (
        <div
          key={prediction.driverId}
          className="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span className="font-mono font-bold w-6 text-gray-400">
            P{prediction.predictedPosition}
          </span>
          <div
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: prediction.teamColor }}
          />
          <span className="font-medium">{prediction.driverCode}</span>
          <span className="text-gray-400 text-xs ml-auto">
            {prediction.confidenceScore.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
