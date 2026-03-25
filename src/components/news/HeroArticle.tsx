import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CredibilityBadge } from '@/components/news/CredibilityBadge';
import { VoteButtons } from '@/components/news/VoteButtons';
import { SourceFavicon } from '@/components/news/SourceFavicon';
import { formatRelativeTime } from '@/lib/utils';
import type { NewsArticle } from '@/types';

interface HeroArticleProps {
  article: NewsArticle;
}

export function HeroArticle({ article }: HeroArticleProps) {
  return (
    <div className="w-full">
      <div className="group relative overflow-hidden rounded-2xl aspect-[16/10] bg-zinc-200 dark:bg-zinc-800">
        {/* Background Image */}
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-8xl font-black text-zinc-700/50">FF</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {article.isBreaking && (
              <Badge variant="danger" className="animate-pulse-slow shadow-lg shadow-red-500/30">
                Breaking
              </Badge>
            )}
            {article.credibilityRating && (
              <CredibilityBadge rating={article.credibilityRating} />
            )}
          </div>
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            title="Read original article"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Original</span>
          </a>
        </div>

        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {/* Source and time */}
          <div className="flex items-center gap-3 mb-3">
            {article.source && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
                <SourceFavicon url={article.source.url} name={article.source.name} size={14} />
                {article.source.name}
              </span>
            )}
            <time dateTime={article.publishedAt} className="text-xs text-white/70">
              {formatRelativeTime(article.publishedAt)}
            </time>
          </div>

          {/* Title */}
          <Link href={`/news/${article.slug}`}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-white drop-shadow-lg transition-colors group-hover:text-emerald-400">
              {article.title}
            </h2>
          </Link>

          {/* Summary */}
          {article.summary && (
            <p className="mt-3 text-sm text-white/80 line-clamp-2 max-w-2xl">
              {article.summary}
            </p>
          )}

          {/* Vote buttons and related sources count */}
          <div className="mt-4 flex items-center gap-4">
            <VoteButtons
              articleId={article.id}
              initialScore={article.voteScore ?? 0}
              initialUserVote={article.userVote}
              size="sm"
              layout="horizontal"
            />
          </div>
        </div>

        {/* Subtle red accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-transparent" />
      </div>

    </div>
  );
}
