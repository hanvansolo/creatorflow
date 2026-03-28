// @ts-nocheck
'use client';

import { Newspaper, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { RelatedArticle } from '@/components/match/types';

/* ---------- helpers ---------- */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/* ---------- component ---------- */

interface NewsTabProps {
  articles: RelatedArticle[];
  homeName: string;
  awayName: string;
}

export default function NewsTab({
  articles,
  homeName,
  awayName,
}: NewsTabProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <Newspaper className="h-8 w-8" />
        <p className="text-sm">
          No related articles found for {homeName} or {awayName}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/news/${article.slug}`}
          className="group flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60 sm:flex-row flex-col"
        >
          {/* thumbnail */}
          {article.imageUrl && (
            <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-32">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}

          {/* content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <h4 className="mb-1 text-sm font-semibold leading-snug text-zinc-200 group-hover:text-emerald-400 transition-colors line-clamp-2">
                {article.title}
              </h4>
              {article.summary && (
                <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">
                  {article.summary}
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
              {article.sourceName && (
                <>
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {article.sourceName}
                  </span>
                  <span className="text-zinc-700">|</span>
                </>
              )}
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
