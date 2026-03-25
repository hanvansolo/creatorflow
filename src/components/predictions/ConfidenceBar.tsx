'use client';

interface ConfidenceBarProps {
  confidence: number; // 0-100
  compact?: boolean;
}

export function ConfidenceBar({ confidence, compact = false }: ConfidenceBarProps) {
  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  const getConfidenceLabel = (value: number) => {
    if (value >= 80) return 'High';
    if (value >= 60) return 'Medium';
    if (value >= 40) return 'Low';
    return 'Very Low';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getConfidenceColor(confidence)} transition-all`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{confidence.toFixed(0)}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Confidence</span>
        <span className="font-medium">
          {confidence.toFixed(0)}% ({getConfidenceLabel(confidence)})
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getConfidenceColor(confidence)} transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}
