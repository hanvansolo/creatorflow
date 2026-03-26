import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { GamesWidget } from '@/components/widgets/ApiFootballWidget';
import { Radio } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Live Scores - Football',
  'Real-time football live scores across all major leagues. Goals, cards, substitutions, and match events as they happen.',
  '/live',
  ['live scores', 'football live', 'real-time scores', 'live football', 'match updates']
);

export default function LiveScoresPage() {
  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <Radio className="h-6 w-6 text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-white">Live Scores</h1>
          </div>
          <p className="text-zinc-400 text-sm">Real-time scores and match events across all leagues</p>
        </div>

        {/* Games widget shows live matches by default with auto-refresh */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
          <GamesWidget />
        </div>
      </div>
    </div>
  );
}
