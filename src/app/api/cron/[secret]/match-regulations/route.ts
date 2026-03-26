// @ts-nocheck — Stub API data, will be properly typed when rewritten for Footy Feed
import { NextRequest, NextResponse } from 'next/server';
import { db, aggregationJobs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { processArticlesForRegulations } from '@/lib/api/regulations';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

    console.log('Starting regulation matching via cron...');
    const startTime = Date.now();

    const [job] = await db.insert(aggregationJobs).values({
      jobType: 'match_regulations',
      status: 'running',
    }).returning();

    const result = await processArticlesForRegulations(10);

    const duration = Date.now() - startTime;

    await db.update(aggregationJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        itemsProcessed: result.processed,
        metadata: {
          matched: result.matched,
          articles: result.results.map(r => ({
            id: r.articleId,
            title: r.title.substring(0, 50) + '...',
            matches: r.matchCount,
          })),
          duration,
        },
      })
      .where(eq(aggregationJobs.id, job.id));

    console.log('Regulation matching complete: ' + result.processed + ' articles processed, ' + result.matched + ' regulations linked');

    return NextResponse.json({
      success: true,
      processed: result.processed,
      matched: result.matched,
      duration,
      results: result.results,
    });
  } catch (error) {
    console.error('Regulation matching error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
