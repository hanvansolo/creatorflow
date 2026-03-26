import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { StandingsWidget } from '@/components/widgets/ApiFootballWidget';
import { COMPETITIONS } from '@/lib/constants/competitions';
import Link from 'next/link';
import { Trophy, ArrowRight, LayoutGrid } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'League Tables - Football Standings',
  'Live league tables for Premier League, La Liga, Serie A, Bundesliga, Champions League and more.',
  '/tables',
  ['league table', 'football standings', 'Premier League table', 'La Liga table', 'Serie A table']
);

interface PageProps {
  searchParams: Promise<{ competition?: string }>;
}

const LEAGUE_COMPETITIONS = COMPETITIONS.filter(c => c.type === 'league');
const CUP_COMPETITIONS = COMPETITIONS.filter(c => c.type === 'cup');
const INTL_COMPETITIONS = COMPETITIONS.filter(c => c.type === 'international');

export default async function TablesPage({ searchParams }: PageProps) {
  const { competition } = await searchParams;
  const selectedSlug = competition || 'premier-league';
  const selected = COMPETITIONS.find(c => c.slug === selectedSlug) || COMPETITIONS[0];

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">League Tables</h1>
              <p className="text-zinc-400 text-sm">Live standings across all major competitions</p>
            </div>
          </div>
        </div>

        {/* Competition selector — grouped by type */}
        <div className="mb-8 space-y-4">
          {/* Leagues row */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Leagues</h3>
            <div className="flex flex-wrap gap-2">
              {LEAGUE_COMPETITIONS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/tables?competition=${comp.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedSlug === comp.slug
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName}
                </Link>
              ))}
            </div>
          </div>

          {/* Cups row */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Cups</h3>
            <div className="flex flex-wrap gap-2">
              {CUP_COMPETITIONS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/tables?competition=${comp.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedSlug === comp.slug
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName}
                </Link>
              ))}
            </div>
          </div>

          {/* International row */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">International</h3>
            <div className="flex flex-wrap gap-2">
              {INTL_COMPETITIONS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/tables?competition=${comp.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedSlug === comp.slug
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Selected competition info */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
            <p className="text-xs text-zinc-400">{selected.description}</p>
          </div>
          <LayoutGrid className="h-5 w-5 text-zinc-500" />
        </div>

        {/* Widget */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
          <StandingsWidget leagueId={selected.apiFootballId} />
        </div>

        {/* Related links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/fixtures?competition=${selected.slug}`}
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
              View Fixtures
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
          <Link
            href="/teams"
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
              View Teams
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
