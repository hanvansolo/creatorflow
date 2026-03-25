import { Scale, Wrench, DollarSign, BookOpen } from 'lucide-react';
import { RegulationBadge } from './RegulationBadge';
import type { RegulationPreview } from '@/lib/api/regulations';

interface RegulationFooterProps {
  regulations: RegulationPreview[];
}

const categoryIcons = {
  sporting: Scale,
  technical: Wrench,
  financial: DollarSign,
};

const categoryTextColors = {
  sporting: 'text-blue-400',
  technical: 'text-orange-400',
  financial: 'text-green-400',
};

export function RegulationFooter({ regulations }: RegulationFooterProps) {
  if (!regulations || regulations.length === 0) return null;

  const grouped = regulations.reduce((acc, reg) => {
    const cat = reg.category as keyof typeof categoryIcons;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(reg);
    return acc;
  }, {} as Record<string, RegulationPreview[]>);

  const categories = Object.keys(grouped) as Array<keyof typeof categoryIcons>;

  return (
    <section className="mt-8 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-white">Related Regulations</h3>
        </div>
        <a
          href="#full-regulations"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          View full text below
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = categoryIcons[category];
          const textColor = categoryTextColors[category];
          const regs = grouped[category];

          return (
            <div key={category}>
              <div className={`flex items-center gap-2 mb-2 ${textColor}`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {category} Regulations
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {regs.map((reg) => (
                  <RegulationBadge key={reg.id} regulation={reg} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Hover over badges for quick summaries, or scroll down for full official text and simplified explanations.
      </p>
    </section>
  );
}
