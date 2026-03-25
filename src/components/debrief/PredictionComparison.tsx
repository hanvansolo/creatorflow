import { ArrowRight, Check, X } from 'lucide-react';

interface PredictionComparisonProps {
  predicted: { driverCode: string; position: number; teamColor: string }[];
  actual: { driverCode: string; position: number; teamColor: string }[];
}

export function PredictionComparison({ predicted, actual }: PredictionComparisonProps) {
  if (predicted.length === 0 || actual.length === 0) {
    return null;
  }

  const top10Predicted = predicted.slice(0, 10);
  const top10Actual = actual.slice(0, 10);
  const actualMap = new Map(actual.map(a => [a.driverCode, a.position]));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-lg font-bold text-white">Predicted vs Actual</h3>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4">
        {/* Header */}
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Predicted</div>
        <div />
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Actual</div>

        {top10Predicted.map((pred, index) => {
          const actualPos = actualMap.get(pred.driverCode);
          const isExact = actualPos === pred.position;
          const diff = actualPos != null ? actualPos - pred.position : null;

          return (
            <div key={pred.driverCode} className="contents">
              {/* Predicted */}
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-2.5 py-1.5 mb-1">
                <span className="w-5 text-right text-xs text-zinc-500">P{pred.position}</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: pred.teamColor }}
                >
                  {pred.driverCode}
                </span>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center mb-1">
                {isExact ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : diff != null ? (
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                ) : (
                  <X className="h-4 w-4 text-emerald-500" />
                )}
              </div>

              {/* Actual */}
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-2.5 py-1.5 mb-1">
                {top10Actual[index] && (
                  <>
                    <span className="w-5 text-right text-xs text-zinc-500">
                      P{top10Actual[index].position}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: top10Actual[index].teamColor }}
                    >
                      {top10Actual[index].driverCode}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
