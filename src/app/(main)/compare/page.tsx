// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db, clubs } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { GitCompareArrows, Swords, Shield, Calendar, Target } from 'lucide-react';
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
      id: true,
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

  // Fetch H2H matches when both teams are selected
  let h2hMatches: any[] = [];
  let h2hSummary = { team1Wins: 0, team2Wins: 0, draws: 0, totalGoals: 0 };

  if (club1 && club2) {
    h2hMatches = await db.execute(sql`
      SELECT
        m.id,
        m.kickoff,
        m.home_score,
        m.away_score,
        m.home_club_id,
        m.away_club_id,
        hc.name AS home_club_name,
        hc.short_name AS home_club_short,
        hc.logo_url AS home_club_logo,
        ac.name AS away_club_name,
        ac.short_name AS away_club_short,
        ac.logo_url AS away_club_logo,
        comp.name AS competition_name,
        comp.short_name AS competition_short
      FROM matches m
      JOIN clubs hc ON m.home_club_id = hc.id
      JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status = 'finished'
        AND (
          (m.home_club_id = ${club1.id} AND m.away_club_id = ${club2.id})
          OR (m.home_club_id = ${club2.id} AND m.away_club_id = ${club1.id})
        )
      ORDER BY m.kickoff DESC
      LIMIT 10
    `) as any[];

    // Calculate summary
    for (const m of h2hMatches) {
      const hs = m.home_score ?? 0;
      const as_ = m.away_score ?? 0;
      h2hSummary.totalGoals += hs + as_;

      if (hs === as_) {
        h2hSummary.draws++;
      } else if (hs > as_) {
        // Home team won
        if (m.home_club_id === club1.id) h2hSummary.team1Wins++;
        else h2hSummary.team2Wins++;
      } else {
        // Away team won
        if (m.away_club_id === club1.id) h2hSummary.team1Wins++;
        else h2hSummary.team2Wins++;
      }
    }
  }

  const totalH2h = h2hSummary.team1Wins + h2hSummary.team2Wins + h2hSummary.draws;
  const t1Pct = totalH2h > 0 ? (h2hSummary.team1Wins / totalH2h) * 100 : 0;
  const drawPct = totalH2h > 0 ? (h2hSummary.draws / totalH2h) * 100 : 0;
  const t2Pct = totalH2h > 0 ? (h2hSummary.team2Wins / totalH2h) * 100 : 0;

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
              <p className="text-zinc-400 text-sm">Compare two teams -- match history, results, and stats</p>
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
                <img src={club1.logoUrl} alt={`${club1.name} logo`} className="h-10 w-10 object-contain" />
              ) : (
                <Shield className="h-10 w-10 text-zinc-500" />
              )}
              <span className="text-lg font-bold text-white">{club1.shortName || club1.name}</span>
            </div>
            <Swords className="h-6 w-6 text-emerald-400" />
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">{club2.shortName || club2.name}</span>
              {club2.logoUrl ? (
                <img src={club2.logoUrl} alt={`${club2.name} logo`} className="h-10 w-10 object-contain" />
              ) : (
                <Shield className="h-10 w-10 text-zinc-500" />
              )}
            </div>
          </div>
        )}

        {/* H2H Content */}
        {club1 && club2 ? (
          h2hMatches.length > 0 ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Head-to-Head Record</h2>
                  <span className="text-xs text-zinc-500 ml-auto">{totalH2h} matches | {h2hSummary.totalGoals} goals</span>
                </div>

                {/* Summary text */}
                <div className="flex items-center justify-center gap-3 mb-4 text-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{h2hSummary.team1Wins}</p>
                    <p className="text-xs text-zinc-500">{club1.shortName || club1.name} wins</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-2xl font-bold text-zinc-400">{h2hSummary.draws}</p>
                    <p className="text-xs text-zinc-500">Draws</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{h2hSummary.team2Wins}</p>
                    <p className="text-xs text-zinc-500">{club2.shortName || club2.name} wins</p>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="h-3 rounded-full overflow-hidden flex bg-zinc-700">
                  {t1Pct > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${t1Pct}%` }}
                    />
                  )}
                  {drawPct > 0 && (
                    <div
                      className="bg-zinc-500 transition-all duration-500"
                      style={{ width: `${drawPct}%` }}
                    />
                  )}
                  {t2Pct > 0 && (
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{ width: `${t2Pct}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Match history list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Match History</h2>
                </div>
                <div className="space-y-2">
                  {h2hMatches.map((m: any) => {
                    const hs = m.home_score ?? 0;
                    const as_ = m.away_score ?? 0;
                    return (
                      <div key={m.id} className="flex items-center gap-3 rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                        <span className="text-xs text-zinc-500 w-20 shrink-0 hidden sm:block">
                          {new Date(m.kickoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-medium text-zinc-200 truncate text-right">
                            {m.home_club_short || m.home_club_name}
                          </span>
                          {m.home_club_logo && (
                            <img src={m.home_club_logo} alt={`${m.home_club_short || m.home_club_name} logo`} className="h-5 w-5 object-contain shrink-0" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-white tabular-nums px-2 shrink-0">
                          {hs} - {as_}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {m.away_club_logo && (
                            <img src={m.away_club_logo} alt={`${m.away_club_short || m.away_club_name} logo`} className="h-5 w-5 object-contain shrink-0" />
                          )}
                          <span className="text-sm font-medium text-zinc-200 truncate">
                            {m.away_club_short || m.away_club_name}
                          </span>
                        </div>
                        {m.competition_short && (
                          <span className="text-[10px] text-zinc-500 shrink-0 hidden md:block">
                            {m.competition_short}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
              <Swords className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No head-to-head matches found between these teams.</p>
            </div>
          )
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
