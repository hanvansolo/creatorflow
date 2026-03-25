'use client';

import { useState, useTransition, useMemo } from 'react';
import { NewsCard } from './NewsCard';
import type { NewsArticle, CredibilityRating } from '@/types';

type CategoryFilter = 'all' | 'news' | 'opinion' | 'rumour';

const CATEGORY_TABS: { key: CategoryFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'text-white bg-emerald-600' },
  { key: 'news', label: 'News', color: 'text-white bg-green-600' },
  { key: 'opinion', label: 'Opinions', color: 'text-white bg-blue-600' },
  { key: 'rumour', label: 'Rumours', color: 'text-black bg-amber-400' },
];

interface NewsFeedProps {
  initialArticles: NewsArticle[];
  initialCursor: string | null;
}

export function NewsFeed({ initialArticles, initialCursor }: NewsFeedProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filteredArticles = useMemo(() => {
    if (category === 'all') return articles;
    if (category === 'news') return articles.filter(a => !a.credibilityRating || (a.credibilityRating !== 'opinion' && a.credibilityRating !== 'rumour'));
    return articles.filter(a => a.credibilityRating === category);
  }, [articles, category]);

  // Count articles per category
  const counts = useMemo(() => ({
    all: articles.length,
    news: articles.filter(a => !a.credibilityRating || (a.credibilityRating !== 'opinion' && a.credibilityRating !== 'rumour')).length,
    opinion: articles.filter(a => a.credibilityRating === 'opinion').length,
    rumour: articles.filter(a => a.credibilityRating === 'rumour').length,
  }), [articles]);

  function loadMore() {
    if (!cursor || isPending) return;

    startTransition(async () => {
      const res = await fetch(`/api/news?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) return;

      const data = await res.json();
      setArticles(prev => [...prev, ...data.articles]);
      setCursor(data.nextCursor);
    });
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No news articles yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      {/* Category Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              category === tab.key
                ? tab.color
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 text-xs ${category === tab.key ? 'opacity-80' : 'text-zinc-500'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">No {category === 'opinion' ? 'opinion' : category === 'rumour' ? 'rumour' : ''} articles found.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {cursor && category === 'all' && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
}
