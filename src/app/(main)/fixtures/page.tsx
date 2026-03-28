// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { COMPETITIONS } from '@/lib/constants/competitions';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronLeft, ChevronRight, Info, Clock } from 'lucide-react';
import { CompetitionSelector } from '@/components/competitions';
import { AdSlot } from '@/components/ads/AdSlot';

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

interface MatchRow {
  id: string;
  kickoff: string;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  slug: string;
  round: string | null;
  referee: string | null;
  home_name: string;
  home_slug: string;
  home_code: string | null;
  home_color: string | null;
  home_logo: string | null;
  away_name: string;
  away_slug: string;
  away_code: string | null;
  away_color: string | null;
  away_logo: string | null;
  competition_name: string;
  competition_slug: string;
  competition_logo: string | null;
}

function getDateString(offset: number, baseDate?: string): string {
  const d = baseDate ? new Date(baseDate + 'T12:00:00Z') : new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function formatKickoff(kickoff: string): string {
  const d = new Date(kickoff);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const ALL_COMPETITIONS = COMPETITIONS.map(c => ({
  name: c.name,
  slug: c.slug,
  shortName: c.shortName,
  type: c.type,
  country: c.country,
  countryCode: c.countryCode,
  description: c.description,
}));

async function getMatches(date: string, competitionSlug?: string) {
  try {
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;

    let query;
    if (competitionSlug) {
      query = await db.execute(sql`
        SELECT
          m.id, m.kickoff, m.status, m.minute, m.home_score, m.away_score, m.slug, m.round, m.referee,
          m.home_score_ht, m.away_score_ht,
          hc.name as home_name, hc.slug as home_slug, hc.code as home_code, hc.primary_color as home_color, hc.logo_url as home_logo,
          ac.name as away_name, ac.slug as away_slug, ac.code as away_code, ac.primary_color as away_color, ac.logo_url as away_logo,
          comp.name as competition_name, comp.slug as competition_slug, comp.logo_url as competition_logo
        FROM matches m
        INNER JOIN clubs hc ON m.home_club_id = hc.id
        INNER JOIN clubs ac ON m.away_club_id = ac.id
        LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
        LEFT JOIN competitions comp ON cs.competition_id = comp.id
        WHERE m.kickoff >= ${startDate}::timestamptz AND m.kickoff < ${endDate}::timestamptz
          AND comp.slug = ${competitionSlug}
        ORDER BY comp.name, m.kickoff
      `);
    } else {
      query = await db.execute(sql`
        SELECT
          m.id, m.kickoff, m.status, m.minute, m.home_score, m.away_score, m.slug, m.round, m.referee,
          m.home_score_ht, m.away_score_ht,
          hc.name as home_name, hc.slug as home_slug, hc.code as home_code, hc.primary_color as home_color, hc.logo_url as home_logo,
          ac.name as away_name, ac.slug as away_slug, ac.code as away_code, ac.primary_color as away_color, ac.logo_url as away_logo,
          comp.name as competition_name, comp.slug as competition_slug, comp.logo_url as competition_logo
        FROM matches m
        INNER JOIN clubs hc ON m.home_club_id = hc.id
        INNER JOIN clubs ac ON m.away_club_id = ac.id
        LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
        LEFT JOIN competitions comp ON cs.competition_id = comp.id
        WHERE m.kickoff >= ${startDate}::timestamptz AND m.kickoff < ${endDate}::timestamptz
        ORDER BY comp.name, m.kickoff
      `);
    }

    return (query as any[]) as MatchRow[];
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return [];
  }
}

function groupByCompetition(matches: MatchRow[]): Record<string, MatchRow[]> {
  const groups: Record<string, MatchRow[]> = {};
  for (const m of matches) {
    const key = m.competition_name || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}

function StatusBadge({ status, minute }: { status: string; minute: number | null }) {
  if (status === 'finished') {
    return <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">FT</span>;
  }
  if (status === 'halftime') {
    return <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">HT</span>;
  }
  if (['live', 'extra_time', 'penalties'].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        {minute ? `${minute}'` : 'LIVE'}
      </span>
    );
  }
  if (status === 'postponed') {
    return <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">PPD</span>;
  }
  return null;
}

export default async function FixturesPage({ searchParams }: PageProps) {
  const { date, competition } = await searchParams;

  const today = getDateString(0);
  const yesterday = getDateString(-1);
  const tomorrow = getDateString(1);
  const activeDate = date || today;

  // Compute prev/next relative to activeDate
  const prevDate = getDateString(-1, activeDate);
  const nextDate = getDateString(1, activeDate);

  const selectedComp = competition
    ? COMPETITIONS.find(c => c.slug === competition)
    : null;

  const matches = await getMatches(activeDate, competition || undefined);
  const grouped = groupByCompetition(matches);
  const competitionNames = Object.keys(grouped);

  // Format display date
  const displayDate = new Date(activeDate + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
            href={`/fixtures?date=${prevDate}${competition ? `&competition=${competition}` : ''}`}
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
            href={`/fixtures?date=${nextDate}${competition ? `&competition=${competition}` : ''}`}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Competition selector */}
        <CompetitionSelector
          competitions={ALL_COMPETITIONS}
          selectedSlug={competition || ''}
          basePath="/fixtures"
          extraParams={`&date=${activeDate}`}
        />

        {/* Ad below competition selector */}
        <div className="my-4">
          <AdSlot format="horizontal" />
        </div>

        {/* Date display */}
        <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-4 py-2.5">
          <Info className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-zinc-400">
            {displayDate} — {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Matches grouped by competition */}
        {competitionNames.length > 0 ? (
          <div className="space-y-6">
            {competitionNames.map((compName) => (
              <div key={compName} className="rounded-xl overflow-hidden border border-zinc-700/50">
                {/* Competition header */}
                <div className="flex items-center gap-2.5 bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-700/50">
                  {grouped[compName][0]?.competition_logo && (
                    <Image
                      src={grouped[compName][0].competition_logo!}
                      alt={compName}
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain"
                    />
                  )}
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{compName}</span>
                  {grouped[compName][0]?.round && (
                    <span className="text-[10px] text-zinc-500 ml-auto">{grouped[compName][0].round}</span>
                  )}
                </div>

                {/* Match rows */}
                <div className="divide-y divide-zinc-800/50">
                  {grouped[compName].map((match) => {
                    const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(match.status);
                    const isFinished = match.status === 'finished';
                    const isScheduled = match.status === 'scheduled';

                    return (
                      <Link
                        href={`/matches/${match.id}`}
                        key={match.id}
                        className={`flex items-center px-4 py-3 bg-zinc-900 hover:bg-zinc-800/50 transition-colors ${
                          isLive ? 'border-l-2 border-l-emerald-500' : ''
                        }`}
                      >
                        {/* Home team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className={`text-sm truncate text-right ${isFinished && (match.home_score ?? 0) > (match.away_score ?? 0) ? 'text-white font-semibold' : 'text-zinc-300'}`}>
                            <span className="hidden sm:inline">{match.home_name}</span>
                            <span className="sm:hidden">{match.home_code || match.home_name?.slice(0, 3).toUpperCase()}</span>
                          </span>
                          {match.home_logo ? (
                            <Image src={match.home_logo} alt={match.home_name} width={22} height={22} className="h-[22px] w-[22px] object-contain shrink-0" />
                          ) : (
                            <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: match.home_color || '#52525b' }} />
                          )}
                        </div>

                        {/* Score / Time */}
                        <div className="flex flex-col items-center mx-4 min-w-[70px]">
                          {isScheduled ? (
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm font-medium">{formatKickoff(match.kickoff)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                                {match.home_score ?? 0}
                              </span>
                              <span className="text-zinc-600 text-xs">-</span>
                              <span className={`text-lg font-bold ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                                {match.away_score ?? 0}
                              </span>
                            </div>
                          )}
                          <StatusBadge status={match.status} minute={match.minute} />
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {match.away_logo ? (
                            <Image src={match.away_logo} alt={match.away_name} width={22} height={22} className="h-[22px] w-[22px] object-contain shrink-0" />
                          ) : (
                            <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: match.away_color || '#52525b' }} />
                          )}
                          <span className={`text-sm truncate ${isFinished && (match.away_score ?? 0) > (match.home_score ?? 0) ? 'text-white font-semibold' : 'text-zinc-300'}`}>
                            <span className="hidden sm:inline">{match.away_name}</span>
                            <span className="sm:hidden">{match.away_code || match.away_name?.slice(0, 3).toUpperCase()}</span>
                          </span>
                        </div>

                        {/* Odds indicator for scheduled matches */}
                        {match.status === 'scheduled' && (
                          <span className="text-[9px] text-emerald-400 ml-2">Odds &rarr;</span>
                        )}

                        {/* Referee (desktop only) */}
                        {match.referee && (
                          <span className="hidden lg:block text-[10px] text-zinc-600 ml-3 shrink-0">{match.referee}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-6 py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">No matches scheduled for this date.</p>
            <p className="text-xs text-zinc-500 mt-1">Try selecting a different date or competition.</p>
          </div>
        )}
      </div>
    </div>
  );
}
