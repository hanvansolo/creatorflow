import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { GamesWidget } from '@/components/widgets/ApiFootballWidget';
import { COMPETITIONS } from '@/lib/constants/competitions';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Fixtures & Results - Football Matches',
  'Today\'s football fixtures and results. Live scores, upcoming matches, and recent results across all major leagues.',
  '/fixtures',
  ['football fixtures', 'match results', 'today football', 'upcoming matches', 'live scores']
);

interface PageProps {
  searchParams: Promise<{ date?: string; competition?: string }>;
}

function getDateString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const QUICK_FILTERS = COMPETITIONS.filter(
  c => ['premier-league', 'la-liga', 'serie-a', 'bundesliga', 'ligue-1', 'champions-league', 'europa-league', 'fa-cup'].includes(c.slug)
);

export default async function FixturesPage({ searchParams }: PageProps) {
  const { date, competition } = await searchParams;

  const today = getDateString(0);
  const yesterday = getDateString(-1);
  const tomorrow = getDateString(1);
  const activeDate = date || today;

  const selectedComp = competition
    ? COMPETITIONS.find(c => c.slug === competition)
    : null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Fixtures & Results</h1>
              <p className="text-zinc-400 text-sm">Live scores, today&apos;s matches, and recent results</p>
            </div>
          </div>
        </div>

        {/* Quick date navigation */}
        <div className="mb-5 flex items-center gap-2">
          <Link
            href={`/fixtures?date=${yesterday}${competition ? `&competition=${competition}` : ''}`}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/fixtures?date=${yesterday}${competition ? `&competition=${competition}` : ''}`}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              activeDate === yesterday
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'
            }`}
          >
            Yesterday
          </Link>
          <Link
            href={`/fixtures?date=${today}${competition ? `&competition=${competition}` : ''}`}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              activeDate === today
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'
            }`}
          >
            Today
          </Link>
          <Link
            href={`/fixtures?date=${tomorrow}${competition ? `&competition=${competition}` : ''}`}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              activeDate === tomorrow
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'
            }`}
          >
            Tomorrow
          </Link>
          <Link
            href={`/fixtures?date=${tomorrow}${competition ? `&competition=${competition}` : ''}`}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Competition filter pills */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/fixtures?date=${activeDate}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                !competition
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              All
            </Link>
            {QUICK_FILTERS.map((comp) => (
              <Link
                key={comp.slug}
                href={`/fixtures?date=${activeDate}&competition=${comp.slug}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  competition === comp.slug
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {comp.shortName}
              </Link>
            ))}
          </div>
        </div>

        {/* Tip banner */}
        <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-4 py-2.5">
          <Info className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-zinc-400">
            Tap any match for detailed stats, lineups, and events
          </p>
        </div>

        {/* Widget */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
          <GamesWidget
            date={activeDate}
            leagueId={selectedComp?.apiFootballId}
          />
        </div>
      </div>
    </div>
  );
}
