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
import { db, newsArticles, newsSources, comments, leagueStandings, clubs, competitionSeasons, competitions } from '@/lib/db';
import { LiveTicker } from '@/components/live/LiveTicker';
import { NewsletterCTA } from '@/components/newsletter/NewsletterCTA';
import { TrendingUp, Trophy, Calendar, Zap, Table, BarChart3, ArrowUpRight, Newspaper, ArrowRight } from 'lucide-react';
import { eq, desc, ne, asc, isNotNull, and, sql } from 'drizzle-orm';
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

  // Fetch trending articles, image pool, annotated content, comment count, and sidebar data
  const [trendingArticles, imagePool, annotatedContent, commentCountResult, latestArticles, topStandings] = await Promise.all([
    getTrendingArticles(article.id),
    getArticleImagePool(),
    article.content ? prepareAnnotatedContent(article.content) : null,
    db.select({ count: sql<number>`count(*)` }).from(comments).where(and(eq(comments.contentType, 'article'), eq(comments.contentId, slug), eq(comments.status, 'active'))),
    // Latest 5 articles for sidebar
    db.select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
      sourceName: newsSources.name,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(and(ne(newsArticles.slug, slug)))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(6),
    // Top league standings for sidebar
    db.select({
      position: leagueStandings.position,
      points: leagueStandings.points,
      clubName: clubs.name,
      clubSlug: clubs.slug,
      clubCode: clubs.code,
      clubColor: clubs.primaryColor,
      competitionName: competitions.name,
    })
    .from(leagueStandings)
    .innerJoin(clubs, eq(leagueStandings.clubId, clubs.id))
    .innerJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .where(eq(competitions.slug, 'premier-league'))
    .orderBy(asc(leagueStandings.position))
    .limit(6),
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

      {/* Live ticker */}
      <LiveTicker />

      {/* Article + Sidebar grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <article className="lg:col-span-2">
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

      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        {/* Quick Links */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white tracking-tight">EXPLORE</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/tables', label: 'Tables', icon: Table },
                { href: '/fixtures', label: 'Fixtures', icon: Calendar },
                { href: '/live', label: 'Live Scores', icon: Zap },
                { href: '/transfers', label: 'Transfers', icon: ArrowUpRight },
                { href: '/predictions', label: 'Predictions', icon: BarChart3 },
                { href: '/videos', label: 'Videos', icon: Newspaper },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 hover:border-emerald-500/30 transition-all"
                >
                  <item.icon className="h-3.5 w-3.5 text-emerald-500" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Latest News */}
        {latestArticles.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-red-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-white tracking-tight">LATEST NEWS</span>
                </div>
                <Link href="/news" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  All news →
                </Link>
              </div>
              <div className="space-y-3">
                {latestArticles.map((item, i) => (
                  <Link key={item.id} href={`/news/${item.slug}`} className="flex gap-3 group">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-12 w-18 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-18 rounded bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-zinc-600 font-bold">FF</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.sourceName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* League Table */}
        {topStandings.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white tracking-tight">
                    {(topStandings[0]?.competitionName || 'LEAGUE TABLE').toUpperCase()}
                  </span>
                </div>
                <Link href="/tables" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  Full table →
                </Link>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-700/50">
                    <th className="py-1 text-left w-6">#</th>
                    <th className="py-1 text-left">Club</th>
                    <th className="py-1 text-right w-8">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {topStandings.map((s) => (
                    <tr key={s.clubSlug} className="border-b border-zinc-800/50">
                      <td className="py-1.5 text-zinc-400">{s.position}</td>
                      <td className="py-1.5">
                        <Link href={`/teams/${s.clubSlug}`} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.clubColor || '#666' }} />
                          <span className="text-white font-medium">{s.clubCode || s.clubName}</span>
                        </Link>
                      </td>
                      <td className="py-1.5 text-right font-bold text-white">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Newsletter */}
        <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
          <div className="p-4">
            <span className="text-sm font-bold text-white tracking-tight">NEWSLETTER</span>
            <p className="text-xs text-zinc-400 mt-1 mb-3">Football news without the waffle. Weekly.</p>
            <NewsletterCTA source="article-sidebar" variant="inline" />
          </div>
        </div>
      </aside>
      </div>
      </div>
    </div>
    </>
  );
}
