// @ts-nocheck
import { NextResponse } from 'next/server';
import { db, newsArticles, newsSources, matches, clubs } from '@/lib/db';
import { desc, gte, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Recent news (4 articles with images)
    const recentNews = await db
      .select({
        title: newsArticles.title,
        slug: newsArticles.slug,
        imageUrl: newsArticles.imageUrl,
        sourceName: newsSources.name,
        publishedAt: newsArticles.publishedAt,
      })
      .from(newsArticles)
      .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
      .where(sql`${newsArticles.imageUrl} IS NOT NULL AND ${newsArticles.credibilityRating} NOT IN ('opinion', 'rumour')`)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(4);

    // Today's fixtures/results (6 matches)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayMatches = await db.execute(sql`
      SELECT m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff,
        hc.name as home_name, hc.logo_url as home_logo,
        ac.name as away_name, ac.logo_url as away_logo,
        comp.short_name as comp_name
      FROM matches m
      JOIN clubs hc ON m.home_club_id = hc.id
      JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE (m.status IN ('live', 'halftime', 'extra_time', 'penalties')
        OR (m.kickoff >= ${startOfDay} AND m.kickoff <= ${endOfDay.toISOString()}))
      ORDER BY
        CASE WHEN m.status IN ('live', 'halftime', 'extra_time', 'penalties') THEN 0 ELSE 1 END,
        m.kickoff
      LIMIT 6
    `);

    return NextResponse.json({
      news: recentNews.map(a => ({
        title: a.title,
        slug: a.slug,
        imageUrl: a.imageUrl,
        source: a.sourceName,
        ago: Math.round((now.getTime() - new Date(a.publishedAt).getTime()) / 60000),
      })),
      matches: (todayMatches as any[]).map(m => ({
        id: m.id,
        status: m.status,
        minute: m.minute,
        homeScore: m.home_score,
        awayScore: m.away_score,
        homeName: m.home_name,
        homeLogo: m.home_logo,
        awayName: m.away_name,
        awayLogo: m.away_logo,
        comp: m.comp_name,
        kickoff: m.kickoff,
      })),
    });
  } catch {
    return NextResponse.json({ news: [], matches: [] });
  }
}
