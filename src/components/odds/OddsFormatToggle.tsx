'use client';

import { type OddsFormat } from '@/lib/utils/odds-format';

interface OddsFormatToggleProps {
  format: OddsFormat;
  onFormatChange: (format: OddsFormat) => void;
}

const OPTIONS: { value: OddsFormat; label: string }[] = [
  { value: 'decimal', label: 'DEC' },
  { value: 'fractional', label: 'FRAC' },
  { value: 'american', label: 'US' },
];

export function OddsFormatToggle({ format, onFormatChange }: OddsFormatToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-700/50 overflow-hidden">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onFormatChange(opt.value)}
          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
            format === opt.value
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
          } ${opt.value !== 'decimal' ? 'border-l border-zinc-700/50' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
