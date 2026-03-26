// @ts-nocheck — Stub data returns 'any', will be properly typed when what-if is rewritten for Footy Feed
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircleQuestion, Eye, Calendar } from 'lucide-react';
import { getScenarioBySlug, getPopularScenarios } from '@/lib/api/what-if';
import { ConfidenceBadge, KeyFactorsList, AlternativeOutcomes, ScenarioCard, ShareButton } from '@/components/what-if';
import { generateBaseMetadata, generateAlternates } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const scenario = await getScenarioBySlug(slug);

  if (!scenario) {
    return { title: 'Scenario Not Found' };
  }

  return {
    ...generateBaseMetadata({
      title: `${scenario.question} - What If Simulator`,
      description: scenario.shortAnswer || `AI-powered analysis: ${scenario.question}`,
      tags: ['What If', 'football scenario', 'hypothetical football', scenario.scenarioType || 'analysis'],
    }),
    alternates: generateAlternates(`/what-if/${slug}`),
  };
}

const typeLabels: Record<string, string> = {
  driver_transfer: 'Transfer Scenario',
  historical: 'Historical Analysis',
  regulation: 'Regulation Change',
  championship: 'Championship Impact',
};

const typeColors: Record<string, string> = {
  driver_transfer: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  historical: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  regulation: 'text-green-400 bg-green-500/10 border-green-500/30',
  championship: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

export default async function ScenarioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const scenario = await getScenarioBySlug(slug);

  if (!scenario) {
    notFound();
  }

  const relatedScenarios = await getPopularScenarios(4);
  const filteredRelated = relatedScenarios.filter(s => s.id !== scenario.id).slice(0, 3);

  const keyFactors = scenario.keyFactors as Array<{ factor: string; impact: string }> | null;
  const alternativeOutcomes = scenario.alternativeOutcomes as Array<{
    scenario: string;
    probability: string;
    reasoning: string;
  }> | null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-br from-purple-500/10 via-zinc-900/50 to-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/what-if"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to What If Simulator
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <MessageCircleQuestion className="h-5 w-5 text-purple-400" />
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${typeColors[scenario.scenarioType]}`}>
              {typeLabels[scenario.scenarioType] || scenario.scenarioType}
            </span>
            {scenario.confidenceLevel && (
              <ConfidenceBadge level={scenario.confidenceLevel as 'high' | 'medium' | 'low' | 'speculative'} />
            )}
          </div>

          <h1 className="text-xl font-bold text-white sm:text-2xl mb-4">
            {scenario.question}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{scenario.viewCount || 0} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {scenario.createdAt
                  ? new Date(scenario.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recently'}
              </span>
            </div>
            <ShareButton title={scenario.question} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Short Answer */}
        {scenario.shortAnswer && (
          <div className="mb-8 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-zinc-800/50 p-6">
            <h2 className="text-sm font-medium text-purple-400 uppercase tracking-wide mb-2">
              The Short Answer
            </h2>
            <p className="text-lg text-white font-medium">
              {scenario.shortAnswer}
            </p>
          </div>
        )}

        {/* Detailed Analysis */}
        {scenario.detailedAnalysis && (
          <div className="mb-8 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h2>
            <div className="prose prose-invert prose-zinc max-w-none">
              {scenario.detailedAnalysis.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="text-zinc-300 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Key Factors */}
        {keyFactors && keyFactors.length > 0 && (
          <KeyFactorsList factors={keyFactors} className="mb-8" />
        )}

        {/* Alternative Outcomes */}
        {alternativeOutcomes && alternativeOutcomes.length > 0 && (
          <AlternativeOutcomes outcomes={alternativeOutcomes} className="mb-8" />
        )}

        {/* Tags */}
        {scenario.tags && scenario.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-2">
              Related Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {scenario.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-sm text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Scenarios */}
        {filteredRelated.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Explore More Scenarios</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {filteredRelated.map((s) => (
                <ScenarioCard key={s.id} scenario={s} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-zinc-500">
          <p>AI-generated analysis for entertainment purposes.</p>
          <p className="mt-1">Have another question? <Link href="/what-if" className="text-purple-400 hover:underline">Ask the simulator</Link></p>
        </div>
      </div>
    </div>
  );
}
