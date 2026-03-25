// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)
import type { MetadataRoute } from 'next';
import { db, newsArticles, youtubeVideos, whatIfScenarios } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { SITE_CONFIG } from '@/lib/seo';

// Force dynamic rendering - sitemap needs database access
export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];

// Static pages with priorities and change frequencies
const staticPages: SitemapEntry[] = [
  {
    url: SITE_CONFIG.url,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${SITE_CONFIG.url}/news`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: `${SITE_CONFIG.url}/videos`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  },
  {
    url: `${SITE_CONFIG.url}/what-if`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  {
    url: `${SITE_CONFIG.url}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    url: `${SITE_CONFIG.url}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    url: `${SITE_CONFIG.url}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.3,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, videos, scenarios] = await Promise.all([
    db
      .select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(1000),
    db
      .select({ id: youtubeVideos.id, publishedAt: youtubeVideos.publishedAt })
      .from(youtubeVideos)
      .orderBy(desc(youtubeVideos.publishedAt))
      .limit(500),
    db
      .select({ slug: whatIfScenarios.slug, createdAt: whatIfScenarios.createdAt, updatedAt: whatIfScenarios.updatedAt })
      .from(whatIfScenarios),
  ]);

  // Map news articles
  const newsUrls: SitemapEntry[] = articles.map((article) => ({
    url: `${SITE_CONFIG.url}/news/${article.slug}`,
    lastModified: new Date(article.publishedAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Map videos
  const videoUrls: SitemapEntry[] = videos.map((video) => ({
    url: `${SITE_CONFIG.url}/videos/${video.id}`,
    lastModified: new Date(video.publishedAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Map what-if scenarios
  const whatIfUrls: SitemapEntry[] = scenarios.map((scenario) => ({
    url: `${SITE_CONFIG.url}/what-if/${scenario.slug}`,
    lastModified: new Date(scenario.updatedAt || scenario.createdAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticPages, ...newsUrls, ...videoUrls, ...whatIfUrls];
}
