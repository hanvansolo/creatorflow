// @ts-nocheck
import { Metadata } from 'next';
import { MessageCircleQuestion, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { getPopularScenarios, getRecentScenarios } from '@/lib/api/what-if';
import { WhatIfSearch, ScenarioCard, SuggestedQuestions } from '@/components/what-if';
import { createPageMetadata } from '@/lib/seo';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';

export const metadata: Metadata = createPageMetadata(
  'Football What If Simulator - Explore Hypothetical Scenarios',
  'Explore hypothetical football scenarios with AI analysis. What if Mbappe stayed at PSG? What if VAR was removed? Player transfers, rule changes, and alternate histories.',
  '/what-if',
  ['football what if', 'hypothetical football', 'football scenarios', 'alternate football history', 'football simulator', 'football transfers', 'football rule changes']
);

export const dynamic = 'force-dynamic';

export default async function WhatIfPage() {
  const [popularScenarios, recentScenarios, locale] = await Promise.all([
    getPopularScenarios(6),
    getRecentScenarios(6),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  const suggestedQuestions = [
    "What if Mbappe had joined Real Madrid in 2022 instead of 2024?",
    "What if the Premier League introduced a salary cap?",
    "What if VAR was removed from football tomorrow?",
    "What if the Champions League was a league format from the start?",
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-br from-purple-500/10 via-zinc-900/50 to-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{t.whatIf.heading}</h1>
              <p className="text-sm text-zinc-400">{t.whatIf.subheading}</p>
            </div>
          </div>

          <p className="text-zinc-300 max-w-2xl mb-8">{t.whatIf.intro}</p>

          <WhatIfSearch />

          <SuggestedQuestions questions={suggestedQuestions} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Popular Scenarios */}
        {popularScenarios.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-white">{t.whatIf.popular}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {popularScenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Scenarios */}
        {recentScenarios.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-zinc-500" />
              <h2 className="text-lg font-semibold text-white">{t.whatIf.recent}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {recentScenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {popularScenarios.length === 0 && recentScenarios.length === 0 && (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-12 text-center">
            <MessageCircleQuestion className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{t.whatIf.none}</h3>
            <p className="text-zinc-400 max-w-md mx-auto">{t.whatIf.beFirst}</p>
          </div>
        )}
      </div>
    </div>
  );
}
