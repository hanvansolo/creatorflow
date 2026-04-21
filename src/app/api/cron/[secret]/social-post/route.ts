import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, isNull, or, inArray } from 'drizzle-orm';
import { db, newsArticles, newsSources, socialPosts } from '@/lib/db';
import { postArticleWithTracking } from '@/lib/social/post';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET || process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

// Hourly cap across all platforms — Facebook-algorithm-friendly.
const MAX_POSTS_PER_HOUR = Number(process.env.SOCIAL_MAX_POSTS_PER_HOUR || 3);
// Max articles to post in a single run (prevents burst if several platforms are about to unblock).
const MAX_POSTS_PER_RUN = Number(process.env.SOCIAL_MAX_POSTS_PER_RUN || 1);

/**
 * Dedicated social-posting cron for news articles.
 *
 * Runs every 30 min. Picks at most MAX_POSTS_PER_RUN un-posted articles,
 * skipping any that would exceed MAX_POSTS_PER_HOUR on Facebook. Marks
 * `newsArticles.socialPosted = true` and logs each platform attempt to
 * `social_posts` so we can audit + dedup across runs.
 *
 * Match kickoff / match report posts are handled by the live-sync cron;
 * this route only handles news articles.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Hourly throttle — count posts to Facebook in the last hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentFb = await db
    .select({ id: socialPosts.id })
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.platform, 'facebook'),
        eq(socialPosts.status, 'posted'),
        gte(socialPosts.postedAt, oneHourAgo),
      ),
    );

  const remainingBudget = Math.max(0, MAX_POSTS_PER_HOUR - recentFb.length);
  const cap = Math.min(MAX_POSTS_PER_RUN, remainingBudget);

  if (cap <= 0) {
    return NextResponse.json({
      posted: 0,
      skipped: 'hourly_cap_hit',
      recentFbCount: recentFb.length,
    });
  }

  // Pick candidate articles. We require meaningful content (spun) and prefer
  // primary stories. Skip clickbait/opinion if the credibility rater flagged them.
  const candidates = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      content: newsArticles.content,
      imageUrl: newsArticles.imageUrl,
      tags: newsArticles.tags,
      credibility: newsArticles.credibilityRating,
      sourceName: newsSources.name,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      and(
        eq(newsArticles.socialPosted, false),
        or(eq(newsArticles.isPrimaryStory, true), isNull(newsArticles.storyGroupId)),
      ),
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(cap * 4); // oversample so we have room to skip thin/clickbait

  const picked: typeof candidates = [];
  for (const a of candidates) {
    if (picked.length >= cap) break;
    if (a.credibility === 'clickbait' || a.credibility === 'opinion') continue;
    if (!a.content) continue;
    // Require content substantively longer than the summary — otherwise the
    // article is likely a thin stub that hasn't been spun properly.
    if (a.summary && a.content.length <= a.summary.length * 1.5) continue;
    picked.push(a);
  }

  const results: Array<{
    articleId: string;
    title: string;
    posted: boolean;
    platforms: Record<string, boolean>;
  }> = [];

  for (const article of picked) {
    const platformResults = await postArticleWithTracking({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary || undefined,
      tags: article.tags || undefined,
      imageUrl: article.imageUrl || undefined,
      sourceName: article.sourceName,
    });

    const platforms: Record<string, boolean> = {};
    let anySuccess = false;
    for (const [p, r] of Object.entries(platformResults)) {
      if (r === null) continue;
      platforms[p] = !!r.success;
      if (r.success) anySuccess = true;
    }

    if (anySuccess) {
      await db.update(newsArticles).set({ socialPosted: true }).where(eq(newsArticles.id, article.id));
    }

    results.push({
      articleId: article.id,
      title: article.title.slice(0, 80),
      posted: anySuccess,
      platforms,
    });
  }

  return NextResponse.json({
    posted: results.filter((r) => r.posted).length,
    attempted: results.length,
    budgetRemaining: Math.max(0, remainingBudget - results.filter((r) => r.posted).length),
    recentFbCount: recentFb.length,
    articles: results,
  });
}
