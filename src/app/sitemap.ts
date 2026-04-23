import type { MetadataRoute } from 'next';
import { db, newsArticles, clubs, competitions, whatIfScenarios, matches } from '@/lib/db';
import { desc, isNotNull, and, gte, sql } from 'drizzle-orm';
import { SITE_CONFIG } from '@/lib/seo';
import { LOCALES, DEFAULT_LOCALE, LOCALE_BCP47, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * Sitemap is split into chunks using Next.js's generateSitemaps pattern.
 * A single giant sitemap used to 500 under load (memory + per-entry hreflang
 * made each article ~500 bytes of XML, which tipped over at ~20k entries).
 * Each chunk below emits a separate /sitemap-<id>.xml and Google stitches
 * them via a sitemap index automatically.
 */
export async function generateSitemaps() {
  return [
    { id: 0 }, // static + competitions
    { id: 1 }, // news articles
    { id: 2 }, // teams (clubs)
    { id: 3 }, // matches (last 14d → 14d ahead)
    { id: 4 }, // what-if scenarios + fixture dates
  ];
}

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

/** Safely coerce a value to a Date, falling back to `now` on null/invalid. */
function safeDate(v: unknown, fallback: Date): Date {
  if (v == null) return fallback;
  const d = v instanceof Date ? v : new Date(v as string | number);
  return isNaN(d.getTime()) ? fallback : d;
}

async function staticAndCompetitionsSitemap(now: Date): Promise<SitemapEntry[]> {
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

  const out: SitemapEntry[] = [];
  for (const s of STATIC_PATHS) {
    for (const loc of LOCALES) {
      out.push({
        url: `${SITE_CONFIG.url}${prefix(loc)}${s.path}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: { languages: buildAlternates(s.path) },
      });
    }
  }

  try {
    const allCompetitions = await db
      .select({ slug: competitions.slug })
      .from(competitions)
      .where(isNotNull(competitions.slug));
    for (const c of allCompetitions) {
      if (!c.slug) continue;
      out.push({
        url: `${SITE_CONFIG.url}/tables?competition=${c.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error('[sitemap] competitions query failed:', e instanceof Error ? e.message : e);
  }

  return out;
}

async function newsSitemap(now: Date): Promise<SitemapEntry[]> {
  try {
    const articles = await db
      .select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(2000);

    const out: SitemapEntry[] = [];
    for (const a of articles) {
      if (!a.slug) continue;
      const path = `/news/${a.slug}`;
      const lastModified = safeDate(a.publishedAt, now);
      for (const loc of LOCALES) {
        out.push({
          url: `${SITE_CONFIG.url}${prefix(loc)}${path}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages: buildAlternates(path) },
        });
      }
    }
    return out;
  } catch (e) {
    console.error('[sitemap] news query failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

async function teamsSitemap(now: Date): Promise<SitemapEntry[]> {
  try {
    const allClubs = await db
      .select({ slug: clubs.slug })
      .from(clubs)
      .where(isNotNull(clubs.slug))
      .limit(5000);
    return allClubs
      .filter((c) => !!c.slug)
      .map((c) => ({
        url: `${SITE_CONFIG.url}/teams/${c.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
  } catch (e) {
    console.error('[sitemap] clubs query failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

async function matchesSitemap(now: Date): Promise<SitemapEntry[]> {
  try {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 14);
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 14);

    const recentMatches = await db
      .select({
        slug: matches.slug,
        status: matches.status,
        kickoff: matches.kickoff,
        updatedAt: matches.updatedAt,
      })
      .from(matches)
      .where(
        and(
          isNotNull(matches.slug),
          gte(matches.kickoff, windowStart),
          sql`${matches.kickoff} <= ${windowEnd}`,
        ),
      )
      .orderBy(desc(matches.kickoff))
      .limit(3000);

    return recentMatches
      .filter((m) => !!m.slug)
      .map((m) => {
        const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(m.status ?? '');
        const kickoff = safeDate(m.kickoff, now);
        const hoursUntil = (kickoff.getTime() - now.getTime()) / 3_600_000;
        const isUpcomingSoon = hoursUntil > 0 && hoursUntil < 24;
        const isFinished = m.status === 'finished';
        return {
          url: `${SITE_CONFIG.url}/matches/${m.slug}`,
          lastModified: safeDate(m.updatedAt, kickoff),
          changeFrequency: (isLive
            ? 'always'
            : isUpcomingSoon
            ? 'hourly'
            : isFinished
            ? 'weekly'
            : 'daily') as SitemapEntry['changeFrequency'],
          priority: isLive ? 0.95 : isUpcomingSoon ? 0.85 : isFinished ? 0.6 : 0.75,
        };
      });
  } catch (e) {
    console.error('[sitemap] matches query failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

async function whatIfAndFixturesSitemap(now: Date): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];

  try {
    const scenarios = await db
      .select({ slug: whatIfScenarios.slug, updatedAt: whatIfScenarios.updatedAt })
      .from(whatIfScenarios)
      .limit(500);
    for (const s of scenarios) {
      if (!s.slug) continue;
      out.push({
        url: `${SITE_CONFIG.url}/what-if/${s.slug}`,
        lastModified: safeDate(s.updatedAt, now),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  } catch (e) {
    console.error('[sitemap] what-if query failed:', e instanceof Error ? e.message : e);
  }

  for (let i = -3; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    out.push({
      url: `${SITE_CONFIG.url}/fixtures?date=${dateStr}`,
      lastModified: now,
      changeFrequency: i === 0 ? 'hourly' : 'daily',
      priority: i === 0 ? 0.9 : 0.6,
    });
  }

  return out;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  switch (id) {
    case 0: return staticAndCompetitionsSitemap(now);
    case 1: return newsSitemap(now);
    case 2: return teamsSitemap(now);
    case 3: return matchesSitemap(now);
    case 4: return whatIfAndFixturesSitemap(now);
    default: return [];
  }
}
