import type { MetadataRoute } from 'next';
import { db, newsArticles, clubs, competitions, whatIfScenarios, matches } from '@/lib/db';
import { desc, isNotNull, and, gte, inArray, sql } from 'drizzle-orm';
import { SITE_CONFIG } from '@/lib/seo';
import { LOCALES, DEFAULT_LOCALE, LOCALE_BCP47, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];

function prefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

function buildAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[LOCALE_BCP47[loc]] = `${SITE_CONFIG.url}${prefix(loc)}${path}`;
  }
  languages['x-default'] = `${SITE_CONFIG.url}${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url;
  const now = new Date();

  const STATIC_PATHS: Array<{ path: string; changeFrequency: SitemapEntry['changeFrequency']; priority: number }> = [
    { path: '',            changeFrequency: 'hourly',  priority: 1.0  },
    { path: '/news',       changeFrequency: 'hourly',  priority: 0.9  },
    { path: '/live',       changeFrequency: 'always',  priority: 0.95 },
    { path: '/fixtures',   changeFrequency: 'hourly',  priority: 0.9  },
    { path: '/tables',     changeFrequency: 'daily',   priority: 0.85 },
    { path: '/transfers',  changeFrequency: 'hourly',  priority: 0.8  },
    { path: '/predictions',changeFrequency: 'daily',   priority: 0.7  },
    { path: '/videos',     changeFrequency: 'daily',   priority: 0.7  },
    { path: '/compare',    changeFrequency: 'weekly',  priority: 0.6  },
    { path: '/rules',      changeFrequency: 'monthly', priority: 0.7  },
    { path: '/what-if',    changeFrequency: 'weekly',  priority: 0.6  },
    { path: '/search',     changeFrequency: 'daily',   priority: 0.5  },
    { path: '/about',      changeFrequency: 'monthly', priority: 0.4  },
    { path: '/contact',    changeFrequency: 'monthly', priority: 0.4  },
    { path: '/privacy',    changeFrequency: 'monthly', priority: 0.3  },
    { path: '/terms',      changeFrequency: 'monthly', priority: 0.3  },
  ];

  // Emit one entry per (path, locale) with hreflang alternates linking siblings.
  const staticPages: SitemapEntry[] = [];
  for (const s of STATIC_PATHS) {
    for (const loc of LOCALES) {
      staticPages.push({
        url: `${base}${prefix(loc)}${s.path}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: { languages: buildAlternates(s.path) },
      });
    }
  }

  // Match window: from 14 days ago to 14 days ahead — covers recent finishes,
  // live matches now, and upcoming fixtures crawlers should index asap.
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 14);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + 14);

  const [articles, allClubs, allCompetitions, scenarios, recentMatches] = await Promise.all([
    db.select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles).orderBy(desc(newsArticles.publishedAt)).limit(2000),
    db.select({ slug: clubs.slug }).from(clubs).where(isNotNull(clubs.slug)).limit(5000),
    db.select({ slug: competitions.slug }).from(competitions).where(isNotNull(competitions.slug)),
    db.select({ slug: whatIfScenarios.slug, updatedAt: whatIfScenarios.updatedAt }).from(whatIfScenarios).limit(500),
    db.select({
      slug: matches.slug,
      status: matches.status,
      kickoff: matches.kickoff,
      updatedAt: matches.updatedAt,
    })
      .from(matches)
      .where(and(isNotNull(matches.slug), gte(matches.kickoff, windowStart), sql`${matches.kickoff} <= ${windowEnd}`))
      .orderBy(desc(matches.kickoff))
      .limit(3000),
  ]);

  const newsUrls: SitemapEntry[] = [];
  for (const a of articles) {
    const path = `/news/${a.slug}`;
    const lastModified = a.publishedAt ? new Date(a.publishedAt) : now;
    for (const loc of LOCALES) {
      newsUrls.push({
        url: `${base}${prefix(loc)}${path}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: buildAlternates(path) },
      });
    }
  }

  const teamUrls: SitemapEntry[] = allClubs.map((c) => ({
    url: `${base}/teams/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const tableUrls: SitemapEntry[] = allCompetitions.map((c) => ({
    url: `${base}/tables?competition=${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

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

  const whatIfUrls: SitemapEntry[] = scenarios.map((s) => ({
    url: `${base}/what-if/${s.slug}`,
    lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Match detail URLs — live/upcoming get hourly crawl priority so crawlers
  // catch them while games are in progress.
  const matchUrls: SitemapEntry[] = recentMatches
    .filter(m => m.slug)
    .map((m) => {
      const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(m.status ?? '');
      const kickoff = m.kickoff ? new Date(m.kickoff) : now;
      const hoursUntil = (kickoff.getTime() - now.getTime()) / 3_600_000;
      const isUpcomingSoon = hoursUntil > 0 && hoursUntil < 24;
      const isFinished = m.status === 'finished';
      return {
        url: `${base}/matches/${m.slug}`,
        lastModified: m.updatedAt ? new Date(m.updatedAt) : kickoff,
        changeFrequency: (isLive ? 'always' : isUpcomingSoon ? 'hourly' : isFinished ? 'weekly' : 'daily') as SitemapEntry['changeFrequency'],
        priority: isLive ? 0.95 : isUpcomingSoon ? 0.85 : isFinished ? 0.6 : 0.75,
      };
    });

  return [
    ...staticPages,
    ...newsUrls,
    ...matchUrls,
    ...teamUrls,
    ...tableUrls,
    ...fixtureUrls,
    ...whatIfUrls,
  ];
}
