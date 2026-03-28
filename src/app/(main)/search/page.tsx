// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Clock, ArrowLeft } from 'lucide-react';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, eq, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const query = searchParams.q || '';
  return {
    title: query ? `Search: ${query} - Footy Feed` : 'Search - Footy Feed',
    description: query
      ? `Search results for "${query}" on Footy Feed. Find the latest football news, transfer rumours, and match reports.`
      : 'Search football news articles on Footy Feed.',
    robots: { index: false, follow: true },
  };
}

async function searchArticles(query: string) {
  if (!query || query.trim().length < 2) return [];

  const searchTerm = `%${query.trim()}%`;

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
      tags: newsArticles.tags,
      credibilityRating: newsArticles.credibilityRating,
      sourceName: newsSources.name,
      sourceSlug: newsSources.slug,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      or(
        ilike(newsArticles.title, searchTerm),
        ilike(newsArticles.content, searchTerm),
        ilike(newsArticles.summary, searchTerm),
      )
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(30);

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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || '';
  const results = await searchArticles(query);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

          {/* Search Input */}
          <form action="/search" method="GET">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search football news..."
                autoFocus
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {query && (
          <p className="text-sm text-zinc-400 mb-6">
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
              : `No results found for "${query}"`}
          </p>
        )}

        {!query && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Search Football News</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Enter a search term to find articles by title, content, or summary.
            </p>
          </div>
        )}

        {query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Results Found</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              No articles found for &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative h-20 w-28 flex-shrink-0 rounded-lg bg-zinc-800 overflow-hidden">
                  {article.imageUrl ? (
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Search className="h-5 w-5 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </h2>
                  {article.summary && (
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{article.summary}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{article.sourceName || 'Unknown'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(article.publishedAt)}
                    </span>
                    {article.credibilityRating === 'rumour' && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-400">Rumour</span>
                    )}
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
