// @ts-nocheck
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, newsArticles, newsSources } from '@/lib/db';
import { sql, desc, ilike, or } from 'drizzle-orm';
import {
  getFixtureEvents, getFixtureStatistics, getFixtureOdds, getLiveOdds,
  getFixtureLineups, getFixturePlayerStats, getFixturePredictions, getFixtureInjuries,
  mapEventType,
} from '@/lib/api/football-api';
import { getOrLoadSquad } from '@/lib/api/player-loader';
import { MatchDetailClient } from '@/components/match/MatchDetailClient';
import type { MatchPageData, MatchEvent, TeamStats, PlayerRating } from '@/components/match/types';

export const dynamic = 'force-dynamic';

// ===== DATA FETCHING =====

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
  return (result as any[])[0] ?? null;
}

async function getDBEvents(matchId: string) {
  const result = await db.execute(sql`
    SELECT me.*,
      p.known_as as player_known_as, p.first_name as player_first_name, p.last_name as player_last_name,
      sp.known_as as second_player_known_as, sp.first_name as second_player_first_name, sp.last_name as second_player_last_name,
      c.name as club_name, c.code as club_code
    FROM match_events me
    LEFT JOIN players p ON me.player_id = p.id
    LEFT JOIN players sp ON me.second_player_id = sp.id
    LEFT JOIN clubs c ON me.club_id = c.id
    WHERE me.match_id = ${matchId}
    ORDER BY me.minute ASC, me.added_time ASC NULLS FIRST
  `);
  return (result as any[]) || [];
}

async function getDBStats(matchId: string) {
  const result = await db.execute(sql`SELECT * FROM match_stats WHERE match_id = ${matchId}`);
  return (result as any[]) || [];
}

async function getDBAnalyses(matchId: string) {
  const result = await db.execute(sql`
    SELECT * FROM match_analysis WHERE match_id = ${matchId} ORDER BY created_at DESC
  `);
  return (result as any[]) || [];
}

async function getRelatedArticles(homeName: string, awayName: string) {
  try {
    const homeWord = homeName.split(' ')[0];
    const awayWord = awayName.split(' ')[0];
    const articles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        slug: newsArticles.slug,
        summary: newsArticles.summary,
        imageUrl: newsArticles.imageUrl,
        publishedAt: newsArticles.publishedAt,
        sourceName: newsSources.name,
      })
      .from(newsArticles)
      .leftJoin(newsSources, sql`${newsArticles.sourceId} = ${newsSources.id}`)
      .where(or(
        ilike(newsArticles.title, `%${homeWord}%`),
        ilike(newsArticles.title, `%${awayWord}%`),
      ))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(8);
    return articles.map(a => ({
      ...a,
      publishedAt: a.publishedAt?.toISOString() || new Date().toISOString(),
    }));
  } catch { return []; }
}

