// @ts-nocheck
interface StatComparisonBarProps {
  label: string;
  value1: number;
  value2: number;
  color1: string;
  color2: string;
  format?: (v: number) => string;
}

export function StatComparisonBar({
  label,
  value1,
  value2,
  color1,
  color2,
  format = (v) => String(v),
}: StatComparisonBarProps) {
  const max = Math.max(value1, value2, 1);
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;
  const isEqual = value1 === value2;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span
          className="font-bold text-sm"
          style={{ color: value1 >= value2 && !isEqual ? color1 : undefined }}
        >
          {format(value1)}
        </span>
        <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
        <span
          className="font-bold text-sm"
          style={{ color: value2 >= value1 && !isEqual ? color2 : undefined }}
        >
          {format(value2)}
        </span>
      </div>
      <div className="flex gap-1">
        {/* Left bar (grows from right to left) */}
        <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-l-full bg-zinc-800">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{ width: `${pct1}%`, backgroundColor: color1 }}
          />
        </div>
        {/* Right bar (grows from left to right) */}
        <div className="flex h-2 flex-1 overflow-hidden rounded-r-full bg-zinc-800">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{ width: `${pct2}%`, backgroundColor: color2 }}
          />
        </div>
      </div>
    </div>
  );
}
