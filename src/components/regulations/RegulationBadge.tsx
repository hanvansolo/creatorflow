'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scale, Wrench, DollarSign, ChevronRight, BookOpen } from 'lucide-react';
import type { RegulationPreview } from '@/lib/api/regulations';

interface RegulationBadgeProps {
  regulation: RegulationPreview;
  showHoverCard?: boolean;
}

const categoryConfig = {
  sporting: {
    icon: Scale,
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/10',
    label: 'Sporting',
  },
  technical: {
    icon: Wrench,
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    hoverBg: 'hover:bg-orange-500/10',
    label: 'Technical',
  },
  financial: {
    icon: DollarSign,
    color: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    hoverBg: 'hover:bg-green-500/10',
    label: 'Financial',
  },
};

export function RegulationBadge({ regulation, showHoverCard = true }: RegulationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = categoryConfig[regulation.category as keyof typeof categoryConfig] || categoryConfig.sporting;
  const Icon = config.icon;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/regulations/${regulation.articleNumber}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          border ${config.borderColor} ${config.hoverBg} transition-colors
          bg-zinc-800/50 ${config.textColor}`}
      >
        <Icon className="h-3 w-3" />
        <span>Art. {regulation.articleNumber}</span>
      </Link>

      {showHoverCard && isHovered && (
        <div className="absolute left-0 top-full pt-1 z-50 w-80 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden mt-1">
            <div className={`${config.color} px-4 py-2`}>
              <div className="flex items-center gap-2 text-white">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">{config.label} Regulations</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-sm font-bold text-white mb-1">
                Article {regulation.articleNumber}
              </h4>
              <p className="text-xs text-zinc-400 mb-3">{regulation.articleTitle}</p>

              {regulation.simplifiedExplanation && (
                <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                  {regulation.simplifiedExplanation.length > 150
                    ? regulation.simplifiedExplanation.substring(0, 150) + '...'
                    : regulation.simplifiedExplanation}
                </p>
              )}

              {regulation.keyPoints && regulation.keyPoints.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {regulation.keyPoints.slice(0, 2).map((point, idx) => (
                    <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className={`mt-1 h-1 w-1 rounded-full ${config.color} flex-shrink-0`} />
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {regulation.matchedKeywords && regulation.matchedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {regulation.matchedKeywords.slice(0, 3).map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href={`/regulations/${regulation.articleNumber}`}
                className={`inline-flex items-center gap-1 text-xs font-medium ${config.textColor} hover:underline`}
              >
                <BookOpen className="h-3 w-3" />
                Read full regulation
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
