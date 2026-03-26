// @ts-nocheck — Stub API data typed as 'any', will be properly typed when rewritten for Footy Feed
import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Cpu, Flame, Gauge, Settings, Zap } from 'lucide-react';
import { getDeepDives, getDeepDiveCategories } from '@/lib/api/technical-deep-dives';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'Football Tactical Deep-Dives - Tactics & Strategy Explained',
  'Understand football tactics from beginner to expert. In-depth analysis of formations, pressing systems, set pieces, transitions, and match strategy explained simply.',
  '/deep-dives',
  ['football tactics', 'football analysis', 'formations explained', 'pressing systems', 'match strategy', 'football for beginners', 'VAR explained']
);

export const dynamic = 'force-dynamic';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  aerodynamics: {
    icon: <Gauge className="h-5 w-5" />,
    label: 'Aerodynamics',
    color: 'text-blue-400 bg-blue-500/10',
  },
  power_unit: {
    icon: <Zap className="h-5 w-5" />,
    label: 'Power Unit',
    color: 'text-yellow-400 bg-yellow-500/10',
  },
  regulations: {
    icon: <BookOpen className="h-5 w-5" />,
    label: 'Regulations',
    color: 'text-purple-400 bg-purple-500/10',
  },
  strategy: {
    icon: <Settings className="h-5 w-5" />,
    label: 'Strategy',
    color: 'text-green-400 bg-green-500/10',
  },
  tyres: {
    icon: <Flame className="h-5 w-5" />,
    label: 'Tyres',
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  technology: {
    icon: <Cpu className="h-5 w-5" />,
    label: 'Technology',
    color: 'text-cyan-400 bg-cyan-500/10',
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-emerald-500/20 text-emerald-400',
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function DeepDivesPage({ searchParams }: PageProps) {
  const { category: selectedCategory } = await searchParams;
  const [deepDives, categories] = await Promise.all([
    getDeepDives(selectedCategory, 30),
    getDeepDiveCategories(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Technical Deep-Dives</h1>
          <p className="mt-2 text-zinc-400">
            Understand the tactics and strategy behind football
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/deep-dives"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All
          </Link>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const categoryData = categories.find(c => c.category === key);
            const count = categoryData?.count || 0;

            return (
              <Link
                key={key}
                href={`/deep-dives?category=${key}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {config.icon}
                {config.label}
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-zinc-700 px-2 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Deep-Dives Grid */}
        {deepDives.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">
              No deep-dives available yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Check back later as we analyze technical topics from the latest F1 news
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deepDives.map(deepDive => {
              const categoryConfig = CATEGORY_CONFIG[deepDive.category] || CATEGORY_CONFIG.technology;
              const difficultyColor = DIFFICULTY_COLORS[deepDive.difficulty || 'intermediate'];

              return (
                <Link
                  key={deepDive.id}
                  href={`/deep-dives/${deepDive.slug}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:bg-zinc-800/50"
                >
                  {/* Category & Difficulty */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${categoryConfig.color}`}>
                      {categoryConfig.icon}
                      {categoryConfig.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyColor}`}>
                      {deepDive.difficulty}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {deepDive.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {deepDive.summary}
                  </p>

                  {/* Tags */}
                  {deepDive.tags && deepDive.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {deepDive.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* View Count */}
                  <div className="mt-4 text-xs text-zinc-500">
                    {deepDive.viewCount} views
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
