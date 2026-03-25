import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { CredibilityBadge } from '@/components/news/CredibilityBadge';
import { VoteButtons } from '@/components/news/VoteButtons';
import { SourceFavicon } from '@/components/news/SourceFavicon';
import { formatRelativeTime } from '@/lib/utils';
import type { NewsArticle } from '@/types';

interface NewsListItemProps {
  article: NewsArticle;
}

export function NewsListItem({ article }: NewsListItemProps) {
  return (
    <div className="rounded-lg border shadow-md transition-colors border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-800">
      <div className="group flex gap-4 p-3">
        <Link
          href={`/news/${article.slug}`}
          className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-md sm:h-24 sm:w-36"
        >
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              sizes="144px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
              <span className="text-lg font-bold text-zinc-400 dark:text-zinc-600">FF</span>
            </div>
          )}
        </Link>
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {article.source && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <SourceFavicon url={article.source.url} name={article.source.name} size={14} />
                {article.source.name}
              </span>
            )}
            {article.credibilityRating && (
              <CredibilityBadge rating={article.credibilityRating} />
            )}
            {article.tags && article.tags.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {article.tags[0]}
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
            <Link
              href={`/news/${article.slug}`}
              className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {article.title}
            </Link>
          </h3>
          {article.summary && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-1 hidden sm:block">
              {article.summary}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3">
            <VoteButtons
              articleId={article.id}
              initialScore={article.voteScore ?? 0}
              initialUserVote={article.userVote}
              size="sm"
              layout="horizontal"
            />
            <time className="text-[11px] text-zinc-500 dark:text-zinc-400" dateTime={article.publishedAt}>
              {formatRelativeTime(article.publishedAt)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}
