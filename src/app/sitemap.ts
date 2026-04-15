import type { MetadataRoute } from 'next';
import { db, newsArticles, clubs, competitions, whatIfScenarios } from '@/lib/db';
import { desc, isNotNull } from 'drizzle-orm';
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

  const [articles, allClubs, allCompetitions, scenarios] = await Promise.all([
    db.select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles).orderBy(desc(newsArticles.publishedAt)).limit(2000),
    db.select({ slug: clubs.slug }).from(clubs).where(isNotNull(clubs.slug)).limit(5000),
    db.select({ slug: competitions.slug }).from(competitions).where(isNotNull(competitions.slug)),
    db.select({ slug: whatIfScenarios.slug, updatedAt: whatIfScenarios.updatedAt }).from(whatIfScenarios).limit(500),
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

  return [
    ...staticPages,
    ...newsUrls,
    ...teamUrls,
    ...tableUrls,
    ...fixtureUrls,
    ...whatIfUrls,
  ];
}
