// @ts-nocheck
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { db, matches } from '@/lib/db';
import { sql, gt, inArray } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { Radio, ArrowRight, Zap, Calendar, Trophy, Goal } from 'lucide-react';
import { COMPETITIONS } from '@/lib/constants/competitions';
import { CompetitionSelector } from '@/components/competitions';
import { LiveMatchCard } from '@/components/live/LiveMatchCard';
import { AdSlot } from '@/components/ads/AdSlot';
import { HorizontalAd } from '@/components/ads/ProfitableAds';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

const ALL_COMPETITIONS = COMPETITIONS.map(c => ({
  name: c.name,
  slug: c.slug,
  shortName: c.shortName,
  type: c.type,
  country: c.country,
  countryCode: c.countryCode,
  description: c.description,
}));

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Live Scores - Football',
  'Real-time football live scores across all major leagues. Goals, cards, substitutions, and match events as they happen.',
  '/live',
  ['live scores', 'football live', 'real-time scores', 'live football', 'match updates']
);

interface LiveMatch {
  id: string;
  kickoff: string;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
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

interface MatchEvent {
  match_id: string;
  event_type: string;
  minute: number;
  added_time: number | null;
  player_name: string | null;
  club_id: string;
}

async function getLiveMatches(): Promise<LiveMatch[]> {
  try {
    const rows = await db.execute(sql`
      SELECT
        m.id, m.kickoff, m.status, m.minute, m.home_score, m.away_score,
        m.home_score_ht, m.away_score_ht,
        hc.name as home_name, hc.slug as home_slug, hc.code as home_code, hc.primary_color as home_color, hc.logo_url as home_logo,
        ac.name as away_name, ac.slug as away_slug, ac.code as away_code, ac.primary_color as away_color, ac.logo_url as away_logo,
        comp.name as competition_name, comp.slug as competition_slug, comp.logo_url as competition_logo
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY comp.name, m.kickoff
    `);
    return (rows as any[]) as LiveMatch[];
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    return [];
  }
}

async function getMatchEvents(matchIds: string[]): Promise<MatchEvent[]> {
  if (matchIds.length === 0) return [];
  try {
    const rows = await db.execute(sql`
      SELECT
        me.match_id, me.event_type, me.minute, me.added_time, me.club_id,
        COALESCE(p.known_as, p.first_name || ' ' || p.last_name) as player_name
      FROM match_events me
      LEFT JOIN players p ON me.player_id = p.id
      WHERE me.match_id = ANY(${matchIds})
      ORDER BY me.minute, me.added_time
    `);
    return (rows as any[]) as MatchEvent[];
  } catch (error) {
    console.error('Failed to fetch match events:', error);
    return [];
  }
}

function groupByCompetition(matches: LiveMatch[]): Record<string, LiveMatch[]> {
  const groups: Record<string, LiveMatch[]> = {};
  for (const m of matches) {
    const key = m.competition_name || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}

interface PageProps {
  searchParams: Promise<{ competition?: string }>;
}

export default async function LiveScoresPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const p = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const { competition } = await searchParams;

  // Count live matches from DB
  const liveStatuses = ['live', 'halftime', 'extra_time', 'penalties'];
  const liveCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(inArray(matches.status, liveStatuses));
  const liveCount = Number(liveCountResult[0]?.count || 0);

  // Find next upcoming match if none live
  let nextMatch: { kickoff: Date } | null = null;
  if (liveCount === 0) {
    const upcoming = await db.query.matches.findFirst({
      where: gt(matches.kickoff, new Date()),
      orderBy: (matches, { asc }) => [asc(matches.kickoff)],
      columns: { kickoff: true },
    });
    nextMatch = upcoming || null;
  }

  // Calculate time until next match
  let timeUntilNext = '';
  if (nextMatch) {
    const diff = new Date(nextMatch.kickoff).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      timeUntilNext = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      timeUntilNext = `${hours}h ${minutes}m`;
    } else {
      timeUntilNext = `${minutes} minutes`;
    }
  }

  // Fetch live match details and events
  const allLiveMatches = await getLiveMatches();
  const liveMatches = competition
    ? allLiveMatches.filter(m => m.competition_slug === competition)
    : allLiveMatches;
  const matchIds = liveMatches.map(m => m.id);
  const events = await getMatchEvents(matchIds);
  const grouped = groupByCompetition(liveMatches);
  const competitionNames = Object.keys(grouped);

  // Build events lookup by match ID
  const eventsByMatch: Record<string, MatchEvent[]> = {};
  for (const evt of events) {
    if (!eventsByMatch[evt.match_id]) eventsByMatch[evt.match_id] = [];
    eventsByMatch[evt.match_id].push(evt);
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with prominent LIVE indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Radio className="h-5 w-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">{t.live.heading}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {t.common.live}
                </span>
              </div>
              <p className="text-zinc-400 text-sm">{t.live.subheading}</p>
            </div>
          </div>
        </div>

        {/* Match count / status banner */}
        <div className="mb-6 rounded-lg border border-zinc-700/40 bg-zinc-800/60 px-5 py-4">
          {liveCount > 0 ? (
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {liveCount} {t.live.countLive}
                </p>
                <p className="text-xs text-zinc-400">{t.live.refreshHint}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-300">{t.live.noneLive}</p>
                <p className="text-xs text-zinc-400">
                  {timeUntilNext
                    ? `${t.live.nextMatchIn} ${timeUntilNext}`
                    : t.live.checkFixtures}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ad below match count banner */}
        <div className="my-4">
          <HorizontalAd />
        </div>

        {/* Competition selector */}
        <CompetitionSelector
          competitions={ALL_COMPETITIONS}
          selectedSlug={competition || ''}
          basePath="/live"
        />

        {/* Live matches grouped by competition */}
        {competitionNames.length > 0 ? (
          <div className="space-y-6">
            {competitionNames.map((compName) => (
              <div key={compName} className="rounded-xl overflow-hidden border border-emerald-500/20">
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
                </div>

                {/* Match cards */}
                <div className="space-y-2 p-2">
                  {grouped[compName].map((match) => {
                    const matchGoals = eventsByMatch[match.id] || [];

                    return (
                      <LiveMatchCard
                        key={match.id}
                        match={match}
                        events={matchGoals}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : liveCount === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-6 py-16 text-center">
            <Radio className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">{t.live.noneLive}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {timeUntilNext
                ? `${t.live.nextMatchIn} ${timeUntilNext}.`
                : t.live.checkFixtures}
            </p>
          </div>
        ) : null}

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`${p}/fixtures`}
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                {t.live.viewFixtures}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
          <Link
            href={`${p}/tables`}
            className="group flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                {t.live.viewTables}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
