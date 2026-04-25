/**
 * DB-backed cache for the heavy per-render API-Football calls on the
 * match detail page (lineups, predictions, injuries, odds, player
 * ratings). Without this each match page view burned 4-7 API requests.
 *
 * Cache rules:
 *  - **Finished match**: cache once, never re-fetch. The data is stable.
 *    Predictions/injuries/odds are skipped entirely (zero value
 *    post-match), only lineups and player ratings are fetched.
 *  - **Live match**: re-fetch if cache older than LIVE_TTL_MS (90s).
 *  - **Upcoming match**: re-fetch if cache older than UPCOMING_TTL_MS
 *    (1 hour). Pre-match data barely changes within an hour.
 *
 * The cache is keyed by `match.id` and the status at fetch time, so a
 * pre-match cache is invalidated automatically once the match starts
 * (different `secondaryDataStatus`).
 */

import { db, matches } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  getFixtureLineups, getFixturePlayerStats, getFixturePredictions,
  getFixtureInjuries, getFixtureOdds, getLiveOdds,
} from './football-api';

const LIVE_TTL_MS = 90 * 1000;          // 90 seconds for live games
const UPCOMING_TTL_MS = 60 * 60 * 1000; // 1 hour for upcoming
// Finished games: cache forever — data doesn't change.

const LIVE_STATUSES = new Set(['live', 'halftime', 'extra_time', 'penalties']);

export interface SecondaryData {
  lineups: any[];
  playerRatings: any[];
  predictions: any | null;
  injuries: any[];
  odds: any | null;
}

interface CachedRow {
  cache: SecondaryData | null;
  fetchedAt: Date | null;
  cachedStatus: string | null;
}

function isFresh(currentStatus: string, row: CachedRow): boolean {
  if (!row.cache || !row.fetchedAt) return false;

  // If the match has transitioned (e.g. scheduled → live, live → finished),
  // the old cache is always stale — schedule data and live data look
  // very different.
  if (row.cachedStatus !== currentStatus) {
    // Exception: any finished cache is always fresh — finished is final.
    if (currentStatus === 'finished' && row.cachedStatus === 'finished') return true;
    return false;
  }

  if (currentStatus === 'finished') return true; // never expire

  const age = Date.now() - row.fetchedAt.getTime();
  if (LIVE_STATUSES.has(currentStatus)) return age < LIVE_TTL_MS;
  return age < UPCOMING_TTL_MS;
}

function emptyData(): SecondaryData {
  return { lineups: [], playerRatings: [], predictions: null, injuries: [], odds: null };
}

async function fetchFromApi(
  apiFootballId: number,
  status: string,
  homeName: string,
  awayName: string,
): Promise<SecondaryData> {
  const isPlayed = LIVE_STATUSES.has(status) || status === 'finished';
  const isFinished = status === 'finished';
  const isLive = LIVE_STATUSES.has(status);

  // Finished matches: skip predictions/injuries/odds entirely — pointless data,
  // pure waste of the API quota.
  const results = await Promise.allSettled([
    isPlayed ? getFixtureLineups(apiFootballId) : Promise.resolve({ response: [] }),
    isPlayed ? getFixturePlayerStats(apiFootballId) : Promise.resolve({ response: [] }),
    isFinished ? Promise.resolve({ response: [] }) : getFixturePredictions(apiFootballId),
    isFinished ? Promise.resolve({ response: [] }) : getFixtureInjuries(apiFootballId),
    isFinished
      ? Promise.resolve({ response: [] })
      : isLive ? getLiveOdds(apiFootballId) : getFixtureOdds(apiFootballId),
  ]);

  const out = emptyData();

  if (results[0].status === 'fulfilled' && results[0].value?.response?.length > 0) {
    out.lineups = results[0].value.response;
  }

  if (results[1].status === 'fulfilled' && results[1].value?.response?.length > 0) {
    out.playerRatings = results[1].value.response.flatMap((team: any) =>
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

  if (results[2].status === 'fulfilled' && results[2].value?.response?.length > 0) {
    out.predictions = results[2].value.response[0];
  }

  if (results[3].status === 'fulfilled' && results[3].value?.response?.length > 0) {
    out.injuries = results[3].value.response;
  }

  if (results[4].status === 'fulfilled' && results[4].value?.response?.length > 0) {
    const oddsData = results[4].value.response[0] as any;
    out.odds = {
      isLive,
      homeName,
      awayName,
      update: oddsData.update,
      bookmakers: oddsData.bookmakers || (oddsData.odds ? [{ id: 0, name: 'Live', bets: oddsData.odds }] : []),
    };
  }

  return out;
}

/**
 * Get secondary match data — checks DB cache first, only hits the API if the
 * cache is stale per the rules above.
 */
export async function getCachedSecondaryData(
  matchId: string,
  apiFootballId: number | null | undefined,
  status: string,
  homeName: string,
  awayName: string,
  cachedRow: CachedRow,
): Promise<SecondaryData> {
  if (!apiFootballId) return emptyData();

  if (isFresh(status, cachedRow)) {
    return cachedRow.cache as SecondaryData;
  }

  const fresh = await fetchFromApi(apiFootballId, status, homeName, awayName);

  // Persist (best-effort — never block the page on a cache write).
  db
    .update(matches)
    .set({
      secondaryDataCache: fresh as any,
      secondaryDataFetchedAt: new Date(),
      secondaryDataStatus: status,
    })
    .where(eq(matches.id, matchId))
    .catch(() => {});

  return fresh;
}
