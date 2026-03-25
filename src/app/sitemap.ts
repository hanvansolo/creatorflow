import type { MetadataRoute } from 'next';
import { db, newsArticles, races, drivers, teams, circuits, youtubeVideos, technicalDeepDives, whatIfScenarios } from '@/lib/db';
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
    url: `${SITE_CONFIG.url}/calendar`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${SITE_CONFIG.url}/drivers`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${SITE_CONFIG.url}/teams`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${SITE_CONFIG.url}/standings/drivers`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${SITE_CONFIG.url}/standings/constructors`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${SITE_CONFIG.url}/tracks`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${SITE_CONFIG.url}/videos`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  },
  {
    url: `${SITE_CONFIG.url}/deep-dives`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${SITE_CONFIG.url}/what-if`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  {
    url: `${SITE_CONFIG.url}/live`,
    lastModified: new Date(),
    changeFrequency: 'always',
    priority: 0.9,
  },
  {
    url: `${SITE_CONFIG.url}/predictions`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${SITE_CONFIG.url}/compare`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${SITE_CONFIG.url}/regulations`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${SITE_CONFIG.url}/testing`,
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
  {
    url: `${SITE_CONFIG.url}/news/roundup`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all dynamic content from database
  const [
    articles,
    allRaces,
    allDrivers,
    allTeams,
    allCircuits,
    videos,
    deepDives,
    scenarios,
  ] = await Promise.all([
    db
      .select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(1000),
    db
      .select({ slug: races.slug, updatedAt: races.updatedAt })
      .from(races)
      .orderBy(desc(races.raceDatetime)),
    db
      .select({ slug: drivers.slug, updatedAt: drivers.updatedAt })
      .from(drivers)
      .where(eq(drivers.isActive, true)),
    db
      .select({ slug: teams.slug, updatedAt: teams.updatedAt })
      .from(teams)
      .where(eq(teams.isActive, true)),
    db
      .select({ slug: circuits.slug, updatedAt: circuits.updatedAt })
      .from(circuits),
    db
      .select({ id: youtubeVideos.id, publishedAt: youtubeVideos.publishedAt })
      .from(youtubeVideos)
      .orderBy(desc(youtubeVideos.publishedAt))
      .limit(500),
    db
      .select({ slug: technicalDeepDives.slug, updatedAt: technicalDeepDives.updatedAt, createdAt: technicalDeepDives.createdAt })
      .from(technicalDeepDives)
      .where(eq(technicalDeepDives.isPublished, true)),
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

  // Map races/calendar
  const raceUrls: SitemapEntry[] = allRaces.map((race) => ({
    url: `${SITE_CONFIG.url}/calendar/${race.slug}`,
    lastModified: new Date(race.updatedAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Map drivers
  const driverUrls: SitemapEntry[] = allDrivers.map((driver) => ({
    url: `${SITE_CONFIG.url}/drivers/${driver.slug}`,
    lastModified: new Date(driver.updatedAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Map teams
  const teamUrls: SitemapEntry[] = allTeams.map((team) => ({
    url: `${SITE_CONFIG.url}/teams/${team.slug}`,
    lastModified: new Date(team.updatedAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Map circuits/tracks
  const circuitUrls: SitemapEntry[] = allCircuits.map((circuit) => ({
    url: `${SITE_CONFIG.url}/tracks/${circuit.slug}`,
    lastModified: new Date(circuit.updatedAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Map videos
  const videoUrls: SitemapEntry[] = videos.map((video) => ({
    url: `${SITE_CONFIG.url}/videos/${video.id}`,
    lastModified: new Date(video.publishedAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Map deep dives
  const deepDiveUrls: SitemapEntry[] = deepDives.map((dive) => ({
    url: `${SITE_CONFIG.url}/deep-dives/${dive.slug}`,
    lastModified: new Date(dive.updatedAt || dive.createdAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Map what-if scenarios
  const whatIfUrls: SitemapEntry[] = scenarios.map((scenario) => ({
    url: `${SITE_CONFIG.url}/what-if/${scenario.slug}`,
    lastModified: new Date(scenario.updatedAt || scenario.createdAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...newsUrls,
    ...raceUrls,
    ...driverUrls,
    ...teamUrls,
    ...circuitUrls,
    ...videoUrls,
    ...deepDiveUrls,
    ...whatIfUrls,
  ];
}
