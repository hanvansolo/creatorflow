// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db, clubs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { GitCompareArrows } from 'lucide-react';
import { H2HWidget } from '@/components/widgets/ApiFootballWidget';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Head to Head - Compare Teams',
  'Compare two football teams head-to-head. View match history, recent results, and stats between any two clubs.',
  '/compare',
  ['head to head', 'h2h', 'compare teams', 'match history']
);

interface PageProps {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { team1, team2 } = await searchParams;

  const allClubs = await db.query.clubs.findMany({
    where: eq(clubs.isActive, true),
    orderBy: (clubs, { asc }) => [asc(clubs.name)],
  });

  const club1 = team1 ? allClubs.find(c => c.slug === team1) : null;
  const club2 = team2 ? allClubs.find(c => c.slug === team2) : null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <GitCompareArrows className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Head to Head</h1>
          </div>
          <p className="text-zinc-400 text-sm">Compare two teams — match history, results, and stats</p>
        </div>

        {/* Team selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Team 1</label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto rounded-lg bg-zinc-800 border border-zinc-700 p-3">
              {allClubs.slice(0, 50).map(c => (
                <Link
                  key={c.slug}
                  href={`/compare?team1=${c.slug}&team2=${team2 || ''}`}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    team1 === c.slug
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {c.shortName || c.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Team 2</label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto rounded-lg bg-zinc-800 border border-zinc-700 p-3">
              {allClubs.slice(0, 50).map(c => (
                <Link
                  key={c.slug}
                  href={`/compare?team1=${team1 || ''}&team2=${c.slug}`}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    team2 === c.slug
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {c.shortName || c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* H2H Widget */}
        {club1?.apiFootballId && club2?.apiFootballId ? (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50">
            <H2HWidget teamId1={club1.apiFootballId} teamId2={club2.apiFootballId} />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <GitCompareArrows className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">
              {!team1 && !team2
                ? 'Select two teams above to compare their head-to-head record'
                : 'Select both teams to see the comparison'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
