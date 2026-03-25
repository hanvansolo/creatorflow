import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, eq, isNotNull, lt } from 'drizzle-orm';
import { getRelatedImageSync } from '@/lib/getFallbackImage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get('cursor');
  const limit = 30;

  const [articles, articleImagesPool] = await Promise.all([
    db
      .select({
        id: newsArticles.id,
        sourceId: newsArticles.sourceId,
        title: newsArticles.title,
        slug: newsArticles.slug,
        summary: newsArticles.summary,
        imageUrl: newsArticles.imageUrl,
        originalUrl: newsArticles.originalUrl,
        publishedAt: newsArticles.publishedAt,
        isBreaking: newsArticles.isBreaking,
        tags: newsArticles.tags,
        credibilityRating: newsArticles.credibilityRating,
        sourceName: newsSources.name,
        sourceSlug: newsSources.slug,
        sourceType: newsSources.type,
        sourcePriority: newsSources.priority,
      })
      .from(newsArticles)
      .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
      .where(cursor ? lt(newsArticles.publishedAt, new Date(cursor)) : undefined)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit),
    db
      .select({
        title: newsArticles.title,
        tags: newsArticles.tags,
        imageUrl: newsArticles.imageUrl,
      })
      .from(newsArticles)
      .where(isNotNull(newsArticles.imageUrl))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(100),
  ]);

  const imagePool = articleImagesPool
    .filter((a): a is { title: string; tags: string[] | null; imageUrl: string } => a.imageUrl !== null);

  const mapped = articles.map((a) => ({
    id: a.id,
    sourceId: a.sourceId || '',
    source: {
      id: a.sourceId || '',
      name: a.sourceName || 'Unknown',
      slug: a.sourceSlug || 'unknown',
      type: (a.sourceType || 'rss') as 'rss' | 'youtube' | 'twitter',
      isActive: true,
      priority: a.sourcePriority || 99,
    },
    title: a.title,
    slug: a.slug,
    summary: a.summary || undefined,
    imageUrl: getRelatedImageSync(a.title, a.tags, a.imageUrl, [], [], imagePool) || undefined,
    originalUrl: a.originalUrl,
    publishedAt: a.publishedAt.toISOString(),
    isBreaking: a.isBreaking ?? false,
    tags: a.tags || [],
    credibilityRating: a.credibilityRating || undefined,
  }));

  const nextCursor = articles.length === limit
    ? articles[articles.length - 1].publishedAt.toISOString()
    : null;

  return NextResponse.json({ articles: mapped, nextCursor });
}