// ===== METADATA =====

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return { title: 'Match Not Found' };

  const score = match.home_score != null ? `${match.home_score}-${match.away_score}` : 'vs';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';
  const ogParams = new URLSearchParams({
    home: match.home_name, away: match.away_name,
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
      description: `Match centre: ${match.home_name} vs ${match.away_name}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: `${match.home_name} ${score} ${match.away_name}`, images: [ogImage] },
  };
}

// ===== PAGE COMPONENT =====

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const isPlayed = ['live', 'halftime', 'extra_time', 'penalties', 'finished'].includes(match.status);

  // Fetch DB data in parallel
  let [events, stats, analyses] = await Promise.all([
    getDBEvents(id),
    getDBStats(id),
    getDBAnalyses(id),
  ]);

  // On-demand API fetches for missing data
  if (match.api_football_id) {
    const apiCalls: Promise<any>[] = [];

    // Events
    if (events.length === 0 && isPlayed) {
      apiCalls.push(
        getFixtureEvents(match.api_football_id).then(r => {
          if (r.response?.length > 0) {
            events = r.response.map((e: any) => {
              const teamApiId = e.team?.id || null;
              const isHome = (teamApiId && String(teamApiId) === String(match.home_api_id)) || e.team?.name === match.home_name;
              return {
                event_type: mapEventType(e.type, e.detail),
                minute: e.time?.elapsed ?? e.minute,
                added_time: e.time?.extra ?? null,
                player_known_as: e.player?.name || null,
                second_player_known_as: e.assist?.name || null,
                club_name: e.team?.name || null,
                club_id: isHome ? 'home' : 'away',
                is_home: isHome,
                description: e.detail || null,
              };
            });
          }
        }).catch(() => {})
      );
    }

    // Stats
    if (stats.length === 0 && isPlayed) {
      apiCalls.push(
        getFixtureStatistics(match.api_football_id).then(r => {
          if (r.response?.length >= 2) {
            const parseVal = (v: any) => v === null ? null : typeof v === 'string' ? parseInt(v.replace('%', '')) : v;
            const getStat = (arr: any[], type: string) => arr.find((s: any) => s.type === type)?.value ?? null;
            stats = r.response.map((team: any) => ({
              club_name: team.team.name,
              club_id: String(team.team.id) === String(match.home_api_id) ? match.home_club_id : match.away_club_id,
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
              expected_goals: parseVal(getStat(team.statistics, 'expected_goals')),
            }));
          }
        }).catch(() => {})
      );
    }

    await Promise.allSettled(apiCalls);
  }

  // Secondary API calls (lineups, player stats, predictions, injuries, odds) — all in parallel
  let lineups: any[] = [];
  let playerRatings: PlayerRating[] = [];
  let predictions: any = null;
  let injuries: any[] = [];
  let odds: any = null;

  if (match.api_football_id) {
    const results = await Promise.allSettled([
      isPlayed ? getFixtureLineups(match.api_football_id) : Promise.resolve({ response: [] }),
      isPlayed ? getFixturePlayerStats(match.api_football_id) : Promise.resolve({ response: [] }),
      getFixturePredictions(match.api_football_id),
      getFixtureInjuries(match.api_football_id),
      match.status !== 'finished'
        ? (['live', 'halftime', 'extra_time', 'penalties'].includes(match.status)
          ? getLiveOdds(match.api_football_id)
          : getFixtureOdds(match.api_football_id))
        : Promise.resolve({ response: [] }),
    ]);

    // Lineups
    if (results[0].status === 'fulfilled' && results[0].value?.response?.length > 0) {
      lineups = results[0].value.response;
    }

    // Player ratings
    if (results[1].status === 'fulfilled' && results[1].value?.response?.length > 0) {
      playerRatings = results[1].value.response.flatMap((team: any) =>
        (team.players || []).map((p: any) => ({
          name: p.player.name,
          photo: p.player.photo,
          position: p.statistics?.[0]?.games?.position || '?',
          rating: p.statistics?.[0]?.games?.rating || null,
          minutes: p.statistics?.[0]?.games?.minutes || null,
          goals: p.statistics?.[0]?.goals?.total || null,
          assists: p.statistics?.[0]?.goals?.assists || null,
          shots: p.statistics?.[0]?.shots?.total || null,
          passes: p.statistics?.[0]?.passes?.total || null,
          tackles: p.statistics?.[0]?.tackles?.total || null,
          teamName: team.team.name,
          teamId: team.team.id,
          playerId: p.player.id,
          slug: p.player.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        }))
      );
    }

    // Predictions
    if (results[2].status === 'fulfilled' && results[2].value?.response?.length > 0) {
      predictions = results[2].value.response[0];
    }

    // Injuries
    if (results[3].status === 'fulfilled' && results[3].value?.response?.length > 0) {
      injuries = results[3].value.response;
    }

    // Odds
    if (results[4].status === 'fulfilled' && results[4].value?.response?.length > 0) {
      const oddsData = results[4].value.response[0];
      odds = {
        isLive: ['live', 'halftime', 'extra_time', 'penalties'].includes(match.status),
        homeName: match.home_name,
        awayName: match.away_name,
        update: oddsData.update,
        bookmakers: oddsData.bookmakers || (oddsData.odds ? [{ id: 0, name: 'Live', bets: oddsData.odds }] : []),
      };
    }
  }

  // Load squads
  const [homeSquad, awaySquad] = await Promise.all([
    getOrLoadSquad(match.home_club_id),
    getOrLoadSquad(match.away_club_id),
  ]);

  // Related articles
  const articles = await getRelatedArticles(match.home_name, match.away_name);

  // Build home/away stats
  const homeStats = (stats as any[]).find((s: any) =>
    s.club_name === match.home_name || s.club_id === match.home_club_id
  ) || null;
  const awayStats = (stats as any[]).find((s: any) =>
    s.club_name === match.away_name || s.club_id === match.away_club_id
  ) || null;

  // Serialize match data for client component
  const pageData: MatchPageData = {
    match: {
      ...match,
      kickoff: match.kickoff instanceof Date ? match.kickoff.toISOString() : String(match.kickoff),
    },
    events,
    homeStats,
    awayStats,
    analyses: (analyses as any[]).map(a => ({
      ...a,
      created_at: a.created_at instanceof Date ? a.created_at.toISOString() : String(a.created_at || ''),
    })),
    lineups,
    playerRatings,
    predictions,
    injuries,
    odds,
    homeSquad: (homeSquad || []).map((p: any) => ({
      id: p.id, knownAs: p.knownAs || p.known_as, firstName: p.firstName || p.first_name,
      lastName: p.lastName || p.last_name, slug: p.slug, position: p.position,
      shirtNumber: p.shirtNumber || p.shirt_number, headshotUrl: p.headshotUrl || p.headshot_url,
      age: p.age,
    })),
    awaySquad: (awaySquad || []).map((p: any) => ({
      id: p.id, knownAs: p.knownAs || p.known_as, firstName: p.firstName || p.first_name,
      lastName: p.lastName || p.last_name, slug: p.slug, position: p.position,
      shirtNumber: p.shirtNumber || p.shirt_number, headshotUrl: p.headshotUrl || p.headshot_url,
      age: p.age,
    })),
    articles,
  };

  return <MatchDetailClient data={pageData} />;
}
