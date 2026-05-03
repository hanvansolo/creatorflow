/**
 * Force a kickoff post for a specific match. Bypasses the lock /
 * scoring filter / per-run cap so you can manually re-post a match
 * the cron missed (e.g. one that got stuck after a transient FB
 * rate-limit). Returns the full success/error JSON for each platform
 * so we can see exactly which one failed and why.
 *
 * Auth: CRON_KEY in the URL (same as other cron routes).
 *
 * GET /api/cron/<CRON_KEY>/force-kickoff/<matchUuid>
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, matches, clubs, competitions, competitionSeasons } from '@/lib/db';
import { postCustomFacebook, postCustomInstagram } from '@/lib/social/facebook';
import { postCustomTweet } from '@/lib/social/twitter';

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string; matchId: string }> }
) {
  const { secret, matchId } = await params;
  if (secret !== CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load match + clubs + competition
  const rows = await db.execute(sql`
    SELECT
      m.id, m.slug, m.status, m.home_score, m.away_score, m.api_football_id,
      hc.name AS home_name, hc.logo_url AS home_logo,
      ac.name AS away_name, ac.logo_url AS away_logo,
      comp.name AS competition_name
    FROM matches m
    INNER JOIN clubs hc ON m.home_club_id = hc.id
    INNER JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    WHERE m.id = ${matchId}::uuid
    LIMIT 1
  `);
  const match = (rows as any[])[0];
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const home = match.home_name as string;
  const away = match.away_name as string;
  const comp = (match.competition_name as string) || 'Football';
  const slug = (match.slug as string) || matchId;
  const matchUrl = `https://www.footy-feed.com/matches/${slug}`;

  const homeTag = home.replace(/[^a-zA-Z0-9]/g, '');
  const awayTag = away.replace(/[^a-zA-Z0-9]/g, '');
  const compTag = comp.replace(/[^a-zA-Z0-9]/g, '');
  const tags = `#${homeTag} #${awayTag} #${compTag} #Football`;

  const fbText = `🔴 LIVE: ${home} take on ${away} in the ${comp}!\n\nFollow every kick at footy-feed.com 👇\n\n${tags}`;
  const tweetText = `🔴 LIVE: ${home} v ${away} in the ${comp}!\n\nMatch centre 👇\n${matchUrl}\n\n${tags}`;

  const ogParams = new URLSearchParams({
    home,
    away,
    comp,
    status: 'live',
    ...(match.home_logo ? { homeLogo: match.home_logo } : {}),
    ...(match.away_logo ? { awayLogo: match.away_logo } : {}),
  });
  const ogImageUrl = `https://www.footy-feed.com/api/og/match?${ogParams.toString()}`;

  const results: Record<string, any> = {};

  // Facebook
  try {
    const r = await postCustomFacebook(fbText, matchUrl, ogImageUrl);
    results.facebook = r;
    if (r.success && r.id) {
      await db.update(matches).set({ fbKickoffPostId: r.id }).where(eq(matches.id, matchId));
    }
  } catch (e: any) {
    results.facebook = { success: false, error: e?.message || String(e), threw: true };
  }

  // Instagram
  try {
    results.instagram = await postCustomInstagram(fbText, ogImageUrl, matchUrl);
  } catch (e: any) {
    results.instagram = { success: false, error: e?.message || String(e), threw: true };
  }

  // Threads
  try {
    const { postToThreads } = await import('@/lib/social/threads');
    results.threads = await postToThreads(`${fbText}\n\n${matchUrl}`, matchUrl, ogImageUrl);
  } catch (e: any) {
    results.threads = { success: false, error: e?.message || String(e), threw: true };
  }

  // Bluesky
  try {
    const { postToBluesky } = await import('@/lib/social/bluesky');
    results.bluesky = await postToBluesky(tweetText.slice(0, 280), matchUrl, [], ogImageUrl);
  } catch (e: any) {
    results.bluesky = { success: false, error: e?.message || String(e), threw: true };
  }

  // Telegram
  try {
    const { postToTelegram } = await import('@/lib/social/telegram');
    results.telegram = await postToTelegram(`${fbText}\n\n${matchUrl}`, ogImageUrl);
  } catch (e: any) {
    results.telegram = { success: false, error: e?.message || String(e), threw: true };
  }

  // Twitter (kept for completeness — currently paused, returns success:false)
  try {
    results.twitter = await postCustomTweet(tweetText, ogImageUrl);
  } catch (e: any) {
    results.twitter = { success: false, error: e?.message || String(e), threw: true };
  }

  // Mark as social_posted so the regular cron leaves it alone going forward.
  await db.execute(sql`UPDATE matches SET social_posted = TRUE WHERE id = ${matchId}::uuid`);

  return NextResponse.json({
    match: { id: matchId, home, away, comp, slug, status: match.status },
    results,
  });
}
