import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, aggregationJobs } from '@/lib/db';
import { eq, isNotNull, sql } from 'drizzle-orm';
import { extractAndSpin } from '@/lib/api/article-spinner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    console.log(`[Respin] Starting article respin (limit: ${limit})...`);
    const startTime = Date.now();

    const [job] = await db.insert(aggregationJobs).values({
      jobType: 'respin',
      status: 'running',
    }).returning();

    // Fetch articles that have original content to work with.
    // Prefer articles that still have their originalTitle set (meaning they were
    // processed by the aggregator but may still contain fluff).
    // We use the original title + current content as source material.
    const articles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        originalTitle: newsArticles.originalTitle,
        content: newsArticles.content,
        summary: newsArticles.summary,
      })
      .from(newsArticles)
      .where(isNotNull(newsArticles.content))
      .orderBy(sql`${newsArticles.publishedAt} DESC`)
      .limit(limit);

    console.log(`[Respin] Found ${articles.length} articles to reprocess`);

    let processed = 0;
    let failed = 0;

    for (const article of articles) {
      try {
        // Use original title if available for better context, fall back to current
        const sourceTitle = article.originalTitle || article.title;
        const sourceContent = article.content || article.summary || '';

        if (!sourceContent.trim()) {
          console.log(`[Respin] Skipping empty article: ${article.id}`);
          continue;
        }

        console.log(`[Respin] Processing: ${sourceTitle.slice(0, 60)}...`);

        const result = await extractAndSpin(sourceTitle, sourceContent, article.summary || undefined);

        // Update the article with the cleaned-up version
        await db
          .update(newsArticles)
          .set({
            title: result.title,
            summary: result.summary,
            content: result.content,
          })
          .where(eq(newsArticles.id, article.id));

        processed++;
        console.log(`[Respin] Done (${processed}/${articles.length})`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.error(`[Respin] Failed article ${article.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    if (job) {
      await db
        .update(aggregationJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          itemsProcessed: processed,
          metadata: { failed, total: articles.length, duration_ms: duration },
        })
        .where(eq(aggregationJobs.id, job.id));
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: articles.length,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[Respin] Job failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
