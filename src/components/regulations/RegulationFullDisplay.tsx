import { Scale, Wrench, DollarSign, Check, ExternalLink } from 'lucide-react';
import type { F1Regulation } from '@/lib/api/regulations';

interface RegulationFullDisplayProps {
  regulation: F1Regulation;
}

const categoryConfig = {
  sporting: {
    icon: Scale,
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgGradient: 'from-blue-500/10 to-transparent',
    label: 'Sporting Regulations',
  },
  technical: {
    icon: Wrench,
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgGradient: 'from-orange-500/10 to-transparent',
    label: 'Technical Regulations',
  },
  financial: {
    icon: DollarSign,
    color: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgGradient: 'from-green-500/10 to-transparent',
    label: 'Financial Regulations',
  },
};

export function RegulationFullDisplay({ regulation }: RegulationFullDisplayProps) {
  const config = categoryConfig[regulation.category as keyof typeof categoryConfig] || categoryConfig.sporting;
  const Icon = config.icon;

  return (
    <div
      id={`regulation-${regulation.articleNumber}`}
      className={`relative overflow-hidden rounded-xl border ${config.borderColor} bg-zinc-900`}
    >
      {/* Gradient background accent */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} opacity-50`} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className={`${config.color} px-5 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-white" />
              <div>
                <span className="text-xs font-semibold uppercase text-white/70">{config.label}</span>
                <h3 className="text-lg font-bold text-white">
                  Article {regulation.articleNumber}
                </h3>
              </div>
            </div>
            {regulation.sourceUrl && (
              <a
                href={regulation.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                FIA Source
              </a>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="px-5 py-4 border-b border-zinc-800">
          <h4 className="text-base font-semibold text-white">
            {regulation.articleTitle}
          </h4>
          {regulation.chapter && (
            <p className="text-xs text-zinc-500 mt-1">Chapter: {regulation.chapter}</p>
          )}
        </div>

        {/* In Simple Terms */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-800/30">
          <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="h-1 w-4 bg-emerald-500 rounded-full" />
            In Simple Terms
          </h5>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {regulation.simplifiedExplanation || 'Simplified explanation not available.'}
          </p>

          {/* Key Points */}
          {regulation.keyPoints && regulation.keyPoints.length > 0 && (
            <ul className="mt-4 space-y-2">
              {regulation.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className={`h-4 w-4 ${config.textColor} flex-shrink-0 mt-0.5`} />
                  <span className="text-zinc-400">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Official FIA Text */}
        <div className="px-5 py-4">
          <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className={`h-1 w-4 ${config.color} rounded-full`} />
            Official FIA Text
          </h5>
          <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono">
              {regulation.officialText}
            </p>
          </div>
        </div>

        {/* Related Topics & Keywords */}
        {((regulation.relatedTopics && regulation.relatedTopics.length > 0) ||
          (regulation.keywords && regulation.keywords.length > 0)) && (
          <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-800/20">
            <div className="flex flex-wrap gap-2">
              {regulation.relatedTopics?.map((topic, idx) => (
                <span
                  key={`topic-${idx}`}
                  className={`px-2 py-1 text-xs rounded-full ${config.borderColor} border ${config.textColor}`}
                >
                  {topic}
                </span>
              ))}
              {regulation.keywords?.slice(0, 5).map((keyword, idx) => (
                <span
                  key={`keyword-${idx}`}
                  className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Season Year */}
        <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-600">
          {regulation.seasonYear} Season Regulations
        </div>
      </div>
    </div>
  );
}
