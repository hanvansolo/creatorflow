import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, aggregationJobs } from '@/lib/db';
import { eq, sql, or, isNull } from 'drizzle-orm';
import { rewriteHeadline } from '@/lib/api/article-spinner';

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const dryRun = url.searchParams.get('dry') === '1';

    const startTime = Date.now();
    console.log(`[RewriteTitles] Starting (limit=${limit}, offset=${offset}, dry=${dryRun})`);

    const [job] = await db.insert(aggregationJobs).values({
      jobType: 'rewrite_titles',
      status: 'running',
    }).returning();

    // Target articles whose published title still matches the source verbatim:
    //   (a) title === originalTitle  (explicitly known to be un-rewritten)
    //   (b) originalTitle IS NULL    (legacy rows from before originalTitle was tracked)
    // Most recent first — those are the most visible and the highest DMCA risk.
    const articles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        originalTitle: newsArticles.originalTitle,
        summary: newsArticles.summary,
        content: newsArticles.content,
      })
      .from(newsArticles)
      .where(
        or(
          sql`${newsArticles.title} = ${newsArticles.originalTitle}`,
          isNull(newsArticles.originalTitle)
        )
      )
      .orderBy(sql`${newsArticles.publishedAt} DESC`)
      .limit(limit)
      .offset(offset);

    console.log(`[RewriteTitles] Found ${articles.length} candidates`);

    let rewritten = 0;
    let unchanged = 0;
    let failed = 0;
    const samples: Array<{ id: string; from: string; to: string }> = [];

    for (const article of articles) {
      try {
        const original = article.title;
        const context = article.summary || article.content || undefined;
        const newTitle = await rewriteHeadline(original, context || undefined);

        if (newTitle === original) {
          unchanged++;
          continue;
        }

        if (!dryRun) {
          // Preserve audit trail: only set originalTitle if it was null.
          // If it was already set (and equal to title), it's already correct.
          await db
            .update(newsArticles)
            .set({
              title: newTitle,
              originalTitle: article.originalTitle ?? original,
            })
            .where(eq(newsArticles.id, article.id));
        }

        rewritten++;
        if (samples.length < 10) {
          samples.push({ id: article.id, from: original, to: newTitle });
        }

        // Throttle: ~200ms gap = ~5 RPS, well under OpenAI gpt-4o-mini limits.
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        failed++;
        console.error(`[RewriteTitles] Failed ${article.id}:`, (error as Error).message);
      }
    }

    const duration = Date.now() - startTime;

    if (job) {
      await db
        .update(aggregationJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          itemsProcessed: rewritten,
          metadata: {
            rewritten,
            unchanged,
            failed,
            total: articles.length,
            duration_ms: duration,
            dry_run: dryRun,
            samples,
          },
        })
        .where(eq(aggregationJobs.id, job.id));
    }

    console.log(`[RewriteTitles] Done: ${rewritten} rewritten, ${unchanged} unchanged, ${failed} failed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      rewritten,
      unchanged,
      failed,
      total: articles.length,
      duration_ms: duration,
      dry_run: dryRun,
      samples,
    });
  } catch (error) {
    console.error('[RewriteTitles] Job failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
