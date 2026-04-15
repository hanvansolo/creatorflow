// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRightLeft, Clock } from 'lucide-react';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, eq, or, ilike, sql } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import { getRelatedImageSync } from '@/lib/getFallbackImage';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { translateBatch } from '@/lib/i18n/translate';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Transfer News - Latest Football Transfer Rumours & Deals',
  'Latest football transfer news, rumours, confirmed signings, and contract extensions. Stay updated with all transfer window activity across the Premier League, La Liga, and more.',
  '/transfers',
  ['transfer news', 'football transfers', 'transfer rumours', 'signings', 'transfer window', 'Premier League transfers']
);

async function getTransferNews() {
  // Fetch articles that are transfer-related:
  // - credibilityRating = 'rumour'
  // - tags containing 'transfer' or related keywords
  // - title/content mentioning transfer-related terms
  const articles = await db
    .select({
      id: newsArticles.id,
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
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      or(
        eq(newsArticles.credibilityRating, 'rumour'),
        ilike(newsArticles.title, '%transfer%'),
        ilike(newsArticles.title, '%signing%'),
        ilike(newsArticles.title, '%signs%'),
        ilike(newsArticles.title, '%deal%'),
        ilike(newsArticles.title, '%loan%'),
        ilike(newsArticles.title, '%contract%'),
        ilike(newsArticles.title, '%release clause%'),
        ilike(newsArticles.title, '%bid%'),
        sql`${newsArticles.tags}::text ILIKE '%transfer%'`,
      )
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(40);

  return articles;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default async function TransfersPage() {
  const [articles, locale] = await Promise.all([getTransferNews(), getLocale()]);
  const t = getDictionary(locale);
  const p = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const localized = await translateBatch(
    articles,
    'news_article',
    [{ key: 'title', field: 'title' }, { key: 'summary', field: 'summary' }],
    locale,
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t.transfers.heading}</h1>
              <p className="mt-1 text-zinc-400">{t.transfers.subheading}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {localized.length === 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-12 text-center">
            <ArrowRightLeft className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{t.transfers.none}</h3>
            <p className="text-zinc-400 max-w-md mx-auto">{t.transfers.blurb}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {localized.map((article) => (
              <Link
                key={article.id}
                href={`${p}/news/${article.slug}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Image */}
                <div className="relative aspect-video bg-zinc-800">
                  {article.imageUrl ? (
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ArrowRightLeft className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {article.credibilityRating === 'rumour' && (
                      <span className="rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-medium text-black">
                        {t.transfers.rumour}
                      </span>
                    )}
                    {article.isBreaking && (
                      <span className="rounded-full bg-red-500/90 px-2.5 py-0.5 text-xs font-medium text-white">
                        {t.transfers.breaking}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </h2>
                  {article.summary && (
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{article.summary}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>{article.sourceName || 'Unknown'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(article.publishedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
