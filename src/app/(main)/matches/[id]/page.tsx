// @ts-nocheck
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { matchEvents, matchStats, matchAnalysis, players, clubs } from '@/lib/db/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { getFixtureEvents, getFixtureStatistics, getFixtureOdds, getLiveOdds, mapEventType, getFixtureLineups, getFixturePlayerStats, getFixturePredictions, getFixtureInjuries } from '@/lib/api/football-api';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Users,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  BarChart3,
  Activity,
  Target,
  ListOrdered,
  Star,
  Brain,
  AlertTriangle,
  Shirt,
} from 'lucide-react';
import { OddsPanel } from '@/components/odds';
import { getOrLoadSquad } from '@/lib/api/player-loader';

export const dynamic = 'force-dynamic';

async function getMatch(id: string) {
  const result = await db.execute(sql`
    SELECT
      m.*,
      hc.name as home_name, hc.slug as home_slug, hc.code as home_code,
      hc.primary_color as home_color, hc.logo_url as home_logo, hc.api_football_id as home_api_id,
      ac.name as away_name, ac.slug as away_slug, ac.code as away_code,
      ac.primary_color as away_color, ac.logo_url as away_logo, ac.api_football_id as away_api_id,
      comp.name as competition_name, comp.slug as competition_slug, comp.type as competition_type,
      v.name as venue_name, v.city as venue_city
    FROM matches m
    INNER JOIN clubs hc ON m.home_club_id = hc.id
    INNER JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    LEFT JOIN venues v ON m.venue_id = v.id
    WHERE m.id = ${id}
  `);
  return result.rows?.[0] ?? result[0] ?? null;
}

async function getMatchEvents(matchId: string) {
  const result = await db.execute(sql`
    SELECT
      me.*,
      p.first_name as player_first_name, p.last_name as player_last_name, p.known_as as player_known_as,
      sp.first_name as second_player_first_name, sp.last_name as second_player_last_name, sp.known_as as second_player_known_as,
      c.name as club_name, c.code as club_code
    FROM match_events me
    LEFT JOIN players p ON me.player_id = p.id
    LEFT JOIN players sp ON me.second_player_id = sp.id
    LEFT JOIN clubs c ON me.club_id = c.id
    WHERE me.match_id = ${matchId}
    ORDER BY me.minute ASC, me.added_time ASC NULLS FIRST
  `);
  return result.rows ?? result ?? [];
}

async function getMatchStats(matchId: string) {
  const result = await db.execute(sql`
    SELECT
      ms.*,
      c.name as club_name, c.code as club_code
    FROM match_stats ms
    INNER JOIN clubs c ON ms.club_id = c.id
    WHERE ms.match_id = ${matchId}
  `);
  return result.rows ?? result ?? [];
}

async function getMatchAnalysis(matchId: string) {
  const result = await db.execute(sql`
    SELECT * FROM match_analysis
    WHERE match_id = ${matchId}
    ORDER BY created_at DESC
    LIMIT 5
  `);
  return result.rows ?? result ?? [];
}

function getPlayerName(event: any) {
  return event.player_known_as || `${event.player_first_name ?? ''} ${event.player_last_name ?? ''}`.trim() || event.club_name || 'Unknown';
}

function getSecondPlayerName(event: any) {
  return event.second_player_known_as || `${event.second_player_first_name ?? ''} ${event.second_player_last_name ?? ''}`.trim() || '';
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'goal':
    case 'penalty_scored':
      return '\u26BD';
    case 'own_goal':
      return '\u26BD\uFE0F (OG)';
    case 'penalty_missed':
      return '\u274C';
    case 'yellow_card':
      return '\uD83D\uDFE8';
    case 'second_yellow':
      return '\uD83D\uDFE8\uD83D\uDFE5';
    case 'red_card':
      return '\uD83D\uDFE5';
    case 'substitution':
      return '\u21D4';
    case 'var_decision':
      return '\uD83D\uDCFA';
    default:
      return '\u25CF';
  }
}

function isGoalEvent(eventType: string) {
  return ['goal', 'penalty_scored', 'own_goal'].includes(eventType);
}

function StatusBadge({ status, minute }: { status: string; minute?: number }) {
  if (status === 'live' || status === 'extra_time') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-bold text-red-400 border border-red-500/30">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        LIVE {minute ? `${minute}'` : ''}
      </div>
    );
  }
  if (status === 'halftime') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-bold text-amber-400 border border-amber-500/30">
        HT
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700 px-4 py-1.5 text-sm font-bold text-zinc-300 border border-zinc-600">
        FT
      </span>
    );
  }
  if (status === 'penalties') {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-bold text-purple-400 border border-purple-500/30">
        PEN
      </span>
    );
  }
  if (status === 'postponed') {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-500/20 px-4 py-1.5 text-sm font-bold text-orange-400 border border-orange-500/30">
        POSTPONED
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700 px-4 py-1.5 text-sm font-bold text-zinc-500 border border-zinc-600">
        CANCELLED
      </span>
    );
  }
  // scheduled — show kickoff time
  return null;
}

