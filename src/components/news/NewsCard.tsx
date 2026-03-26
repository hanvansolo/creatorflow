// @ts-nocheck
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CredibilityBadge } from '@/components/news/CredibilityBadge';
import { VoteButtons } from '@/components/news/VoteButtons';
import { SourceFavicon } from '@/components/news/SourceFavicon';
import { formatRelativeTime } from '@/lib/utils';
import type { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

export function NewsCard({ article, featured = false }: NewsCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-xl border shadow-lg transition-all card-hover border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/90 ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/9]' : 'aspect-video'}`}>
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={featured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
            <span className="text-4xl font-bold text-zinc-400 dark:text-zinc-600">FF</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />

        {/* Breaking badge */}
        {article.isBreaking && (
          <div className="absolute left-3 top-3">
            <Badge variant="danger" className="animate-pulse-slow">
              Breaking
            </Badge>
          </div>
        )}

        {/* Source + credibility badges */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {article.credibilityRating && (
            <CredibilityBadge rating={article.credibilityRating} />
          )}
          {article.source && (
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <SourceFavicon url={article.source.url} name={article.source.name} size={14} />
              {article.source.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className={`font-semibold leading-tight text-zinc-900 dark:text-white ${
            featured ? 'text-xl md:text-2xl' : 'text-base'
          }`}
        >
          <Link href={`/news/${article.slug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">
            {article.title}
          </Link>
        </h3>

        {article.summary && (
          <p
            className={`mt-2 text-zinc-600 dark:text-zinc-300 line-clamp-2 ${
              featured ? 'text-sm md:text-base' : 'text-sm'
            }`}
          >
            {article.summary}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VoteButtons
              articleId={article.id}
              initialScore={article.voteScore ?? 0}
              initialUserVote={article.userVote}
              size="sm"
              layout="horizontal"
            />
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <time dateTime={article.publishedAt}>
                {formatRelativeTime(article.publishedAt)}
              </time>
            </div>
          </div>

          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
            title="Read original article"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
