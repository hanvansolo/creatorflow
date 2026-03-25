import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { VoteButtons } from '@/components/news/VoteButtons';
import { SourceFavicon } from '@/components/news/SourceFavicon';
import { formatRelativeTime } from '@/lib/utils';
import type { NewsArticle } from '@/types';

interface CompactNewsCardProps {
  article: NewsArticle;
}

export function CompactNewsCard({ article }: CompactNewsCardProps) {
  return (
    <div className="group">
      <Link href={`/news/${article.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-600">FF</span>
            </div>
          )}
          {article.tags && article.tags[0] && (
            <div className="absolute left-2 top-2">
              <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                {article.tags[0]}
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="mt-2">
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
        <h3 className="mt-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-white line-clamp-2 transition-colors">
          <Link
            href={`/news/${article.slug}`}
            className="hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            {article.title}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-3">
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
  );
}