function StatBar({
  label,
  homeValue,
  awayValue,
  isPercentage = false,
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  isPercentage?: boolean;
}) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
  const homeWins = homeValue > awayValue;
  const awayWins = awayValue > homeValue;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={homeWins ? 'font-bold text-emerald-400' : 'text-zinc-400'}>
          {homeValue}{isPercentage ? '%' : ''}
        </span>
        <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
        <span className={awayWins ? 'font-bold text-emerald-400' : 'text-zinc-400'}>
          {awayValue}{isPercentage ? '%' : ''}
        </span>
      </div>
      <div className="flex h-2 gap-1 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-l-full transition-all ${homeWins ? 'bg-emerald-500' : 'bg-zinc-600'}`}
          style={{ width: `${homePercent}%` }}
        />
        <div
          className={`h-full rounded-r-full transition-all ${awayWins ? 'bg-emerald-500' : 'bg-zinc-600'}`}
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return { title: 'Match Not Found' };

  const score = match.home_score != null && match.away_score != null
    ? `${match.home_score}-${match.away_score}`
    : 'vs';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';
  const ogParams = new URLSearchParams({
    home: match.home_name,
    away: match.away_name,
    comp: match.competition_name || 'Football Match',
    status: match.status || 'scheduled',
    ...(match.home_score != null ? { score: `${match.home_score} - ${match.away_score}` } : {}),
    ...(match.minute ? { min: String(match.minute) } : {}),
    ...(match.home_logo ? { homeLogo: match.home_logo } : {}),
    ...(match.away_logo ? { awayLogo: match.away_logo } : {}),
  });
  const ogImage = `${siteUrl}/api/og/match?${ogParams.toString()}`;

  return {
    title: `${match.home_name} ${score} ${match.away_name} | Match Centre`,
    description: `Full match details, stats, timeline and AI analysis for ${match.home_name} vs ${match.away_name}${match.competition_name ? ` in the ${match.competition_name}` : ''}.`,
    openGraph: {
      title: `${match.home_name} ${score} ${match.away_name}`,
      description: `Live match centre for ${match.home_name} vs ${match.away_name}${match.competition_name ? ` — ${match.competition_name}` : ''}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${match.home_name} ${score} ${match.away_name}`,
      images: [ogImage],
    },
  };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) notFound();

  let [events, stats, analyses] = await Promise.all([
    getMatchEvents(id),
    getMatchStats(id),
    getMatchAnalysis(id),
  ]);

  // Fetch from API if no events in DB
  if ((events as any[]).length === 0 && match.api_football_id) {
    try {
      const apiEvents = await getFixtureEvents(match.api_football_id);
      if (apiEvents.response && apiEvents.response.length > 0) {
        events = apiEvents.response.map((e: any) => {
          const playerName = e.player?.name || e.player_name || null;
          const assistName = e.assist?.name || e.assist_name || null;
          const teamName = e.team?.name || e.team_name || null;
          const teamApiId = e.team?.id || null;
          // Determine if this event is for the home or away team
          const isHome = teamApiId === match.home_api_id || teamName === match.home_name;
          return {
            event_type: mapEventType(e.type, e.detail),
            minute: e.time?.elapsed ?? e.elapsed ?? e.minute,
            added_time: e.time?.extra ?? null,
            player_known_as: playerName,
            player_first_name: null,
            player_last_name: null,
            second_player_known_as: assistName,
            second_player_first_name: null,
            second_player_last_name: null,
            club_name: teamName,
            club_code: null,
            club_id: isHome ? 'home' : 'away', // Flag for timeline rendering
            is_home: isHome,
            description: e.detail || e.comments || null,
          };
        });
      }
    } catch (e) {
      console.error('[Match] Failed to fetch API events:', e);
    }
  }

  if ((stats as any[]).length === 0 && match.api_football_id) {
    try {
      const apiStats = await getFixtureStatistics(match.api_football_id);
      if (apiStats.response && apiStats.response.length >= 2) {
        const parseVal = (v: any) => v === null ? null : typeof v === 'string' ? parseInt(v.replace('%','')) : v;
        const getStat = (arr: any[], type: string) => arr.find((s: any) => s.type === type)?.value ?? null;
        stats = apiStats.response.map((team: any) => ({
          club_name: team.team.name,
          club_code: null,
          club_id: team.team.id === match.home_api_id ? match.home_club_id : match.away_club_id,
          possession: parseVal(getStat(team.statistics, 'Ball Possession')),
          shots_total: parseVal(getStat(team.statistics, 'Total Shots')),
          shots_on_target: parseVal(getStat(team.statistics, 'Shots on Goal')),
          shots_off_target: parseVal(getStat(team.statistics, 'Shots off Goal')),
          corners: parseVal(getStat(team.statistics, 'Corner Kicks')),
          fouls: parseVal(getStat(team.statistics, 'Fouls')),
          offsides: parseVal(getStat(team.statistics, 'Offsides')),
          yellow_cards: parseVal(getStat(team.statistics, 'Yellow Cards')),
          red_cards: parseVal(getStat(team.statistics, 'Red Cards')),
          saves: parseVal(getStat(team.statistics, 'Goalkeeper Saves')),
          passes_total: parseVal(getStat(team.statistics, 'Total passes')),
          passes_accurate: parseVal(getStat(team.statistics, 'Passes accurate')),
          pass_accuracy: parseVal(getStat(team.statistics, 'Passes %')),
          expected_goals: getStat(team.statistics, 'expected_goals'),
        }));
      }
    } catch (e) {
      console.error('[Match] Failed to fetch API stats:', e);
    }
  }

  // Fetch betting odds — only for league and major cup matches (not internationals/friendlies)
  // API-Football odds coverage doesn't include international friendlies or qualifiers
  const competitionType = match.competition_type || '';
  const competitionSlug = match.competition_slug || '';
  const noOddsCompetitions = ['friendlies', 'wc-qualifiers-', 'afcon-qualifiers', 'euro-qualifiers', 'concacaf-nations-league'];
  const hasOddsCoverage = competitionType !== 'international' && !noOddsCompetitions.some(s => competitionSlug.startsWith(s));

  let oddsData: any = null;
  if (match.status !== 'finished' && match.api_football_id && hasOddsCoverage) {
    try {
      const isLiveMatch = ['live', 'halftime', 'extra_time', 'penalties'].includes(match.status);
      if (isLiveMatch) {
        const liveOddsRes = await getLiveOdds(match.api_football_id);
        if (liveOddsRes.response && liveOddsRes.response.length > 0) {
          const data = liveOddsRes.response[0];
          // Transform live odds into bookmaker-style structure
          const matchWinner = data.odds?.find((o: any) => o.name === 'Match Winner');
          const goalsOU = data.odds?.find((o: any) => o.name === 'Goals Over/Under' || o.name === 'Over/Under');
          const bts = data.odds?.find((o: any) => o.name === 'Both Teams Score');
          oddsData = {
            isLive: true,
            homeName: match.home_name,
            awayName: match.away_name,
            update: data.update,
            bookmakers: [{
              id: 0,
              name: 'Live Odds',
              bets: [
                ...(matchWinner ? [{ id: 1, name: 'Match Winner', values: matchWinner.values }] : []),
                ...(goalsOU ? [{ id: 2, name: 'Goals Over/Under 2.5', values: goalsOU.values.filter((v: any) => v.value === 'Over 2.5' || v.value === 'Under 2.5') }] : []),
                ...(bts ? [{ id: 3, name: 'Both Teams Score', values: bts.values }] : []),
              ],
            }],
          };
        }
      } else {
        const oddsRes = await getFixtureOdds(match.api_football_id);
        if (oddsRes.response && oddsRes.response.length > 0) {
          const data = oddsRes.response[0];
          oddsData = {
            isLive: false,
            homeName: match.home_name,
            awayName: match.away_name,
            update: data.update,
            bookmakers: data.bookmakers,
          };
        }
      }
    } catch (e) {
      console.error('[Match] Failed to fetch odds:', e);
    }
  }

  // ===== FETCH RICH MATCH DATA (on-demand, not stored) =====
  let lineupsData: any[] = [];
  let playerStatsData: any[] = [];
  let predictionsData: any = null;
  let injuriesData: any[] = [];

  if (match.api_football_id) {
    const isMatchPlayed = ['finished', 'live', 'halftime', 'extra_time', 'penalties'].includes(match.status);

    // Fetch in parallel — each with independent try/catch
    const [lineupsRes, playerStatsRes, predictionsRes, injuriesRes] = await Promise.allSettled([
      // Lineups: only for played/live matches
      isMatchPlayed ? getFixtureLineups(match.api_football_id) : Promise.resolve(null),
      // Player stats: only for played/live matches
      isMatchPlayed ? getFixturePlayerStats(match.api_football_id) : Promise.resolve(null),
      // Predictions: all matches
      getFixturePredictions(match.api_football_id),
      // Injuries: mainly useful for scheduled, but fetch for all
      getFixtureInjuries(match.api_football_id),
    ]);

    if (lineupsRes.status === 'fulfilled' && lineupsRes.value?.response?.length) {
      lineupsData = lineupsRes.value.response;
    }
    if (playerStatsRes.status === 'fulfilled' && playerStatsRes.value?.response?.length) {
      playerStatsData = playerStatsRes.value.response;
    }
    if (predictionsRes.status === 'fulfilled' && predictionsRes.value?.response?.length) {
      predictionsData = predictionsRes.value.response[0];
    }
    if (injuriesRes.status === 'fulfilled' && injuriesRes.value?.response?.length) {
      injuriesData = injuriesRes.value.response;
    }
  }

  const homeStats = (stats as any[]).find((s: any) => s.club_name === match.home_name || s.club_id === match.home_club_id);
  const awayStats = (stats as any[]).find((s: any) => s.club_name === match.away_name || s.club_id === match.away_club_id);
  const latestAnalysis = (analyses as any[])[0] ?? null;
  const kickoff = new Date(match.kickoff);
  const isScheduled = match.status === 'scheduled';
  const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(match.status);
  const isFinished = match.status === 'finished';

  const homeColor = match.home_color || '#10b981';

  // Load squads for both teams (on-demand from API if not cached)
  const [homeSquadRaw, awaySquadRaw] = await Promise.all([
    match.home_club_id ? getOrLoadSquad(match.home_club_id) : Promise.resolve([]),
    match.away_club_id ? getOrLoadSquad(match.away_club_id) : Promise.resolve([]),
  ]);

  const SQUAD_POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
  const SQUAD_POSITION_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    GK: { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', label: 'Goalkeepers' },
    DEF: { color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', label: 'Defenders' },
    MID: { color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', label: 'Midfielders' },
    FWD: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Forwards' },
  };

  function groupByPosition(squadArr: any[]) {
    const grouped: Record<string, any[]> = {};
    for (const pos of SQUAD_POSITION_ORDER) {
      const posPlayers = squadArr.filter((p: any) => p.position === pos);
      if (posPlayers.length > 0) grouped[pos] = posPlayers;
    }
    return grouped;
  }

  function calcPlayerAge(dob: string | null): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }

  const homeSquadByPos = groupByPosition(homeSquadRaw);
  const awaySquadByPos = groupByPosition(awaySquadRaw);
  const hasSquads = Object.keys(homeSquadByPos).length > 0 || Object.keys(awaySquadByPos).length > 0;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* ===== MATCH HEADER ===== */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${homeColor}22 0%, transparent 50%, ${match.away_color || '#3f3f46'}22 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 to-zinc-900" />
        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-6">
          {/* Competition + Round */}
          {match.competition_name && (
            <div className="mb-6 flex items-center justify-center gap-2 text-sm text-zinc-400">
              {match.competition_slug ? (
                <Link href={`/tables`} className="hover:text-emerald-400 transition-colors">
                  {match.competition_name}
                </Link>
              ) : (
                <span>{match.competition_name}</span>
              )}
              {match.round && (
                <>
                  <span className="text-zinc-600">&middot;</span>
                  <span>{match.round}</span>
                </>
              )}
            </div>
          )}

          {/* Teams + Score */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
              <Link href={`/teams/${match.home_slug}`} className="group flex flex-col items-center gap-2">
                {match.home_logo ? (
                  <Image
                    src={match.home_logo}
                    alt={match.home_name}
                    width={72}
                    height={72}
                    className="h-16 w-16 sm:h-[72px] sm:w-[72px] object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                    <Shield className="h-8 w-8 text-zinc-500" />
                  </div>
                )}
                <span className="text-sm sm:text-base font-semibold text-zinc-100 text-center group-hover:text-emerald-400 transition-colors truncate max-w-[120px] sm:max-w-none">
                  {match.home_name}
                </span>
              </Link>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2">
              {!isScheduled ? (
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                  {match.home_score ?? 0}
                  <span className="mx-2 text-zinc-600">-</span>
                  {match.away_score ?? 0}
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-zinc-400">
                  {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}
                </div>
              )}

              {/* Penalties */}
              {match.home_penalties != null && match.away_penalties != null && (
                <div className="text-sm text-zinc-400">
                  Pens: {match.home_penalties} - {match.away_penalties}
                </div>
              )}

              {/* Status Badge */}
              <StatusBadge status={match.status} minute={match.minute} />

              {/* Live minute prominently */}
              {isLive && match.minute && match.status !== 'halftime' && (
                <div className="mt-1 text-2xl font-black text-red-400 animate-pulse tabular-nums">
                  {match.minute}&apos;
                </div>
              )}

              {/* Half-time score */}
              {(match.home_score_ht != null && match.away_score_ht != null) && (
                <div className="text-xs text-zinc-500">
                  HT: {match.home_score_ht} - {match.away_score_ht}
                </div>
              )}

              {/* Scheduled date */}
              {isScheduled && (
                <div className="text-xs text-zinc-500">
                  {kickoff.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
              <Link href={`/teams/${match.away_slug}`} className="group flex flex-col items-center gap-2">
                {match.away_logo ? (
                  <Image
                    src={match.away_logo}
                    alt={match.away_name}
                    width={72}
                    height={72}
                    className="h-16 w-16 sm:h-[72px] sm:w-[72px] object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                    <Shield className="h-8 w-8 text-zinc-500" />
                  </div>
                )}
                <span className="text-sm sm:text-base font-semibold text-zinc-100 text-center group-hover:text-emerald-400 transition-colors truncate max-w-[120px] sm:max-w-none">
                  {match.away_name}
                </span>
              </Link>
            </div>
          </div>

          {/* Match info row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
            {match.venue_name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{match.venue_name}{match.venue_city ? `, ${match.venue_city}` : ''}</span>
              </div>
            )}
            {match.referee && (
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                <span>{match.referee}</span>
              </div>
            )}
            {match.attendance && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{Number(match.attendance).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        {/* ===== AI PREDICTIONS PANEL ===== */}
        {latestAnalysis && latestAnalysis.prediction && (() => {
          const pred = typeof latestAnalysis.prediction === 'string'
            ? JSON.parse(latestAnalysis.prediction)
            : latestAnalysis.prediction;
          return (
            <section className="rounded-xl border border-emerald-500/20 bg-zinc-800/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  AI Match Prediction
                </h2>
                {latestAnalysis.minute != null && (
                  <span className="text-xs text-zinc-500">
                    Updated at {latestAnalysis.minute}&apos;
                  </span>
                )}
              </div>

              {/* Probability Bars */}
              <div className="space-y-3 mb-5">
                {/* Home Win */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{match.home_code || match.home_name} Win</span>
                    <span className="font-bold text-emerald-400">{pred.homeWinPct ?? 0}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-700/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pred.homeWinPct ?? 0}%` }}
                    />
                  </div>
                </div>
                {/* Draw */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">Draw</span>
                    <span className="font-bold text-zinc-400">{pred.drawPct ?? 0}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-700/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-500 transition-all"
                      style={{ width: `${pred.drawPct ?? 0}%` }}
                    />
                  </div>
                </div>
                {/* Away Win */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{match.away_code || match.away_name} Win</span>
                    <span className="font-bold text-blue-400">{pred.awayWinPct ?? 0}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-700/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${pred.awayWinPct ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key insight + momentum + confidence */}
              <div className="grid gap-3 sm:grid-cols-3">
                {latestAnalysis.key_insight && (
                  <div className="sm:col-span-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <p className="text-sm text-emerald-300 font-medium leading-relaxed">
                      {latestAnalysis.key_insight}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {latestAnalysis.momentum && (
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2">
                      {latestAnalysis.momentum === 'home' ? (
                        <ArrowLeft className="h-4 w-4 text-emerald-400" />
                      ) : latestAnalysis.momentum === 'away' ? (
                        <ArrowRight className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Minus className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className="text-xs text-zinc-400">Momentum</span>
                      <span className="ml-auto text-sm font-semibold text-zinc-200 capitalize">
                        {latestAnalysis.momentum === 'home'
                          ? match.home_code || 'Home'
                          : latestAnalysis.momentum === 'away'
                          ? match.away_code || 'Away'
                          : 'Neutral'}
                      </span>
                    </div>
                  )}
                  {pred.confidence != null && (
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2">
                      <Target className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-zinc-400">Confidence</span>
                      <span className="ml-auto text-sm font-bold text-amber-400">{pred.confidence}%</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ===== BETTING ODDS ===== */}
        {oddsData && oddsData.bookmakers?.length > 0 && (
          <OddsPanel oddsData={oddsData} />
        )}

        {/* ===== MATCH TIMELINE ===== */}
        {events.length > 0 && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <Activity className="h-5 w-5 text-emerald-500" />
              Match Timeline
            </h2>

            <div className="relative">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700 -translate-x-1/2" />

              <div className="space-y-4">
                {events.map((event: any, i: number) => {
                  const isHome = event.is_home === true
                    || event.club_id === 'home'
                    || event.club_id === match.home_club_id
                    || event.club_name === match.home_name
                    || event.club_code === match.home_code;
                  const isGoal = isGoalEvent(event.event_type);
                  const playerName = getPlayerName(event);
                  const secondPlayer = getSecondPlayerName(event);
                  const minuteStr = event.added_time
                    ? `${event.minute}+${event.added_time}'`
                    : `${event.minute}'`;

                  return (
                    <div
                      key={event.id}
                      className={`relative flex items-center gap-3 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      {/* Event card */}
                      <div
                        className={`flex-1 ${isHome ? 'text-right pr-6' : 'text-left pl-6'}`}
                      >
                        <div
                          className={`inline-block rounded-lg px-4 py-2 ${
                            isGoal
                              ? 'bg-emerald-500/15 border border-emerald-500/30'
                              : 'bg-zinc-800/80'
                          }`}
                        >
                          <div className={`flex items-center gap-2 ${isHome ? 'justify-end' : 'justify-start'}`}>
                            {!isHome && <span className="text-base">{getEventIcon(event.event_type)}</span>}
                            <span className={`font-semibold ${isGoal ? 'text-emerald-300 text-base' : 'text-zinc-200 text-sm'}`}>
                              {playerName}
                            </span>
                            {isHome && <span className="text-base">{getEventIcon(event.event_type)}</span>}
                          </div>
                          {secondPlayer && (
                            <p className={`text-xs text-zinc-500 mt-0.5 ${isHome ? 'text-right' : 'text-left'}`}>
                              {event.event_type === 'substitution' ? `for ${secondPlayer}` : `Assist: ${secondPlayer}`}
                            </p>
                          )}
                          {event.description && !secondPlayer && (
                            <p className={`text-xs text-zinc-500 mt-0.5 ${isHome ? 'text-right' : 'text-left'}`}>
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Center minute badge */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <div
                          className={`flex h-8 min-w-[3rem] items-center justify-center rounded-full text-xs font-bold ${
                            isGoal
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {minuteStr}
                        </div>
                      </div>

                      {/* Spacer for opposite side */}
                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===== MATCH STATISTICS ===== */}
        {homeStats && awayStats && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Match Statistics
            </h2>

            <div className="mb-4 flex items-center justify-between text-sm font-semibold text-zinc-300">
              <span>{match.home_code || match.home_name}</span>
              <span>{match.away_code || match.away_name}</span>
            </div>

            <div className="space-y-4">
              {homeStats.possession != null && awayStats.possession != null && (
                <StatBar
                  label="Possession"
                  homeValue={Number(homeStats.possession)}
                  awayValue={Number(awayStats.possession)}
                  isPercentage
                />
              )}
              {homeStats.shots_total != null && awayStats.shots_total != null && (
                <StatBar
                  label="Total Shots"
                  homeValue={Number(homeStats.shots_total)}
                  awayValue={Number(awayStats.shots_total)}
                />
              )}
              {homeStats.shots_on_target != null && awayStats.shots_on_target != null && (
                <StatBar
                  label="Shots on Target"
                  homeValue={Number(homeStats.shots_on_target)}
                  awayValue={Number(awayStats.shots_on_target)}
                />
              )}
              {homeStats.corners != null && awayStats.corners != null && (
                <StatBar
                  label="Corners"
                  homeValue={Number(homeStats.corners)}
                  awayValue={Number(awayStats.corners)}
                />
              )}
              {homeStats.fouls != null && awayStats.fouls != null && (
                <StatBar
                  label="Fouls"
                  homeValue={Number(homeStats.fouls)}
                  awayValue={Number(awayStats.fouls)}
                />
              )}
              {homeStats.offsides != null && awayStats.offsides != null && (
                <StatBar
                  label="Offsides"
                  homeValue={Number(homeStats.offsides)}
                  awayValue={Number(awayStats.offsides)}
                />
              )}
              {homeStats.saves != null && awayStats.saves != null && (
                <StatBar
                  label="Saves"
                  homeValue={Number(homeStats.saves)}
                  awayValue={Number(awayStats.saves)}
                />
              )}
              {homeStats.pass_accuracy != null && awayStats.pass_accuracy != null && (
                <StatBar
                  label="Pass Accuracy"
                  homeValue={Number(homeStats.pass_accuracy)}
                  awayValue={Number(awayStats.pass_accuracy)}
                  isPercentage
                />
              )}
              {homeStats.expected_goals != null && awayStats.expected_goals != null && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={Number(homeStats.expected_goals) > Number(awayStats.expected_goals) ? 'font-bold text-emerald-400' : 'text-zinc-400'}>
                      {Number(homeStats.expected_goals).toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">xG</span>
                    <span className={Number(awayStats.expected_goals) > Number(homeStats.expected_goals) ? 'font-bold text-emerald-400' : 'text-zinc-400'}>
                      {Number(awayStats.expected_goals).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex h-2 gap-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-l-full transition-all ${
                        Number(homeStats.expected_goals) >= Number(awayStats.expected_goals)
                          ? 'bg-emerald-500'
                          : 'bg-zinc-600'
                      }`}
                      style={{
                        width: `${
                          (Number(homeStats.expected_goals) /
                            (Number(homeStats.expected_goals) + Number(awayStats.expected_goals) || 1)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className={`h-full rounded-r-full transition-all ${
                        Number(awayStats.expected_goals) > Number(homeStats.expected_goals)
                          ? 'bg-emerald-500'
                          : 'bg-zinc-600'
                      }`}
                      style={{
                        width: `${
                          (Number(awayStats.expected_goals) /
                            (Number(homeStats.expected_goals) + Number(awayStats.expected_goals) || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== AI ANALYSIS HISTORY ===== */}
        {analyses.length > 1 && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              AI Analysis Timeline
            </h2>
            <div className="space-y-3">
              {analyses.map((a: any) => {
                const pred = a.prediction
                  ? typeof a.prediction === 'string'
                    ? JSON.parse(a.prediction)
                    : a.prediction
                  : null;
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-4 rounded-lg bg-zinc-800/60 border border-zinc-700/50 p-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                        {a.minute != null ? `${a.minute}'` : '--'}
                      </div>
                      {a.triggered_by && (
                        <span className="mt-1 text-[10px] uppercase text-zinc-600 tracking-wide">
                          {a.triggered_by.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {pred && (
                        <div className="flex items-center gap-3 text-sm mb-1">
                          <span className="text-emerald-400 font-semibold">
                            {match.home_code} {pred.homeWinPct ?? '-'}%
                          </span>
                          <span className="text-zinc-500">
                            Draw {pred.drawPct ?? '-'}%
                          </span>
                          <span className="text-blue-400 font-semibold">
                            {match.away_code} {pred.awayWinPct ?? '-'}%
                          </span>
                        </div>
                      )}
                      {a.key_insight && (
                        <p className="text-sm text-zinc-400 leading-relaxed">{a.key_insight}</p>
                      )}
                    </div>
                    {a.momentum && (
                      <div className="flex-shrink-0">
                        {a.momentum === 'home' ? (
                          <ArrowLeft className="h-4 w-4 text-emerald-400" />
                        ) : a.momentum === 'away' ? (
                          <ArrowRight className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Minus className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== LINEUPS ===== */}
        {lineupsData.length >= 2 && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <ListOrdered className="h-5 w-5 text-emerald-500" />
              Lineups
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {lineupsData.map((lineup: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {lineup.team?.logo && (
                        <Image src={lineup.team.logo} alt={lineup.team.name} width={24} height={24} className="h-6 w-6 object-contain" />
                      )}
                      <span className="font-semibold text-zinc-100">{lineup.team?.name}</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400">
                      {lineup.formation}
                    </span>
                  </div>

                  {/* Coach */}
                  {lineup.coach?.name && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Coach: {lineup.coach.name}</span>
                    </div>
                  )}

                  {/* Starting XI */}
                  <div className="mb-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Starting XI</h4>
                    <div className="space-y-1">
                      {lineup.startXI?.map((entry: any, pi: number) => (
                        <div key={pi} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-zinc-800/60">
                          <span className="w-7 text-right text-xs font-bold text-zinc-500">{entry.player.number}</span>
                          <span className="text-zinc-200">{entry.player.name}</span>
                          <span className="ml-auto rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-500 uppercase">{entry.player.pos}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Substitutes */}
                  {lineup.substitutes?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Substitutes</h4>
                      <div className="space-y-1">
                        {lineup.substitutes.map((entry: any, si: number) => (
                          <div key={si} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-zinc-800/60">
                            <span className="w-7 text-right text-xs font-bold text-zinc-600">{entry.player.number}</span>
                            <span className="text-zinc-400">{entry.player.name}</span>
                            <span className="ml-auto rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-600 uppercase">{entry.player.pos}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== PLAYER RATINGS ===== */}
        {playerStatsData.length >= 2 && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <Star className="h-5 w-5 text-emerald-500" />
              Player Ratings
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {playerStatsData.map((teamData: any, idx: number) => {
                const sortedPlayers = [...(teamData.players || [])].sort((a: any, b: any) => {
                  const rA = parseFloat(a.statistics?.[0]?.games?.rating || '0');
                  const rB = parseFloat(b.statistics?.[0]?.games?.rating || '0');
                  return rB - rA;
                });
                return (
                  <div key={idx} className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      {teamData.team?.logo && (
                        <Image src={teamData.team.logo} alt={teamData.team.name} width={24} height={24} className="h-6 w-6 object-contain" />
                      )}
                      <span className="font-semibold text-zinc-100">{teamData.team?.name}</span>
                    </div>
                    <div className="space-y-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-600 font-semibold">
                        <span className="flex-1">Player</span>
                        <span className="w-10 text-center">Rat</span>
                        <span className="w-8 text-center">G</span>
                        <span className="w-8 text-center">A</span>
                        <span className="w-8 text-center">SH</span>
                        <span className="w-8 text-center">PS</span>
                        <span className="w-8 text-center">TK</span>
                      </div>
                      {sortedPlayers.map((p: any, pi: number) => {
                        const s = p.statistics?.[0] || {};
                        const rating = parseFloat(s.games?.rating || '0');
                        const ratingColor = rating >= 7 ? 'text-emerald-400 bg-emerald-500/15' : rating >= 6 ? 'text-amber-400 bg-amber-500/15' : 'text-red-400 bg-red-500/15';
                        return (
                          <div key={pi} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-800/60">
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="text-zinc-200 truncate">{p.player?.name}</span>
                              <span className="rounded bg-zinc-700/50 px-1 py-0.5 text-[10px] text-zinc-500 uppercase flex-shrink-0">{s.games?.position || '-'}</span>
                            </div>
                            <span className={`w-10 text-center rounded px-1 py-0.5 text-xs font-bold ${rating > 0 ? ratingColor : 'text-zinc-600'}`}>
                              {rating > 0 ? rating.toFixed(1) : '-'}
                            </span>
                            <span className="w-8 text-center text-xs text-zinc-400">{s.goals?.total || 0}</span>
                            <span className="w-8 text-center text-xs text-zinc-400">{s.goals?.assists || 0}</span>
                            <span className="w-8 text-center text-xs text-zinc-400">{s.shots?.total || 0}</span>
                            <span className="w-8 text-center text-xs text-zinc-400">{s.passes?.total || 0}</span>
                            <span className="w-8 text-center text-xs text-zinc-400">{s.tackles?.total || 0}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== PRE-MATCH PREDICTIONS (API-Football AI) ===== */}
        {predictionsData && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <Brain className="h-5 w-5 text-emerald-500" />
              Match Predictions
            </h2>

            {/* Win Probability Bars */}
            {predictionsData.predictions?.percent && (
              <div className="mb-6 space-y-3">
                {[
                  { label: predictionsData.teams?.home?.name || match.home_name, pct: predictionsData.predictions.percent.home, color: 'emerald' },
                  { label: 'Draw', pct: predictionsData.predictions.percent.draw, color: 'zinc' },
                  { label: predictionsData.teams?.away?.name || match.away_name, pct: predictionsData.predictions.percent.away, color: 'blue' },
                ].map((item, i) => {
                  const pctNum = parseInt(item.pct?.replace('%', '') || '0');
                  const barColor = item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'blue' ? 'bg-blue-500' : 'bg-zinc-500';
                  const textColor = item.color === 'emerald' ? 'text-emerald-400' : item.color === 'blue' ? 'text-blue-400' : 'text-zinc-400';
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{item.label}</span>
                        <span className={`font-bold ${textColor}`}>{item.pct}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-zinc-700/50 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pctNum}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Advice */}
            {predictionsData.predictions?.advice && (
              <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                <p className="text-sm font-medium text-emerald-300">{predictionsData.predictions.advice}</p>
              </div>
            )}

            {/* Comparison Radar */}
            {predictionsData.comparison && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">Comparison</h3>
                <div className="space-y-2">
                  {Object.entries(predictionsData.comparison).map(([key, vals]: [string, any]) => {
                    const homePct = parseInt(vals?.home?.replace('%', '') || '0');
                    const awayPct = parseInt(vals?.away?.replace('%', '') || '0');
                    const labels: Record<string, string> = { form: 'Form', att: 'Attack', def: 'Defence', poisson_distribution: 'Poisson', h2h: 'H2H', goals: 'Goals', total: 'Total' };
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={homePct > awayPct ? 'font-bold text-emerald-400' : 'text-zinc-500'}>{vals?.home || '0%'}</span>
                          <span className="text-zinc-500 uppercase tracking-wide">{labels[key] || key}</span>
                          <span className={awayPct > homePct ? 'font-bold text-blue-400' : 'text-zinc-500'}>{vals?.away || '0%'}</span>
                        </div>
                        <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-l-full ${homePct >= awayPct ? 'bg-emerald-500' : 'bg-zinc-600'}`} style={{ width: `${homePct || 50}%` }} />
                          <div className={`h-full rounded-r-full ${awayPct > homePct ? 'bg-blue-500' : 'bg-zinc-600'}`} style={{ width: `${awayPct || 50}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Form */}
            {(predictionsData.teams?.home?.last_5?.form || predictionsData.teams?.away?.last_5?.form) && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">Last 5 Matches</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { team: predictionsData.teams?.home, side: 'home' },
                    { team: predictionsData.teams?.away, side: 'away' },
                  ].map(({ team, side }) => team?.last_5?.form && (
                    <div key={side} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-zinc-300 w-20 truncate">{team.name}</span>
                      <div className="flex gap-1">
                        {team.last_5.form.split('').map((r: string, ri: number) => {
                          const bg = r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-amber-500' : 'bg-red-500';
                          return (
                            <span key={ri} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white ${bg}`}>
                              {r}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* H2H History */}
            {predictionsData.h2h?.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">Head to Head</h3>
                <div className="space-y-2">
                  {predictionsData.h2h.slice(0, 6).map((h: any, hi: number) => {
                    const d = new Date(h.fixture?.date);
                    const homeTeam = h.teams?.home?.name || '?';
                    const awayTeam = h.teams?.away?.name || '?';
                    return (
                      <div key={hi} className="flex items-center gap-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-4 py-2 text-sm">
                        <span className="text-xs text-zinc-600 w-20">{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        <span className={`flex-1 text-right ${h.teams?.home?.winner ? 'font-bold text-zinc-100' : 'text-zinc-400'}`}>{homeTeam}</span>
                        <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-200 tabular-nums">
                          {h.goals?.home ?? '?'} - {h.goals?.away ?? '?'}
                        </span>
                        <span className={`flex-1 ${h.teams?.away?.winner ? 'font-bold text-zinc-100' : 'text-zinc-400'}`}>{awayTeam}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== INJURIES PANEL ===== */}
        {injuriesData.length > 0 && (() => {
          const homeInjuries = injuriesData.filter((inj: any) => inj.team?.id === match.home_api_id);
          const awayInjuries = injuriesData.filter((inj: any) => inj.team?.id === match.away_api_id);
          if (homeInjuries.length === 0 && awayInjuries.length === 0) return null;
          return (
            <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Injuries &amp; Suspensions
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  { label: match.home_name, logo: match.home_logo, injuries: homeInjuries },
                  { label: match.away_name, logo: match.away_logo, injuries: awayInjuries },
                ].map((side, idx) => side.injuries.length > 0 && (
                  <div key={idx} className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      {side.logo && (
                        <Image src={side.logo} alt={side.label} width={24} height={24} className="h-6 w-6 object-contain" />
                      )}
                      <span className="font-semibold text-zinc-100">{side.label}</span>
                      <span className="ml-auto rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">{side.injuries.length}</span>
                    </div>
                    <div className="space-y-2">
                      {side.injuries.map((inj: any, ii: number) => (
                        <div key={ii} className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-zinc-800/60">
                          {inj.player?.photo && (
                            <Image src={inj.player.photo} alt={inj.player.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{inj.player?.name}</p>
                            <p className="text-xs text-zinc-500">{inj.player?.reason || 'Unknown'}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            inj.player?.type === 'Missing Fixture' || inj.player?.type === 'Suspended'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {inj.player?.type || 'Injured'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ===== SQUADS ===== */}
        {hasSquads && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <Shirt className="h-5 w-5 text-emerald-500" />
              Squads
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { label: match.home_name, logo: match.home_logo, squadByPos: homeSquadByPos },
                { label: match.away_name, logo: match.away_logo, squadByPos: awaySquadByPos },
              ].map((side, sideIdx) => (
                <div key={sideIdx} className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    {side.logo && (
                      <Image src={side.logo} alt={side.label} width={24} height={24} className="h-6 w-6 object-contain" />
                    )}
                    <span className="font-semibold text-zinc-100">{side.label}</span>
                  </div>
                  {Object.keys(side.squadByPos).length > 0 ? (
                    <div className="space-y-4">
                      {SQUAD_POSITION_ORDER.map((pos) => {
                        const group = side.squadByPos[pos];
                        if (!group) return null;
                        const style = SQUAD_POSITION_STYLES[pos];
                        return (
                          <div key={pos}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${style.bg} ${style.color}`}>
                                {style.label}
                              </span>
                              <span className="text-[10px] text-zinc-600">{group.length}</span>
                            </div>
                            <div className="space-y-1">
                              {group.map((p: any) => {
                                const age = calcPlayerAge(p.dateOfBirth || p.date_of_birth);
                                const playerName = p.knownAs || p.known_as || `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim();
                                const playerSlug = p.slug;
                                const shirtNum = p.shirtNumber ?? p.shirt_number;
                                const headshot = p.headshotUrl || p.headshot_url;
                                return (
                                  <div key={p.id} className="flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-zinc-800/60 transition-colors">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 overflow-hidden">
                                      {headshot ? (
                                        <img src={headshot} alt={playerName} className="h-full w-full object-cover" />
                                      ) : (
                                        <Shield className="h-4 w-4 text-zinc-600" />
                                      )}
                                    </div>
                                    <span className="w-7 text-right text-xs font-bold text-zinc-500 flex-shrink-0">
                                      {shirtNum ?? '-'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      {playerSlug ? (
                                        <Link href={`/players/${playerSlug}`} className="text-sm font-medium text-zinc-200 hover:text-emerald-400 transition-colors truncate block">
                                          {playerName}
                                        </Link>
                                      ) : (
                                        <span className="text-sm font-medium text-zinc-200 truncate block">{playerName}</span>
                                      )}
                                    </div>
                                    {age != null && (
                                      <span className="text-[10px] text-zinc-500 flex-shrink-0">{age}y</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-4">No squad data available</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== LINKS ===== */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Link
            href={`/teams/${match.home_slug}`}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
          >
            <span>View {match.home_name}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
          <Link
            href={`/teams/${match.away_slug}`}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
          >
            <span>View {match.away_name}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
          <Link
            href={`/compare?home=${match.home_slug}&away=${match.away_slug}`}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-5 py-4 text-sm font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-all group"
          >
            <span>Head to Head</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
          </Link>
        </section>

        {/* Back to Fixtures */}
        <div className="text-center">
          <Link
            href="/fixtures"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fixtures
          </Link>
        </div>
      </div>
    </div>
  );
}
