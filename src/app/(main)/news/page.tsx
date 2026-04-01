// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { NewsFeed } from '@/components/news/NewsFeed';
import { Badge } from '@/components/ui/Badge';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, eq, isNotNull } from 'drizzle-orm';
import type { NewsArticle, CredibilityRating } from '@/types';
import { createPageMetadata } from '@/lib/seo';
import { getRelatedImageSync } from '@/lib/getFallbackImage';
import { AdSlot } from '@/components/ads/AdSlot';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football News - Latest Headlines & Updates',
  'Stay updated with the latest football news from top sources including BBC Sport, Sky Sports, The Guardian, and more. Breaking news, match reports, and exclusive interviews.',
  '/news',
  ['football news', 'soccer news', 'Premier League news', 'transfer news', 'match reports']
);

async function getNews(): Promise<NewsArticle[]> {
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
        voteScore: newsArticles.voteScore,
        sourceName: newsSources.name,
        sourceSlug: newsSources.slug,
        sourceType: newsSources.type,
        sourcePriority: newsSources.priority,
      })
      .from(newsArticles)
      .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(30),
    // Get recent articles WITH images to use as fallback pool
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

  return articles.map((a) => ({
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
    imageUrl: a.imageUrl || undefined,
    originalUrl: a.originalUrl,
    publishedAt: a.publishedAt.toISOString(),
    isBreaking: a.isBreaking ?? false,
    tags: a.tags || [],
    credibilityRating: (a.credibilityRating as CredibilityRating) || undefined,
    voteScore: a.voteScore ?? 0,
  }));
}

async function getSources(): Promise<string[]> {
  const sources = await db
    .select({ name: newsSources.name })
    .from(newsSources)
    .where(eq(newsSources.isActive, true))
    .orderBy(newsSources.priority);

  return ['All', ...sources.map((s) => s.name)];
}

export default async function NewsPage() {
  const [news, sources] = await Promise.all([getNews(), getSources()]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Latest Football News</h1>
              <p className="mt-2 text-zinc-400">
                Aggregated from the top football news sources
              </p>
            </div>
            <Link
              href="/news/roundup"
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              <Newspaper className="h-4 w-4" />
              Daily Roundup
            </Link>
          </div>

          {/* Source Filter */}
          <div className="mt-6 flex flex-wrap gap-2">
            {sources.map((source) => (
              <Badge
                key={source}
                variant={source === 'All' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-zinc-800"
              >
                {source}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <NewsFeed
          initialArticles={news}
          initialCursor={news.length >= 30 ? news[news.length - 1].publishedAt : null}
        />

        {/* Ad after article listing */}
        <div className="my-6">
          <AdSlot format="horizontal" />
        </div>
      </div>
    </div>
  );
}
