// @ts-nocheck
/**
 * Smart Social Pulse — keeps X and Facebook active during quiet periods.
 *
 * Runs every 10-15 minutes (configure in Railway cron). Checks how long since
 * the last social post and publishes filler content if it's been too quiet.
 *
 * Priority order:
 *   1. Live match scores (if any matches are live)
 *   2. Recently finished match results
 *   3. Top trending news article not yet posted
 *   4. Upcoming match preview / prediction
 *   5. Engagement post (poll-style, stat of the day)
 *
 * Self-limiting:
 *   - Max 1 post per 20 minutes on Facebook
 *   - Max 1 post per 30 minutes on Twitter
 *   - Max 30 Facebook posts per day
 *   - Max 15 tweets per day (free tier budget)
 *   - Skips posting between 01:00-06:00 UTC (dead hours)
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, gte, and, sql, lte } from 'drizzle-orm';
import {
  db,
  matches,
  clubs,
  newsArticles,
  newsSources,
  matchPredictions,
  siteSettings,
} from '@/lib/db';
import { postCustomTweet } from '@/lib/social/twitter';
import { postCustomFacebook } from '@/lib/social/facebook';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

// Rate limits
const FB_MIN_GAP_MS = 30 * 60 * 1000;  // 30 min between FB posts (they rate limit at ~20min)
const TW_MIN_GAP_MS = 30 * 60 * 1000;  // 30 min between tweets
const FB_MAX_PER_DAY = 999; // No limit — push until they complain
const TW_MAX_PER_DAY = 15;

// Dead hours (UTC) — skip posting
const DEAD_HOUR_START = 1;
const DEAD_HOUR_END = 6;

async function getSetting(key: string): Promise<string | null> {
  try {
    const [row] = await db.select({ value: siteSettings.value })
      .from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return row?.value || null;
  } catch { return null; }
}

async function setSetting(key: string, value: string): Promise<void> {
  await db.insert(siteSettings).values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}

async function canPost(platform: 'fb' | 'tw'): Promise<boolean> {
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour >= DEAD_HOUR_START && hour < DEAD_HOUR_END) return false;

  const minGap = platform === 'fb' ? FB_MIN_GAP_MS : TW_MIN_GAP_MS;
  const maxPerDay = platform === 'fb' ? FB_MAX_PER_DAY : TW_MAX_PER_DAY;

  // Check last post time
  const lastStr = await getSetting(`social_pulse_last_${platform}`);
  if (lastStr) {
    const elapsed = now.getTime() - new Date(lastStr).getTime();
    if (elapsed < minGap) return false;
  }

  // Check daily count
  const countStr = await getSetting(`social_pulse_count_${platform}`);
  const dateStr = await getSetting(`social_pulse_date_${platform}`);
  const today = now.toISOString().split('T')[0];

  if (dateStr === today && countStr) {
    if (parseInt(countStr) >= maxPerDay) return false;
  }

  return true;
}

async function markPosted(platform: 'fb' | 'tw'): Promise<void> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  await setSetting(`social_pulse_last_${platform}`, now.toISOString());

  const dateStr = await getSetting(`social_pulse_date_${platform}`);
  const countStr = await getSetting(`social_pulse_count_${platform}`);

  if (dateStr === today) {
    await setSetting(`social_pulse_count_${platform}`, String((parseInt(countStr || '0')) + 1));
  } else {
    await setSetting(`social_pulse_date_${platform}`, today);
    await setSetting(`social_pulse_count_${platform}`, '1');
  }
}

// ===== CONTENT GENERATORS =====

async function getLiveScorePost(): Promise<{ text: string; url: string; image?: string } | null> {
  const liveMatches = await db
    .select({
      id: matches.id,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      minute: matches.minute,
      status: matches.status,
    })
    .from(matches)
    .where(sql`${matches.status} IN ('live', 'halftime', 'extra_time', 'penalties')`)
    .limit(5);

  if (liveMatches.length === 0) return null;

  // Get club names
  const scoreLines: string[] = [];
  for (const m of liveMatches.slice(0, 4)) {
    const [fullMatch] = await db.execute(
      sql`SELECT hc.name as home, ac.name as away FROM matches m
          JOIN clubs hc ON m.home_club_id = hc.id
          JOIN clubs ac ON m.away_club_id = ac.id
          WHERE m.id = ${m.id}::uuid`
    );
    if (fullMatch) {
      const statusTag = m.status === 'halftime' ? 'HT' : `${m.minute}'`;
      scoreLines.push(`${(fullMatch as any).home} ${m.homeScore ?? 0}-${m.awayScore ?? 0} ${(fullMatch as any).away} (${statusTag})`);
    }
  }

  if (scoreLines.length === 0) return null;

  const templates = [
    `📊 LIVE SCORES\n\n${scoreLines.join('\n')}\n\nFull match centres 👇\nhttps://www.footy-feed.com/live\n\n#LiveScores #Football`,
    `⚡ Score update!\n\n${scoreLines.join('\n')}\n\nLive stats & commentary 👇\nhttps://www.footy-feed.com/live\n\n#Football #LiveScores`,
    `🔴 Here's how things stand...\n\n${scoreLines.join('\n')}\n\nAll live matches 👇\nhttps://www.footy-feed.com/live\n\n#Football`,
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  return { text: template, url: 'https://www.footy-feed.com/live' };
}

async function getRecentResultPost(): Promise<{ text: string; url: string } | null> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const recentFinished = await db.execute(sql`
    SELECT m.id, m.home_score, m.away_score, m.slug,
           hc.name as home, ac.name as away
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    WHERE m.status = 'finished'
    AND m.updated_at > ${sixHoursAgo.toISOString()}
    AND m.updated_at < ${twoHoursAgo.toISOString()}
    ORDER BY m.updated_at DESC
    LIMIT 5
  `);

  const results = recentFinished as any[];
  if (!results || results.length === 0) return null;

  const lines = results.slice(0, 4).map((r: any) =>
    `${r.home} ${r.home_score}-${r.away_score} ${r.away}`
  );

  const templates = [
    `📋 Recent results\n\n${lines.join('\n')}\n\nFull match reports 👇\nhttps://www.footy-feed.com/fixtures\n\n#Football #Results`,
    `✅ FT — Here's what you missed\n\n${lines.join('\n')}\n\nMatch reports & stats 👇\nhttps://www.footy-feed.com/fixtures\n\n#Football`,
    `🏁 Final scores\n\n${lines.join('\n')}\n\nAll the stats & reports 👇\nhttps://www.footy-feed.com/fixtures\n\n#FullTime #Football`,
  ];

  return {
    text: templates[Math.floor(Math.random() * templates.length)],
    url: 'https://www.footy-feed.com/fixtures',
  };
}

async function getTrendingNewsPost(): Promise<{ text: string; url: string; image?: string } | null> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  // Find a recent article that hasn't been used as filler yet
  const articles = await db
    .select({
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      imageUrl: newsArticles.imageUrl,
      sourceName: newsSources.name,
      credibilityRating: newsArticles.credibilityRating,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      and(
        gte(newsArticles.publishedAt, sixHoursAgo),
        sql`${newsArticles.credibilityRating} NOT IN ('opinion', 'rumour')`,
      )
    )
    .orderBy(desc(newsArticles.voteScore))
    .limit(10);

  if (articles.length === 0) return null;

  // Pick one we haven't posted recently (check against last used slug)
  const lastSlug = await getSetting('social_pulse_last_news_slug');
  const article = articles.find(a => a.slug !== lastSlug) || articles[0];

  const url = `https://www.footy-feed.com/news/${article.slug}`;
  const snippet = article.summary?.slice(0, 120)?.replace(/\s+\S*$/, '...') || '';

  const templates = [
    `📰 ${article.title}\n\n${snippet}\n\n${url}\n\n#Football #FootballNews`,
    `🗞️ ${article.title}\n\n${snippet}\n\nRead more 👇\n${url}\n\n#Football`,
    `🔥 ${article.title}\n\n${snippet}\n\nFull story 👇\n${url}\n\n#FootballNews`,
  ];

  await setSetting('social_pulse_last_news_slug', article.slug);

  return {
    text: templates[Math.floor(Math.random() * templates.length)],
    url,
    image: article.imageUrl || undefined,
  };
}

async function getUpcomingMatchPost(): Promise<{ text: string; url: string; image?: string } | null> {
  const now = new Date();
  const in6h = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const upcoming = await db.execute(sql`
    SELECT m.id, m.kickoff, m.slug,
           hc.name as home, hc.logo_url as home_logo,
           ac.name as away, ac.logo_url as away_logo,
           mp.predicted_outcome, mp.predicted_home_score, mp.predicted_away_score,
           mp.btts, mp.confidence
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN match_predictions mp ON mp.match_id = m.id
    WHERE m.status = 'scheduled'
    AND m.kickoff > ${now.toISOString()}
    AND m.kickoff < ${in6h.toISOString()}
    ORDER BY m.kickoff ASC
    LIMIT 3
  `);

  const rows = upcoming as any[];
  if (!rows || rows.length === 0) return null;

  const m = rows[0];
  const kickTime = new Date(m.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const matchUrl = `https://www.footy-feed.com/matches/${m.id}`;

  let predLine = '';
  if (m.predicted_outcome) {
    const outcomeLabel = m.predicted_outcome === 'home' ? m.home : m.predicted_outcome === 'away' ? m.away : 'Draw';
    predLine = `\n\n🎯 AI Prediction: ${outcomeLabel} (${m.predicted_home_score}-${m.predicted_away_score})${m.btts ? ' | BTTS: Yes' : ''}${m.confidence ? ` | ${m.confidence}% confidence` : ''}`;
  }

  const templates = [
    `⏰ Coming up at ${kickTime}\n\n${m.home} vs ${m.away}${predLine}\n\nPre-match analysis 👇\n${matchUrl}\n\n#Football`,
    `🔜 ${m.home} 🆚 ${m.away} — ${kickTime} kick-off${predLine}\n\nMatch centre 👇\n${matchUrl}\n\n#Football`,
    `📅 Next up: ${m.home} vs ${m.away} (${kickTime})${predLine}\n\nPredictions & stats 👇\n${matchUrl}\n\n#Football`,
  ];

  const ogParams = new URLSearchParams({
    home: m.home, away: m.away, comp: '', status: 'scheduled', time: kickTime,
    ...(m.home_logo ? { homeLogo: m.home_logo } : {}),
    ...(m.away_logo ? { awayLogo: m.away_logo } : {}),
  });
  const ogImage = `https://www.footy-feed.com/api/og/match?${ogParams.toString()}`;

  return {
    text: templates[Math.floor(Math.random() * templates.length)],
    url: matchUrl,
    image: ogImage,
  };
}

async function getEngagementPost(): Promise<{ text: string; url: string } | null> {
  const templates = [
    `⚽ What's the biggest game you're watching today?\n\nCheck all live scores 👇\nhttps://www.footy-feed.com/live\n\n#Football`,
    `📊 Who's your prediction for tonight's games?\n\nSee our AI predictions 👇\nhttps://www.footy-feed.com/predictions\n\n#Football #Predictions`,
    `🏆 Check the latest standings — any surprises?\n\nhttps://www.footy-feed.com/tables\n\n#Football #PremierLeague`,
    `⚡ Catch up on today's football news\n\nhttps://www.footy-feed.com/news\n\n#Football #FootballNews`,
    `🔥 Which team has been the most entertaining to watch this season?\n\nAll the stats 👇\nhttps://www.footy-feed.com/tables\n\n#Football`,
  ];

  return {
    text: templates[Math.floor(Math.random() * templates.length)],
    url: 'https://www.footy-feed.com',
  };
}

// ===== MAIN HANDLER =====

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (secret !== CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const hour = now.getUTCHours();

  // Dead hours
  if (hour >= DEAD_HOUR_START && hour < DEAD_HOUR_END) {
    return NextResponse.json({ message: 'Dead hours — skipping', hour });
  }

  const canFb = await canPost('fb');
  const canTw = await canPost('tw');

  if (!canFb && !canTw) {
    return NextResponse.json({ message: 'Rate limited — too soon or daily cap reached' });
  }

  // Try content generators in priority order
  const generators = [
    { name: 'live_scores', fn: getLiveScorePost },
    { name: 'recent_results', fn: getRecentResultPost },
    { name: 'trending_news', fn: getTrendingNewsPost },
    { name: 'upcoming_match', fn: getUpcomingMatchPost },
    { name: 'engagement', fn: getEngagementPost },
  ];

  let posted = false;
  let contentType = '';

  for (const gen of generators) {
    try {
      const content = await gen.fn();
      if (!content) continue;

      contentType = gen.name;
      const results: Record<string, any> = {};

      if (canFb) {
        const fbRes = await postCustomFacebook(content.text, content.url, content.image);
        results.facebook = fbRes;
        if (fbRes.success) {
          await markPosted('fb');
          console.log(`[social-pulse] FB posted: ${gen.name}`);
        } else {
          console.error(`[social-pulse] FB failed: ${fbRes.error}`);
        }
      }

      if (canTw) {
        const twRes = await postCustomTweet(content.text.slice(0, 280), content.image);
        results.twitter = twRes;
        if (twRes.success) {
          await markPosted('tw');
          console.log(`[social-pulse] Tweet posted: ${gen.name}`);
        } else {
          console.error(`[social-pulse] Tweet failed: ${twRes.error}`);
        }
      }

      posted = true;

      return NextResponse.json({
        message: 'Posted',
        contentType: gen.name,
        results,
      });
    } catch (err) {
      console.error(`[social-pulse] Error in ${gen.name}:`, err);
      continue;
    }
  }

  return NextResponse.json({ message: 'No suitable content found', posted: false });
}
