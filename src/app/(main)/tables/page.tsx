import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { StandingsWidget } from '@/components/widgets/ApiFootballWidget';
import { COMPETITIONS } from '@/lib/constants/competitions';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

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

export default async function TablesPage({ searchParams }: PageProps) {
  const { competition } = await searchParams;
  const selectedSlug = competition || 'premier-league';
  const selected = COMPETITIONS.find(c => c.slug === selectedSlug) || COMPETITIONS[0];

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">League Tables</h1>
          </div>
          <p className="text-zinc-400 text-sm">Live standings across all major competitions</p>
        </div>

        {/* Competition selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {LEAGUE_COMPETITIONS.map((comp) => (
            <Link
              key={comp.slug}
              href={`/tables?competition=${comp.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                selectedSlug === comp.slug
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {comp.shortName}
            </Link>
          ))}
        </div>

        {/* Widget */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
          <StandingsWidget leagueId={selected.apiFootballId} />
        </div>
      </div>
    </div>
  );
}
