// @ts-nocheck — Stub API data, will be properly typed when rewritten for Footy Feed
import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, aggregationJobs } from '@/lib/db';
import { eq, desc, gte } from 'drizzle-orm';
import { detectIncidentFromArticle, createLiveIncident, getCurrentRaceSession } from '@/lib/api/regulations';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting incident detection...');
    const startTime = Date.now();

    // Check if there's a live session
    const currentSession = await getCurrentRaceSession();
    if (!currentSession?.isLive) {
      return NextResponse.json({
        success: true,
        message: 'No live session detected',
        incidentsCreated: 0,
      });
    }

    const [job] = await db.insert(aggregationJobs).values({
      jobType: 'detect_incidents',
      status: 'running',
    }).returning();

    // Get recent articles (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentArticles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        content: newsArticles.content,
        publishedAt: newsArticles.publishedAt,
      })
      .from(newsArticles)
      .where(gte(newsArticles.publishedAt, twoHoursAgo))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(20);

    let incidentsCreated = 0;
    const results: Array<{ articleId: string; title: string; isIncident: boolean }> = [];

    for (const article of recentArticles) {
      if (!article.content) continue;

      const detection = await detectIncidentFromArticle(
        article.title,
        article.content,
        article.publishedAt || new Date()
      );

      if (detection.isIncident && detection.incident) {
        const incident = await createLiveIncident(
          currentSession.raceId,
          'race',
          detection.incident
        );

        if (incident) {
          incidentsCreated++;
        }
      }

      results.push({
        articleId: article.id,
        title: article.title,
        isIncident: detection.isIncident,
      });
    }

    const duration = Date.now() - startTime;

    await db.update(aggregationJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        itemsProcessed: recentArticles.length,
        metadata: {
          incidentsCreated,
          duration,
        },
      })
      .where(eq(aggregationJobs.id, job.id));

    console.log('Incident detection complete: ' + incidentsCreated + ' incidents from ' + recentArticles.length + ' articles');

    return NextResponse.json({
      success: true,
      raceId: currentSession.raceId,
      raceName: currentSession.raceName,
      articlesChecked: recentArticles.length,
      incidentsCreated,
      duration,
      results,
    });
  } catch (error) {
    console.error('Incident detection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
