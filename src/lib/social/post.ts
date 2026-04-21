import { postToTwitter, buildHashtags } from './twitter';
import { postToFacebook, postToInstagram } from './facebook';
import { postToBluesky } from './bluesky';
import { postToThreads } from './threads';

export interface SocialPostResult {
  twitter: { success: boolean; id?: string; error?: string } | null;
  facebook: { success: boolean; id?: string; error?: string } | null;
  instagram: { success: boolean; id?: string; error?: string } | null;
  bluesky: { success: boolean; uri?: string; error?: string } | null;
  threads: { success: boolean; id?: string; error?: string } | null;
}

// Rate limiting per platform — stagger posts, one at a time
let lastTweetTime = 0;
let lastFacebookTime = 0;
const MIN_TWEET_GAP_MS = 10 * 60 * 1000; // 10 minutes between tweets
const MIN_FACEBOOK_GAP_MS = 10 * 60 * 1000; // 10 minutes between FB posts

function checkTwitterRateLimit(): boolean {
  const now = Date.now();
  const timeSinceLast = now - lastTweetTime;
  if (lastTweetTime > 0 && timeSinceLast < MIN_TWEET_GAP_MS) {
    console.log(`[Social] Twitter: last post ${Math.round(timeSinceLast / 60000)}m ago, skipping`);
    return false;
  }
  lastTweetTime = now;
  return true;
}

function checkFacebookRateLimit(): boolean {
  const now = Date.now();
  const timeSinceLast = now - lastFacebookTime;
  if (lastFacebookTime > 0 && timeSinceLast < MIN_FACEBOOK_GAP_MS) {
    console.log(`[Social] Facebook: last post ${Math.round(timeSinceLast / 60000)}m ago, skipping`);
    return false;
  }
  lastFacebookTime = now;
  return true;
}

/**
 * Post an article to all configured social platforms (legacy entry point).
 * Retained for any callers that don't need DB-tracked dedup. The new
 * `postArticleWithTracking` is the preferred path — it writes to `social_posts`
 * so the social-post cron can enforce per-hour caps and prevent duplicates.
 */
export async function postToAllPlatforms(
  title: string,
  slug: string,
  summary?: string,
  tags?: string[],
  imageUrl?: string
): Promise<SocialPostResult> {
  const results = await Promise.allSettled([
    null, // Twitter paused
    null, // Facebook suspended pending account review
    null, // Instagram disabled while FB is out (shared auth)
    process.env.BLUESKY_HANDLE ? postToBluesky(title, slug, tags, imageUrl) : null,
    null, // Threads paused — Meta action-block (subcode 2207051)
  ]);

  const get = (i: number) => {
    const r = results[i];
    if (r.status === 'fulfilled') return r.value;
    return { success: false, error: r.reason?.message || 'Unknown error' };
  };

  const result: SocialPostResult = {
    twitter: get(0),
    facebook: get(1),
    instagram: get(2),
    bluesky: get(3),
    threads: get(4),
  };

  for (const [platform, res] of Object.entries(result)) {
    if (res === null) continue;
    if (res.success) {
      console.log(`[SOCIAL] ${platform}: posted successfully`);
    } else {
      console.error(`[SOCIAL] ${platform}: failed - ${res.error}`);
    }
  }

  return result;
}

// ===== Structured article posting with DB tracking =====
// Used by the dedicated social-post cron. Logs each attempt (success or
// failure) to social_posts so we can: dedup posts per-article, enforce
// per-platform hourly caps, and audit failures.

export type ContentType =
  | 'article'
  | 'match_kickoff'
  | 'match_report'
  | 'match_live'
  | 'briefing';

export interface TrackedPostInput {
  articleId: string; // used as contentId for dedup
  title: string;
  slug: string;
  summary?: string;
  tags?: string[];
  imageUrl?: string;
  sourceName?: string | null;
}

/**
 * Build a varied Facebook caption for a news article. Three shapes, picked
 * deterministically from the article id hash so retries stay consistent and
 * the feed doesn't look like a template copy-paste.
 */
