// @ts-nocheck
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Trophy, Calendar, Newspaper, MessageSquareQuote, CircleHelp, TrendingUp, Table, Zap, BarChart3, ArrowUpRight, Mail } from 'lucide-react';
import { HeroArticle } from '@/components/news/HeroArticle';
import { CompactNewsCard } from '@/components/news/CompactNewsCard';
import { HorizontalNewsCard } from '@/components/news/HorizontalNewsCard';
import { NewsListItem } from '@/components/news/NewsListItem';
import { DailyRoundupWidget } from '@/components/news/DailyRoundupWidget';
import { getRelatedImageSync } from '@/lib/getFallbackImage';
import { db, newsArticles, newsSources, youtubeVideos, comments, leagueStandings, clubs, matches, competitionSeasons, competitions } from '@/lib/db';
import Image from 'next/image';
import { desc, eq, gte, asc, isNotNull, and, sql } from 'drizzle-orm';
import type { NewsArticle, CredibilityRating } from '@/types';
import { SITE_CONFIG, DEFAULT_KEYWORDS, generateFAQStructuredData, HOMEPAGE_FAQ, jsonLd, JsonLdScript } from '@/lib/seo';
import { NewsletterCTA } from '@/components/newsletter/NewsletterCTA';
import { LiveTicker } from '@/components/live/LiveTicker';
import { AdSlot } from '@/components/ads/AdSlot';
import { HorizontalAd, SidebarAd, NativeAd } from '@/components/ads/ProfitableAds';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { translateBatch } from '@/lib/i18n/translate';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';


