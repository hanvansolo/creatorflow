// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db, clubs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { GitCompareArrows, Swords, Shield } from 'lucide-react';
import { H2HWidget } from '@/components/widgets/ApiFootballWidget';
import TeamSearchSelector from '@/components/compare/TeamSearchSelector';

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

const POPULAR_MATCHUPS = [
  { team1: 'arsenal', team2: 'tottenham-hotspur', label: 'Arsenal vs Spurs' },
  { team1: 'manchester-united', team2: 'liverpool', label: 'Man Utd vs Liverpool' },
  { team1: 'real-madrid', team2: 'barcelona', label: 'Real Madrid vs Barcelona' },
  { team1: 'manchester-city', team2: 'arsenal', label: 'Man City vs Arsenal' },
  { team1: 'ac-milan', team2: 'inter-milan', label: 'AC Milan vs Inter' },
  { team1: 'bayern-munich', team2: 'borussia-dortmund', label: 'Bayern vs Dortmund' },
  { team1: 'chelsea', team2: 'arsenal', label: 'Chelsea vs Arsenal' },
  { team1: 'paris-saint-germain', team2: 'marseille', label: 'PSG vs Marseille' },
];

export default async function ComparePage({ searchParams }: PageProps) {
  const { team1, team2 } = await searchParams;

  const allClubs = await db.query.clubs.findMany({
    where: eq(clubs.isActive, true),
    orderBy: (clubs, { asc }) => [asc(clubs.name)],
    columns: {
      slug: true,
      name: true,
      shortName: true,
      logoUrl: true,
      primaryColor: true,
      apiFootballId: true,
    },
  });

  const club1 = team1 ? allClubs.find(c => c.slug === team1) : null;
  const club2 = team2 ? allClubs.find(c => c.slug === team2) : null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <GitCompareArrows className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Head to Head</h1>
              <p className="text-zinc-400 text-sm">Compare two teams — match history, results, and stats</p>
            </div>
          </div>
        </div>

        {/* Team selectors with search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <TeamSearchSelector
            clubs={allClubs}
            paramName="team1"
            otherParam={team2 || ''}
            selectedSlug={team1 || null}
            label="Team 1"
          />
          <TeamSearchSelector
            clubs={allClubs}
            paramName="team2"
            otherParam={team1 || ''}
            selectedSlug={team2 || null}
            label="Team 2"
          />
        </div>

        {/* Selected teams visual comparison header */}
        {club1 && club2 && (
          <div className="mb-6 flex items-center justify-center gap-5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-6 py-5">
            <div className="flex items-center gap-3">
              {club1.logoUrl ? (
                <img src={club1.logoUrl} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <Shield className="h-10 w-10 text-zinc-500" />
              )}
              <span className="text-lg font-bold text-white">{club1.shortName || club1.name}</span>
            </div>
            <Swords className="h-6 w-6 text-emerald-400" />
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">{club2.shortName || club2.name}</span>
              {club2.logoUrl ? (
                <img src={club2.logoUrl} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <Shield className="h-10 w-10 text-zinc-500" />
              )}
            </div>
          </div>
        )}

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

        {/* Popular comparisons */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Popular Rivalries</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {POPULAR_MATCHUPS.map((matchup) => (
              <Link
                key={`${matchup.team1}-${matchup.team2}`}
                href={`/compare?team1=${matchup.team1}&team2=${matchup.team2}`}
                className={`group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  team1 === matchup.team1 && team2 === matchup.team2
                    ? 'bg-emerald-600/10 border-emerald-500/30'
                    : 'bg-zinc-800/60 border-zinc-700/40 hover:border-emerald-500/20 hover:bg-zinc-800'
                }`}
              >
                <Swords className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {matchup.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