export function buildArticleFbCaption(input: TrackedPostInput): string {
  const hashtags = buildHashtags(input.title, input.tags || []);
  const source = input.sourceName ? `via ${input.sourceName}` : '';
  const summary = (input.summary || '').slice(0, 200).replace(/\s+\S*$/, '').trim();
  const seed = input.articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const templates: Array<(t: string, s: string, src: string, tags: string) => string> = [
    (t, s, src, tags) => [t, s, src, tags].filter(Boolean).join('\n\n'),
    (t, s, src, tags) => [t, s ? `${s}…` : '', tags].filter(Boolean).join('\n\n'),
    (t, s, src, tags) => [`📰 ${t}`, s, tags].filter(Boolean).join('\n\n'),
    (t, s, src, tags) => [`🔎 ${t}`, s, src, tags].filter(Boolean).join('\n\n'),
  ];

  return templates[seed % templates.length](input.title, summary, source, hashtags).trim();
}

/**
 * Post a news article to all configured platforms and log every attempt to
 * social_posts. Returns success/id/error per platform. Marks `newsArticles.
 * socialPosted = true` on any success.
 *
 * Intended as the single entry point for the new social-post cron. Legacy
 * `postToAllPlatforms` above is retained for live-sync-style fire-and-forget
 * match event posts.
 */
export async function postArticleWithTracking(input: TrackedPostInput): Promise<SocialPostResult> {
  const { db, socialPosts } = await import('@/lib/db');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';
  const articleUrl = `${siteUrl}/news/${input.slug}`;
  const fbCaption = buildArticleFbCaption(input);

  const results = await Promise.allSettled([
    (process.env.TWITTER_CLIENT_ID || process.env.TWITTER_OAUTH2_TOKEN)
      ? postToTwitter(input.title, input.slug, input.tags, input.imageUrl, input.summary)
      : null,
    (process.env.FACEBOOK_PAGE_ID || process.env.FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_TOKEN)
      ? (async () => {
          // Use postCustomFacebook via the caption we built so each post looks unique.
          const { postCustomFacebook } = await import('./facebook');
          return postCustomFacebook(fbCaption, articleUrl, input.imageUrl);
        })()
      : null,
    (process.env.INSTAGRAM_ACCOUNT_ID && input.imageUrl)
      ? postToInstagram(input.title, input.slug, input.imageUrl, input.tags)
      : null,
    process.env.BLUESKY_HANDLE
      ? postToBluesky(input.title, input.slug, input.tags, input.imageUrl)
      : null,
    process.env.THREADS_USER_ID
      ? postToThreads(input.title, input.slug, input.imageUrl)
      : null,
  ]);

  const get = (i: number) => {
    const r = results[i];
    if (r.status === 'fulfilled') return r.value;
    return { success: false, error: r.reason?.message || 'Unknown error' };
  };

  const result: SocialPostResult = {
    twitter: get(0),
    facebook: get(1),
    instagram: get(2),
    bluesky: get(3),
    threads: get(4),
  };

  // Log each attempt to social_posts for audit + dedup.
  const rowsToInsert: Array<{
    platform: string;
    contentType: string;
    contentId: string;
    postText: string;
    externalPostId?: string;
    status: string;
    error?: string;
  }> = [];

  for (const [platform, res] of Object.entries(result)) {
    if (res === null) continue;
    const id = 'id' in res ? res.id : 'uri' in res ? res.uri : undefined;
    rowsToInsert.push({
      platform,
      contentType: 'article',
      contentId: input.articleId,
      postText: platform === 'facebook' ? fbCaption : input.title,
      externalPostId: id,
      status: res.success ? 'posted' : 'failed',
      error: res.success ? undefined : res.error,
    });
    if (res.success) {
      console.log(`[SOCIAL] ${platform}: posted${id ? ` (${id})` : ''}`);
    } else {
      console.error(`[SOCIAL] ${platform}: failed - ${res.error}`);
    }
  }

  if (rowsToInsert.length > 0) {
    try {
      await db.insert(socialPosts).values(rowsToInsert);
    } catch (e) {
      console.error('[SOCIAL] Failed to write social_posts audit rows:', e instanceof Error ? e.message : e);
    }
  }

  return result;
}