export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Footy Feed - Football News Without the Waffle',
  description: 'Football news that gets straight to the point. No clickbait, no filler. Breaking stories from 12+ sources, live scores, match predictions, and player stats.',
  keywords: [
    ...DEFAULT_KEYWORDS,
    'live scores',
    'match predictions',
    'football analysis',
    'football news aggregator',
    'player comparison',
    'what if scenarios',
    'tactical analysis',
    'match previews',
    'transfer news',
  ],
  openGraph: {
    title: 'Footy Feed - Football News Without the Waffle',
    description: 'Football news that gets straight to the point. No clickbait, no filler. Breaking stories from 12+ sources, live scores, match predictions, and player stats.',
    type: 'website',
    siteName: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
    images: [
      {
        // TODO: Create /public/images/og-home.png (1200x630px) — branded homepage OG image for social sharing
      url: '/images/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Footy Feed - Football News and Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Footy Feed - Football News Without the Waffle',
    description: 'Football news that gets straight to the point. No clickbait, no filler. Breaking stories, live scores, and match predictions.',
    images: ['/images/og-home.png'],
    site: SITE_CONFIG.twitterHandle,
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
};

async function getLatestNews(): Promise<NewsArticle[]> {
  const [articles, articleImagesPool] = await Promise.all([
    db
      .select({
        id: newsArticles.id,
        sourceId: newsArticles.sourceId,
        title: newsArticles.title,
        slug: newsArticles.slug,
        summary: newsArticles.summary,
        imageUrl: newsArticles.imageUrl,
        originalUrl: newsArticles.originalUrl,
        publishedAt: newsArticles.publishedAt,
        isBreaking: newsArticles.isBreaking,
        tags: newsArticles.tags,
        credibilityRating: newsArticles.credibilityRating,
        voteScore: newsArticles.voteScore,
        sourceName: newsSources.name,
        sourceSlug: newsSources.slug,
        sourceType: newsSources.type,
        sourcePriority: newsSources.priority,
        sourceUrl: newsSources.url,
      })
      .from(newsArticles)
      .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(50),
    db
      .select({
        title: newsArticles.title,
        tags: newsArticles.tags,
        imageUrl: newsArticles.imageUrl,
      })
      .from(newsArticles)
      .where(isNotNull(newsArticles.imageUrl))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(100),
  ]);

  const imagePool = articleImagesPool
    .filter((a): a is { title: string; tags: string[] | null; imageUrl: string } => a.imageUrl !== null);

  const slugs = articles.map(a => a.slug);
  const commentCounts = slugs.length > 0 ? await db
    .select({ contentId: comments.contentId, count: sql<number>`count(*)` })
    .from(comments)
    .where(and(eq(comments.contentType, 'article'), eq(comments.status, 'active')))
    .groupBy(comments.contentId) : [];

  const countMap = new Map(commentCounts.map(c => [c.contentId, Number(c.count)]));

  return articles.map((a) => ({
    id: a.id,
    sourceId: a.sourceId || '',
    source: {
      id: a.sourceId || '',
      name: a.sourceName || 'Unknown',
      slug: a.sourceSlug || 'unknown',
      type: (a.sourceType || 'rss') as 'rss' | 'youtube' | 'twitter',
      url: a.sourceUrl || undefined,
      isActive: true,
      priority: a.sourcePriority || 99,
    },
    title: a.title,
    slug: a.slug,
    summary: a.summary || undefined,
    imageUrl: a.imageUrl || undefined,
    originalUrl: a.originalUrl,
    publishedAt: a.publishedAt.toISOString(),
    isBreaking: a.isBreaking ?? false,
    tags: a.tags || [],
    credibilityRating: (a.credibilityRating as CredibilityRating) || undefined,
    voteScore: a.voteScore ?? 0,
    commentCount: countMap.get(a.slug) || 0,
  }));
}

async function getLeagueTable() {
  try {
    // Try Premier League first, fall back to any league with standings
    let leagueFilter = eq(competitions.slug, 'premier-league');
    const plCheck = await db
      .select({ count: sql<number>`count(*)` })
      .from(leagueStandings)
      .leftJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
      .leftJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
      .where(eq(competitions.slug, 'premier-league'));

    if (Number(plCheck[0]?.count || 0) === 0) {
      // Fall back to whichever league has standings
      leagueFilter = sql`${competitions.type} = 'league'` as any;
    }

    const standings = await db
      .select({
        position: leagueStandings.position,
        played: leagueStandings.played,
        won: leagueStandings.won,
        drawn: leagueStandings.drawn,
        lost: leagueStandings.lost,
        goalsFor: leagueStandings.goalsFor,
        goalsAgainst: leagueStandings.goalsAgainst,
        goalDifference: leagueStandings.goalDifference,
        points: leagueStandings.points,
        form: leagueStandings.form,
        clubName: clubs.name,
        clubSlug: clubs.slug,
        clubCode: clubs.code,
        clubColor: clubs.primaryColor,
        clubLogoUrl: clubs.logoUrl,
        competitionName: competitions.name,
      })
      .from(leagueStandings)
      .leftJoin(clubs, eq(leagueStandings.clubId, clubs.id))
      .leftJoin(competitionSeasons, eq(leagueStandings.competitionSeasonId, competitionSeasons.id))
      .leftJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
      .where(leagueFilter)
      .orderBy(asc(leagueStandings.position))
      .limit(8);

    return standings;
  } catch {
    return [];
  }
}

async function getUpcomingMatches() {
  try {
    const now = new Date();
    const upcoming = await db
      .select({
        id: matches.id,
        kickoff: matches.kickoff,
        slug: matches.slug,
        round: matches.round,
        homeClubName: sql<string>`home_club.name`,
        homeClubCode: sql<string>`home_club.code`,
        homeClubColor: sql<string>`home_club.primary_color`,
        awayClubName: sql<string>`away_club.name`,
        awayClubCode: sql<string>`away_club.code`,
        awayClubColor: sql<string>`away_club.primary_color`,
      })
      .from(matches)
      .where(and(
        gte(matches.kickoff, now),
        eq(matches.status, 'scheduled'),
      ))
      .orderBy(asc(matches.kickoff))
      .limit(5);

    return upcoming;
  } catch {
    return [];
  }
}

async function getLatestVideos() {
  const videos = await db
    .select()
    .from(youtubeVideos)
    .orderBy(desc(youtubeVideos.publishedAt))
    .limit(5);

  return videos;
}

async function getTrendingArticles() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
      voteScore: newsArticles.voteScore,
      publishedAt: newsArticles.publishedAt,
      sourceName: newsSources.name,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(gte(newsArticles.publishedAt, oneDayAgo))
    .orderBy(desc(newsArticles.voteScore))
    .limit(5);

  return articles;
}

export default async function HomePage() {
  const [rawNews, standings, latestVideos, rawTrending, locale] = await Promise.all([
    getLatestNews(),
    getLeagueTable(),
    getLatestVideos(),
    getTrendingArticles(),
    getLocale(),
  ]);

  const t = getDictionary(locale);
  const p = locale === DEFAULT_LOCALE ? '' : `/${locale}`;

  // Translate all article titles/summaries for the current locale in one pass.
  const [news, trending] = await Promise.all([
    translateBatch(rawNews, 'news_article', [
      { key: 'title', field: 'title' },
      { key: 'summary', field: 'summary' },
    ], locale),
    translateBatch(rawTrending, 'news_article', [
      { key: 'title', field: 'title' },
    ], locale),
  ]);

  const mainNews = news.filter(a => a.credibilityRating !== 'opinion' && a.credibilityRating !== 'rumour');
  const opinions = news.filter(a => a.credibilityRating === 'opinion');
  const rumours = news.filter(a => a.credibilityRating === 'rumour');

  const heroArticle = mainNews[0] ?? null;
  const sideGridArticles = mainNews.slice(1, 5);
  const secondaryRowArticles = mainNews.slice(5, 11);

  // "More News" pulls from ALL articles (verified + opinions + rumours),
  // excluding ones already displayed above and ones featured in opinion/rumour
  // sidebars. This guarantees the section always has content.
  const featuredIds = new Set([
    heroArticle?.id,
    ...sideGridArticles.map(a => a.id),
    ...secondaryRowArticles.map(a => a.id),
    ...opinions.slice(0, 4).map(a => a.id),
    ...rumours.slice(0, 4).map(a => a.id),
  ].filter(Boolean));
  const latestArticles = news.filter(a => !featuredIds.has(a.id));

  const faqStructuredData = jsonLd(generateFAQStructuredData(HOMEPAGE_FAQ));

  return (
    <>
      <JsonLdScript data={faqStructuredData} />

      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      {/* Live scores ticker */}
      <LiveTicker />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="sr-only">Football News, Live Scores & Match Updates</h1>

        {/* Featured Section: Hero + Side Grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {heroArticle && <HeroArticle article={heroArticle} />}
          </div>

          <div className="lg:col-span-2">
            {sideGridArticles.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {sideGridArticles.map((article) => (
                  <CompactNewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Secondary Row */}
        {secondaryRowArticles.length > 0 && (
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secondaryRowArticles.map((article) => (
              <HorizontalNewsCard key={article.id} article={article} />
            ))}
          </section>
        )}

        {/* Daily Roundup Widget */}
        <section className="mt-6">
          <DailyRoundupWidget />
        </section>

        {/* Opinions & Transfer Rumours */}
        {(opinions.length > 0 || rumours.length > 0) && (
          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Opinions */}
            {opinions.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-zinc-700/50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                    <MessageSquareQuote className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t.home.opinions}</h2>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {opinions.slice(0, 4).map((article) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="h-16 w-24 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-zinc-500">{article.source?.name}</span>
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(article.publishedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer Rumours */}
            {rumours.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-zinc-700/50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                    <CircleHelp className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t.home.transferRumours}</h2>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {rumours.slice(0, 4).map((article) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="h-16 w-24 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-zinc-500">{article.source?.name}</span>
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(article.publishedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="mt-8">
          <NewsletterCTA source="homepage" variant="banner" />
        </section>

        {/* Ad between hero/content and More News */}
        <HorizontalAd className="my-6" />

        {/* More News + Sidebar */}
        <section className="mt-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* News List */}
            <div className="lg:col-span-2">
              {latestArticles.length > 0 && (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t.home.moreNews}</h2>
                  </div>
                  <div className="space-y-3">
                    {latestArticles.slice(0, 15).map((article, i) => (
                      <div key={article.id}>
                        <NewsListItem article={article} />
                        {/* Native ad after 5th article */}
                        {i === 4 && <NativeAd className="my-3" />}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4 text-center">
                <Link
                  href={`${p}/news`}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  {t.home.viewAllNews}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">

              {/* Quick Links */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white tracking-tight">{t.home.explore}</span>
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

              {/* Trending Articles */}
              {trending.length > 0 && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
                  <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-red-500" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-bold text-white tracking-tight">{t.home.trending}</span>
                    </div>
                    <div className="space-y-3">
                      {trending.map((article, i) => (
                        <Link
                          key={article.id}
                          href={`/news/${article.slug}`}
                          className="flex gap-3 group"
                        >
                          <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-zinc-800 text-xs font-bold text-zinc-400 group-hover:bg-emerald-600/20 group-hover:text-emerald-400 transition-colors">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                              {article.title}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{article.sourceName}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* League Table Widget */}
              {standings.length > 0 && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-bold text-white tracking-tight">{(standings[0]?.competitionName || t.home.leagueTable).toUpperCase()}</span>
                      </div>
                      <Link href={`${p}/tables`} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        {t.home.fullTable} →
                      </Link>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-zinc-500 border-b border-zinc-700/50">
                          <th className="py-1 text-left w-6">#</th>
                          <th className="py-1 text-left">{t.tables.club}</th>
                          <th className="py-1 text-center w-8">{t.tables.played}</th>
                          <th className="py-1 text-center w-8">{t.tables.gd}</th>
                          <th className="py-1 text-right w-8">{t.tables.pts}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s) => (
                          <tr key={s.clubSlug} className="border-b border-zinc-800/50">
                            <td className="py-1.5 text-zinc-400">{s.position}</td>
                            <td className="py-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.clubColor || '#666' }} />
                                <span className="text-white font-medium">{s.clubCode || s.clubName}</span>
                              </div>
                            </td>
                            <td className="py-1.5 text-center text-zinc-400">{s.played}</td>
                            <td className="py-1.5 text-center text-zinc-400">
                              {(s.goalDifference ?? 0) > 0 ? '+' : ''}{s.goalDifference}
                            </td>
                            <td className="py-1.5 text-right font-bold text-white">{s.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Newsletter Sidebar CTA */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white tracking-tight">{t.home.newsletter}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">{t.home.newsletterBlurb}</p>
                  <NewsletterCTA source="sidebar" variant="inline" />
                </div>
              </div>

              {/* Sidebar Ad */}
              <SidebarAd />

              {/* Latest Videos */}
              {latestVideos.length > 0 && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
                  <div className="h-1 bg-gradient-to-r from-rose-500 via-red-400 to-orange-500" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-bold text-white tracking-tight">{t.home.latestVideos}</span>
                      </div>
                      <Link href={`${p}/videos`} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        {t.home.allVideos} →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {latestVideos.slice(0, 4).map((video) => (
                        <Link key={video.id} href={`/videos/${video.videoId}`} className="flex gap-3 group">
                          {video.thumbnailUrl && (
                            <Image src={video.thumbnailUrl} alt={video.title} width={120} height={68} className="rounded object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2">{video.title}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">{video.channelName}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

      </div>
      </div>
    </>
  );
}
