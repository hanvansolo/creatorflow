import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { GamesWidget } from '@/components/widgets/ApiFootballWidget';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Fixtures & Results - Football Matches',
  'Today\'s football fixtures and results. Live scores, upcoming matches, and recent results across all major leagues.',
  '/fixtures',
  ['football fixtures', 'match results', 'today football', 'upcoming matches', 'live scores']
);

export default function FixturesPage() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Fixtures & Results</h1>
          </div>
          <p className="text-zinc-400 text-sm">Live scores, today&apos;s matches, and recent results</p>
        </div>

        {/* Games widget with date selector built-in */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
          <GamesWidget />
        </div>
      </div>
    </div>
  );
}
