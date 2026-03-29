import type { MetadataRoute } from 'next';
import { db, newsArticles, clubs, competitions, whatIfScenarios } from '@/lib/db';
import { desc, isNotNull, sql } from 'drizzle-orm';
import { SITE_CONFIG } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url;
  const now = new Date();

  // Static pages
  const staticPages: SitemapEntry[] = [
    { url: base, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${base}/news`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/live`, lastModified: now, changeFrequency: 'always', priority: 0.95 },
    { url: `${base}/fixtures`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/tables`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/transfers`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/predictions`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/videos`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/rules`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/what-if`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.5 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Dynamic pages — fetch in parallel
  const [articles, allClubs, allCompetitions, scenarios] = await Promise.all([
    db
      .select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(2000),
    db
      .select({ slug: clubs.slug })
      .from(clubs)
      .where(isNotNull(clubs.slug))
      .limit(5000),
    db
      .select({ slug: competitions.slug })
      .from(competitions)
      .where(isNotNull(competitions.slug)),
    db
      .select({ slug: whatIfScenarios.slug, updatedAt: whatIfScenarios.updatedAt })
      .from(whatIfScenarios)
      .limit(500),
  ]);

  // News articles
  const newsUrls: SitemapEntry[] = articles.map((a) => ({
    url: `${base}/news/${a.slug}`,
    lastModified: a.publishedAt ? new Date(a.publishedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Team pages
  const teamUrls: SitemapEntry[] = allClubs.map((c) => ({
    url: `${base}/teams/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Competition table pages
  const tableUrls: SitemapEntry[] = allCompetitions.map((c) => ({
    url: `${base}/tables?competition=${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // Fixture pages by date (today + next 7 days + last 3 days)
  const fixtureUrls: SitemapEntry[] = [];
  for (let i = -3; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    fixtureUrls.push({
      url: `${base}/fixtures?date=${dateStr}`,
      lastModified: now,
      changeFrequency: i === 0 ? 'hourly' : 'daily',
      priority: i === 0 ? 0.9 : 0.6,
    });
  }

  // What-if scenarios
  const whatIfUrls: SitemapEntry[] = scenarios.map((s) => ({
    url: `${base}/what-if/${s.slug}`,
    lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...newsUrls,
    ...teamUrls,
    ...tableUrls,
    ...fixtureUrls,
    ...whatIfUrls,
  ];
}
