import type { MetadataRoute } from 'next';
import { db, newsArticles, clubs, competitions, whatIfScenarios, matches } from '@/lib/db';
import { desc, isNotNull, and, gte, sql } from 'drizzle-orm';
import { SITE_CONFIG } from '@/lib/seo';
import { isWorldCupActive } from '@/lib/worldcup';
import { LOCALES, DEFAULT_LOCALE, LOCALE_BCP47, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

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

/** Coerce to Date; fall back to `fallback` on null/invalid/undefined. */
function safeDate(v: unknown, fallback: Date): Date {
  if (v == null) return fallback;
  const d = v instanceof Date ? v : new Date(v as string | number);
  return isNaN(d.getTime()) ? fallback : d;
}

/**
 * Single sitemap — no generateSitemaps().
 *
 * We tried splitting into chunks via generateSitemaps but Next.js 16 has a
 * conflict: sitemap.ts + generateSitemaps reserves /sitemap.xml for an
 * auto-index that wasn't emitting, while a custom route at
 * app/sitemap.xml/route.ts got shadowed by the convention. End result was
 * a 404 on the canonical URL. Back to one sitemap — kept the null-safety
 * and per-query try/catch so a single bad row can't 500 the whole thing,
 * and trimmed the news × locale multiplication to stay well under Google's
 * 50k-URL limit with headroom.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url;
  const now = new Date();

  const wcActive = isWorldCupActive();

  const STATIC_PATHS: Array<{ path: string; changeFrequency: SitemapEntry['changeFrequency']; priority: number }> = [
    { path: '',            changeFrequency: 'hourly',  priority: 1.0  },
    // World Cup hub — boosted to near-top priority while the tournament is on.
    { path: '/world-cup',  changeFrequency: wcActive ? 'hourly' : 'monthly', priority: wcActive ? 0.95 : 0.4 },
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

  // Static pages × locales with hreflang alternates
  for (const s of STATIC_PATHS) {
    for (const loc of LOCALES) {
      out.push({
        url: `${base}${prefix(loc)}${s.path}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: { languages: buildAlternates(s.path) },
      });
    }
  }

  // News articles — canonical URL only (default locale). Hreflang alternates
  // tell Google about the translations, so we don't need a separate URL per
  // locale × article. This was the primary source of bloat before.
  try {
    const articles = await db
      .select({ slug: newsArticles.slug, publishedAt: newsArticles.publishedAt })
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(5000);
    for (const a of articles) {
      if (!a.slug) continue;
      const path = `/news/${a.slug}`;
      out.push({
        url: `${base}${path}`,
        lastModified: safeDate(a.publishedAt, now),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: buildAlternates(path) },
      });
    }
  } catch (e) {
    console.error('[sitemap] news query failed:', e instanceof Error ? e.message : e);
  }

  // Matches — ±14 day window
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

    for (const m of recentMatches) {
      if (!m.slug) continue;
      const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(m.status ?? '');
      const kickoff = safeDate(m.kickoff, now);
      const hoursUntil = (kickoff.getTime() - now.getTime()) / 3_600_000;
      const isUpcomingSoon = hoursUntil > 0 && hoursUntil < 24;
      const isFinished = m.status === 'finished';
      out.push({
        url: `${base}/matches/${m.slug}`,
        lastModified: safeDate(m.updatedAt, kickoff),
        changeFrequency: (isLive ? 'always' : isUpcomingSoon ? 'hourly' : isFinished ? 'weekly' : 'daily') as SitemapEntry['changeFrequency'],
        priority: isLive ? 0.95 : isUpcomingSoon ? 0.85 : isFinished ? 0.6 : 0.75,
      });
    }
  } catch (e) {
    console.error('[sitemap] matches query failed:', e instanceof Error ? e.message : e);
  }

  // Clubs
  try {
    const allClubs = await db
      .select({ slug: clubs.slug })
      .from(clubs)
      .where(isNotNull(clubs.slug))
      .limit(5000);
    for (const c of allClubs) {
      if (!c.slug) continue;
      out.push({
        url: `${base}/teams/${c.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (e) {
    console.error('[sitemap] clubs query failed:', e instanceof Error ? e.message : e);
  }

  // Competition table pages
  try {
    const allCompetitions = await db
      .select({ slug: competitions.slug })
      .from(competitions)
      .where(isNotNull(competitions.slug));
    for (const c of allCompetitions) {
      if (!c.slug) continue;
      out.push({
        url: `${base}/tables?competition=${c.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error('[sitemap] competitions query failed:', e instanceof Error ? e.message : e);
  }

  // Fixture date buckets (rolling 10-day window)
  for (let i = -3; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    out.push({
      url: `${base}/fixtures?date=${dateStr}`,
      lastModified: now,
      changeFrequency: i === 0 ? 'hourly' : 'daily',
      priority: i === 0 ? 0.9 : 0.6,
    });
  }

  // What-if scenarios
  try {
    const scenarios = await db
      .select({ slug: whatIfScenarios.slug, updatedAt: whatIfScenarios.updatedAt })
      .from(whatIfScenarios)
      .limit(500);
    for (const s of scenarios) {
      if (!s.slug) continue;
      out.push({
        url: `${base}/what-if/${s.slug}`,
        lastModified: safeDate(s.updatedAt, now),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  } catch (e) {
    console.error('[sitemap] what-if query failed:', e instanceof Error ? e.message : e);
  }

  return out;
}
