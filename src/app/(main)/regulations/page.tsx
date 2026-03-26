// @ts-nocheck — Stub API data typed as 'any', will be properly typed when rewritten for Footy Feed
import { Metadata } from 'next';
import Link from 'next/link';
import { Scale, Wrench, DollarSign, Search, BookOpen, ChevronRight, Filter } from 'lucide-react';
import { getAllRegulations, searchRegulations } from '@/lib/api/regulations';
import { RegulationFullDisplay } from '@/components/regulations/RegulationFullDisplay';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'Football Rules 2026 - Regulations Explained in Plain English',
  'Every football regulation explained simply. Browse match rules, VAR protocols, and financial fair play with official text alongside fan-friendly plain English summaries.',
  '/regulations',
  ['football rules', 'football regulations', 'VAR rules', 'offside rule', 'match regulations', 'football 2026 rules', 'football rules explained']
);

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

const categoryConfig = {
  sporting: {
    icon: Scale,
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    label: 'Sporting',
    description: 'Race procedures, penalties, and conduct rules',
  },
  technical: {
    icon: Wrench,
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    label: 'Technical',
    description: 'Car specifications, dimensions, and components',
  },
  financial: {
    icon: DollarSign,
    color: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    label: 'Financial',
    description: 'Cost cap, budget limits, and financial rules',
  },
};

export default async function RegulationsPage({ searchParams }: PageProps) {
  const { q: query, category } = await searchParams;

  // Fetch regulations based on search/filter
  let regulations;
  if (query) {
    regulations = await searchRegulations(query, category, 50);
  } else {
    regulations = await getAllRegulations();
    if (category) {
      regulations = regulations.filter(r => r.category === category);
    }
  }

  // Group by category for display when not searching
  const grouped = regulations.reduce((acc, reg) => {
    if (!acc[reg.category]) acc[reg.category] = [];
    acc[reg.category].push(reg);
    return acc;
  }, {} as Record<string, typeof regulations>);

  const categories = Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white">Football Rules</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            Browse all football regulations with simplified explanations. Search for specific rules
            or browse by category. Every regulation includes the official text and a fan-friendly summary.
          </p>

          {/* Search Form */}
          <form className="mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search regulations... (e.g., 'safety car', 'DRS', 'cost cap')"
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/regulations"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              !category
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            All
          </Link>
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            const isActive = category === cat;
            return (
              <Link
                key={cat}
                href={`/regulations?category=${cat}${query ? `&q=${query}` : ''}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? `${config.color} border-transparent text-white`
                    : `${config.borderColor} ${config.textColor} hover:bg-zinc-800`
                }`}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </Link>
            );
          })}
        </div>

        {/* Search/Filter Results Info */}
        {(query || category) && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-zinc-400">
              {query ? (
                <>
                  Found <span className="font-bold text-white">{regulations.length}</span> regulations matching &quot;{query}&quot;
                  {category && <span> in {categoryConfig[category as keyof typeof categoryConfig]?.label}</span>}
                </>
              ) : (
                <>
                  Showing <span className="font-bold text-white">{regulations.length}</span> {categoryConfig[category as keyof typeof categoryConfig]?.label.toLowerCase()} regulations
                </>
              )}
            </p>
            <Link
              href="/regulations"
              className="text-sm text-emerald-500 hover:text-emerald-400"
            >
              {query ? 'Clear search' : 'View all categories'}
            </Link>
          </div>
        )}

        {/* Regulations Display */}
        {regulations.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No regulations found</h3>
            <p className="text-zinc-500">
              {query
                ? `Try a different search term or browse by category.`
                : `Regulations haven't been loaded yet. Run the scraper to populate the database.`}
            </p>
          </div>
        ) : (query || category) ? (
          // Search/filter results - show flat grid
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regulations.map((reg) => {
              const config = categoryConfig[reg.category as keyof typeof categoryConfig];
              return (
                <Link
                  key={reg.id}
                  href={`/regulations/${reg.articleNumber}`}
                  className={`group p-4 rounded-xl border ${config?.borderColor || 'border-zinc-700'} bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold ${config?.textColor || 'text-zinc-400'}`}>
                      Art. {reg.articleNumber}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                    {reg.articleTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {reg.simplifiedExplanation || reg.officialText.substring(0, 100) + '...'}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          // Browse mode - show grouped by category
          <div className="space-y-12">
            {categories.map((cat) => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              const regs = grouped[cat];
              if (!regs || regs.length === 0) return null;

              return (
                <section key={cat}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{config.label} Regulations</h2>
                        <p className="text-sm text-zinc-500">{config.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-zinc-500">{regs.length} articles</span>
                  </div>

                  {/* Regulations Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {regs.slice(0, 9).map((reg) => (
                      <Link
                        key={reg.id}
                        href={`/regulations/${reg.articleNumber}`}
                        className={`group p-4 rounded-xl border ${config.borderColor} bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs font-bold ${config.textColor}`}>
                            Art. {reg.articleNumber}
                          </span>
                          <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                          {reg.articleTitle}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-2">
                          {reg.simplifiedExplanation || reg.officialText.substring(0, 100) + '...'}
                        </p>
                      </Link>
                    ))}
                  </div>

                  {regs.length > 9 && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/regulations?category=${cat}`}
                        className={`inline-flex items-center gap-2 text-sm ${config.textColor} hover:underline`}
                      >
                        View all {regs.length} {config.label.toLowerCase()} regulations
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
