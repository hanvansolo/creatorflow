// @ts-nocheck
import { Metadata } from 'next';
import { Scale, BookOpen, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { db, tacticalAnalysis } from '@/lib/db';
import { eq, or, asc } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Laws of the Game - Football Rules Explained',
  'All 17 Laws of the Game explained in plain English plus VAR protocol and modern handball rules. The complete guide to football rules for fans.',
  '/rules',
  ['laws of the game', 'football rules', 'offside rule explained', 'VAR rules', 'handball rule', 'penalty rules', 'football regulations', 'IFAB']
);

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function RulesPage({ searchParams }: PageProps) {
  const { q: query, category } = await searchParams;

  let rules = await db
    .select()
    .from(tacticalAnalysis)
    .where(
      or(
        eq(tacticalAnalysis.category, 'laws'),
        eq(tacticalAnalysis.category, 'var')
      )
    )
    .orderBy(asc(tacticalAnalysis.title));

  // Filter by category if specified
  if (category) {
    rules = rules.filter((r) => r.category === category);
  }

  // Filter by search query if specified
  if (query) {
    const q = query.toLowerCase();
    rules = rules.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.explanation.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t) => t?.toLowerCase().includes(q)))
    );
  }

  const lawsRules = rules.filter((r) => r.category === 'laws');
  const varRules = rules.filter((r) => r.category === 'var');

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-emerald-950/30 to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Laws of the Game</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            All 17 Laws of the Game plus VAR protocol, explained in plain English.
            Whether you are a new fan or a seasoned supporter, understand every rule that shapes football.
          </p>

          {/* Search & Filter */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <form className="flex-1 max-w-md" action="/rules" method="GET">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search rules... (e.g. offside, handball, VAR)"
                  defaultValue={query || ''}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <Link
                href="/rules"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  !category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                All
              </Link>
              <Link
                href="/rules?category=laws"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  category === 'laws'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                17 Laws
              </Link>
              <Link
                href="/rules?category=var"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  category === 'var'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                VAR & Special Rules
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex gap-8">
          {/* Left Sidebar - Table of Contents */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Quick Navigation
              </h2>
              <nav className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                {lawsRules.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-emerald-400 mt-3 mb-1">The 17 Laws</p>
                    {lawsRules.map((rule) => (
                      <a
                        key={rule.id}
                        href={`#${rule.slug}`}
                        className="block text-sm text-zinc-400 hover:text-white py-1 truncate transition-colors"
                      >
                        {rule.title}
                      </a>
                    ))}
                  </>
                )}
                {varRules.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-emerald-400 mt-4 mb-1">VAR & Special Rules</p>
                    {varRules.map((rule) => (
                      <a
                        key={rule.id}
                        href={`#${rule.slug}`}
                        className="block text-sm text-zinc-400 hover:text-white py-1 truncate transition-colors"
                      >
                        {rule.title}
                      </a>
                    ))}
                  </>
                )}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {rules.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No rules found</h2>
                <p className="text-zinc-400">
                  {query
                    ? `No rules match "${query}". Try a different search term.`
                    : 'Rules have not been loaded yet.'}
                </p>
                {query && (
                  <Link
                    href="/rules"
                    className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
                  >
                    Clear search
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Laws Section */}
                {lawsRules.length > 0 && (
                  <>
                    {!category && (
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Scale className="h-5 w-5 text-emerald-400" />
                        The 17 Laws of the Game
                      </h2>
                    )}
                    {lawsRules.map((rule) => (
                      <RuleCard key={rule.id} rule={rule} />
                    ))}
                  </>
                )}

                {/* VAR Section */}
                {varRules.length > 0 && (
                  <>
                    {!category && (
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mt-10">
                        <BookOpen className="h-5 w-5 text-emerald-400" />
                        VAR & Special Rules
                      </h2>
                    )}
                    {varRules.map((rule) => (
                      <RuleCard key={rule.id} rule={rule} />
                    ))}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: any }) {
  const concepts = (rule.keyConcepts || []) as Array<{ term: string; definition: string }>;

  return (
    <div
      id={rule.slug}
      className="scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <Link
              href={`/rules/${rule.slug}`}
              className="text-xl font-bold text-white hover:text-emerald-400 transition-colors"
            >
              {rule.title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  rule.category === 'var'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {rule.category === 'var' ? 'VAR & Special' : 'Law'}
              </span>
              {rule.difficulty && (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    rule.difficulty === 'advanced'
                      ? 'bg-red-500/20 text-red-400'
                      : rule.difficulty === 'intermediate'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {rule.difficulty}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/rules/${rule.slug}`}
            className="flex-shrink-0 rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            title="Read full rule"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Summary */}
        <p className="text-zinc-300 text-sm leading-relaxed mb-4">{rule.summary}</p>

        {/* Explanation Preview (first paragraph) */}
        <div className="text-zinc-400 text-sm leading-relaxed mb-4">
          {rule.explanation.split('\n\n')[0]}
        </div>

        {/* Key Concepts */}
        {concepts.length > 0 && (
          <div className="border-t border-zinc-800 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Key Points</h3>
            <ul className="space-y-1.5">
              {concepts.slice(0, 4).map((concept, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-emerald-400 font-medium flex-shrink-0">
                    {concept.term}:
                  </span>
                  <span className="text-zinc-400">{concept.definition}</span>
                </li>
              ))}
              {concepts.length > 4 && (
                <li className="text-sm">
                  <Link
                    href={`/rules/${rule.slug}`}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    + {concepts.length - 4} more key points
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Tags */}
        {rule.tags && rule.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {rule.tags.slice(0, 6).map((tag: string) => (
              <Link
                key={tag}
                href={`/rules?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
