// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, ExternalLink, Tag, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CredibilityBadge } from '@/components/news/CredibilityBadge';
import { VoteButtons } from '@/components/news/VoteButtons';
import { SourceFavicon } from '@/components/news/SourceFavicon';
import { Card, CardContent } from '@/components/ui/Card';

import { CommentSection } from '@/components/comments/CommentSection';
import { AnnotatedParagraphs } from '@/components/deep-dives/AnnotatedContent';
import { db, newsArticles, newsSources, comments } from '@/lib/db';
import { eq, desc, ne, isNotNull, and, sql } from 'drizzle-orm';
import { getRelatedImageSync } from '@/lib/getFallbackImage';
import { formatRelativeTime } from '@/lib/utils';
import { prepareAnnotatedContent } from '@/lib/utils/prepare-annotated-content';
import type { CredibilityRating } from '@/types';
import {
  generateArticleMetadata,
  generateAlternates,
  SITE_CONFIG,
  generateArticleStructuredData,
  jsonLd,
  JsonLdScript,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const articles = await db
    .select({
      id: newsArticles.id,
      sourceId: newsArticles.sourceId,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      content: newsArticles.content,
      author: newsArticles.author,
      imageUrl: newsArticles.imageUrl,
      originalUrl: newsArticles.originalUrl,
      publishedAt: newsArticles.publishedAt,
      isBreaking: newsArticles.isBreaking,
      tags: newsArticles.tags,
      credibilityRating: newsArticles.credibilityRating,
      voteScore: newsArticles.voteScore,
      sourceName: newsSources.name,
      sourceSlug: newsSources.slug,
      sourceLogoUrl: newsSources.logoUrl,
      sourceUrl: newsSources.url,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(eq(newsArticles.slug, slug))
    .limit(1);

  return articles[0] || null;
}

async function getTrendingArticles(currentArticleId: string) {
  return db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
      tags: newsArticles.tags,
      publishedAt: newsArticles.publishedAt,
      sourceName: newsSources.name,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(ne(newsArticles.id, currentArticleId))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(6);
}

async function getArticleImagePool() {
  // Get recent articles WITH images to use as fallback pool
  const articles = await db
    .select({
      title: newsArticles.title,
      tags: newsArticles.tags,
      imageUrl: newsArticles.imageUrl,
    })
    .from(newsArticles)
    .where(isNotNull(newsArticles.imageUrl))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(100);

  return articles.filter((a): a is { title: string; tags: string[] | null; imageUrl: string } => a.imageUrl !== null);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    ...generateArticleMetadata({
      title: article.title,
      description: article.summary || article.content?.slice(0, 160) || '',
      image: article.imageUrl || undefined,
      publishedTime: article.publishedAt?.toISOString() || new Date().toISOString(),
      author: article.author || article.sourceName || 'Footy Feed',
      section: 'News',
      tags: article.tags || [],
    }),
    alternates: generateAlternates(`/news/${slug}`),
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Fetch trending articles, image pool, annotated content, and comment count
  const [trendingArticles, imagePool, annotatedContent, commentCountResult] = await Promise.all([
    getTrendingArticles(article.id),
    getArticleImagePool(),
    article.content ? prepareAnnotatedContent(article.content) : null,
    db.select({ count: sql<number>`count(*)` }).from(comments).where(and(eq(comments.contentType, 'article'), eq(comments.contentId, slug), eq(comments.status, 'active'))),
  ]);
  const commentCount = commentCountResult[0]?.count ?? 0;

  // Get image - uses original if available, otherwise finds related article image
  const articleImage = getRelatedImageSync(
    article.title,
    article.tags,
    article.imageUrl,
    [], [],
    imagePool
  );

  // Generate structured data for SEO
  const structuredData = jsonLd(
    generateArticleStructuredData({
      headline: article.title,
      description: article.summary || article.content?.slice(0, 160) || '',
      image: articleImage || '/images/og-default.png',
      datePublished: article.publishedAt?.toISOString() || new Date().toISOString(),
      authorName: article.author || article.sourceName || 'Footy Feed',
      url: `${SITE_CONFIG.url}/news/${slug}`,
    })
  );

  return (
    <>
      <JsonLdScript data={structuredData} />
      <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/news"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Info */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {article.isBreaking && (
            <Badge variant="danger">Breaking</Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1.5">
            <SourceFavicon url={article.sourceUrl || undefined} name={article.sourceName || 'Unknown'} size={18} />
            {article.sourceName}
          </Badge>
          {article.credibilityRating && (
            <CredibilityBadge rating={article.credibilityRating as CredibilityRating} />
          )}
          <span className="flex items-center gap-1 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            {formatRelativeTime(article.publishedAt)}
          </span>
          {article.author && (
            <span className="text-sm text-zinc-500">by {article.author}</span>
          )}
          <a href="#comments" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <MessageSquare className="h-4 w-4" />
            {commentCount}
          </a>
          <div className="ml-auto">
            <VoteButtons
              articleId={article.id}
              initialScore={article.voteScore ?? 0}
              size="md"
              layout="horizontal"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          {article.title}
        </h1>

        {/* Summary */}
        {article.summary && (
          <p className="mt-4 text-lg text-zinc-400">
            {article.summary}
          </p>
        )}

        {/* Featured Image */}
        {articleImage && (
          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={articleImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-zinc-500" />
            {article.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        {article.content && (
          <div className="prose prose-invert mt-8 max-w-none space-y-4">
            {article.content.split('\n\n').filter(p => p.trim()).map((paragraph, i) => {
              const trimmed = paragraph.trim();
              // Lines wrapped in **bold** → render as H2 subheading
              const headingMatch = trimmed.match(/^\*\*(.+)\*\*$/);
              if (headingMatch) {
                return (
                  <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3">
                    {headingMatch[1]}
                  </h2>
                );
              }
              // Lines starting with ## → render as H2
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3">
                    {trimmed.replace(/^##\s*/, '')}
                  </h2>
                );
              }
              // Lines starting with ### → render as H3
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-lg font-semibold text-zinc-200 mt-6 mb-2">
                    {trimmed.replace(/^###\s*/, '')}
                  </h3>
                );
              }
              // Regular paragraph — also handle inline **bold** and *italic*
              const html = trimmed
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>');
              return (
                <p key={i} className="text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
              );
            })}
          </div>
        )}

        {/* Source Link */}
        <Card className="mt-4">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-zinc-400">Original source</p>
              <p className="font-medium text-white">{article.sourceName}</p>
            </div>
            <Link
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              Read Original
              <ExternalLink className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Comments */}
        <div id="comments">
          <CommentSection contentType="article" contentId={slug} />
        </div>

        {/* Trending Articles */}
        {trendingArticles.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-white">Trending Articles</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trendingArticles.map((trending) => {
                const trendingImage = getRelatedImageSync(
                  trending.title,
                  trending.tags,
                  trending.imageUrl,
                  [], [],
                  imagePool
                );
                return (
                  <Link
                    key={trending.id}
                    href={`/news/${trending.slug}`}
                    className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <div className="relative aspect-video w-full overflow-hidden">
                      {trendingImage ? (
                        <Image
                          src={trendingImage}
                          alt={trending.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                          <span className="text-2xl font-bold text-zinc-600">FF</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <span className="text-xs font-medium text-zinc-400">{trending.sourceName}</span>
                      <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-emerald-400">
                        {trending.title}
                      </h4>
                      <span className="mt-2 block text-xs text-zinc-500">
                        {formatRelativeTime(trending.publishedAt)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </div>
    </>
  );
}
