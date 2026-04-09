// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, newsSources, aggregationJobs } from '@/lib/db';
import { desc, eq, gte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Total counts by time window
  const [totalAll] = await db.select({ count: sql<number>`count(*)` }).from(newsArticles);
  const [total1h] = await db.select({ count: sql<number>`count(*)` }).from(newsArticles).where(gte(newsArticles.publishedAt, oneHourAgo));
  const [total6h] = await db.select({ count: sql<number>`count(*)` }).from(newsArticles).where(gte(newsArticles.publishedAt, sixHoursAgo));
  const [total24h] = await db.select({ count: sql<number>`count(*)` }).from(newsArticles).where(gte(newsArticles.publishedAt, oneDayAgo));

  // Breakdown by credibility rating in last 24h
  const credibilityBreakdown = await db
    .select({
      rating: newsArticles.credibilityRating,
      count: sql<number>`count(*)`,
    })
    .from(newsArticles)
    .where(gte(newsArticles.publishedAt, oneDayAgo))
    .groupBy(newsArticles.credibilityRating);

  // Last 10 articles
  const recentArticles = await db
    .select({
      title: newsArticles.title,
      sourceName: newsSources.name,
      publishedAt: newsArticles.publishedAt,
      credibilityRating: newsArticles.credibilityRating,
      slug: newsArticles.slug,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(10);

  // Article counts per source in last 24h
  const sourceBreakdown = await db
    .select({
      sourceName: newsSources.name,
      sourceSlug: newsSources.slug,
      count: sql<number>`count(*)`,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(gte(newsArticles.publishedAt, oneDayAgo))
    .groupBy(newsSources.name, newsSources.slug)
    .orderBy(desc(sql`count(*)`));

  // Last 10 aggregation jobs
  const recentJobs = await db
    .select({
      id: aggregationJobs.id,
      jobType: aggregationJobs.jobType,
      status: aggregationJobs.status,
      itemsProcessed: aggregationJobs.itemsProcessed,
      startedAt: aggregationJobs.startedAt,
      completedAt: aggregationJobs.completedAt,
      metadata: aggregationJobs.metadata,
    })
    .from(aggregationJobs)
    .where(eq(aggregationJobs.jobType, 'news_aggregation'))
    .orderBy(desc(aggregationJobs.startedAt))
    .limit(10);

  // Active sources count
  const [sourcesCount] = await db.select({ count: sql<number>`count(*)` }).from(newsSources).where(eq(newsSources.isActive, true));

  return NextResponse.json({
    counts: {
      total: Number(totalAll?.count || 0),
      lastHour: Number(total1h?.count || 0),
      last6Hours: Number(total6h?.count || 0),
      last24Hours: Number(total24h?.count || 0),
    },
    activeSources: Number(sourcesCount?.count || 0),
    credibilityBreakdown: credibilityBreakdown.map(c => ({
      rating: c.rating || 'NULL',
      count: Number(c.count),
    })),
    sourceBreakdown: sourceBreakdown.map(s => ({
      source: s.sourceName,
      slug: s.sourceSlug,
      count: Number(s.count),
    })),
    recentArticles: recentArticles.map(a => ({
      title: a.title,
      source: a.sourceName,
      publishedAt: a.publishedAt,
      credibility: a.credibilityRating,
      ageMinutes: Math.round((now.getTime() - new Date(a.publishedAt).getTime()) / 60000),
    })),
    recentJobs: recentJobs.map(j => ({
      status: j.status,
      itemsProcessed: j.itemsProcessed,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      durationMs: j.completedAt && j.startedAt ? new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime() : null,
      metadata: j.metadata,
    })),
  });
}
