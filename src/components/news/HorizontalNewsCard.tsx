// @ts-nocheck
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { VoteButtons } from '@/components/news/VoteButtons';
import { SourceFavicon } from '@/components/news/SourceFavicon';
import type { NewsArticle } from '@/types';

interface HorizontalNewsCardProps {
  article: NewsArticle;
}

export function HorizontalNewsCard({ article }: HorizontalNewsCardProps) {
  return (
    <div className="group flex gap-4 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          {article.source && (
            <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              <SourceFavicon url={article.source.url} name={article.source.name} size={14} />
              {article.source.name}
            </span>
          )}
          <time dateTime={article.publishedAt}>
            {formatRelativeTime(article.publishedAt)}
          </time>
        </div>
        <h3 className="mt-1.5 text-sm font-semibold leading-snug text-zinc-900 dark:text-white line-clamp-2 transition-colors">
          <Link
            href={`/news/${article.slug}`}
            className="hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            {article.title}
          </Link>
        </h3>
        <div className="mt-2">
          <div className="flex items-center gap-3">
            <VoteButtons
              articleId={article.id}
              initialScore={article.voteScore ?? 0}
              initialUserVote={article.userVote}
              size="sm"
              layout="horizontal"
            />
            {(article.commentCount ?? 0) > 0 && (
              <Link href={`/news/${article.slug}#comments`} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <MessageSquare className="h-3.5 w-3.5" />
                {article.commentCount}
              </Link>
            )}
          </div>
        </div>
      </div>
      <Link
        href={`/news/${article.slug}`}
        className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-700"
      >
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-lg font-bold text-zinc-400 dark:text-zinc-600">FF</span>
          </div>
        )}
      </Link>
    </div>
  );
}
