import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, gte, eq } from 'drizzle-orm';
import { dailyRoundupEmail, type ArticleSummary } from '@/lib/email/templates';
import { sendToAllSubscribers } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get today's top articles (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const articles = await db
      .select({
        title: newsArticles.title,
        slug: newsArticles.slug,
        summary: newsArticles.summary,
        imageUrl: newsArticles.imageUrl,
        sourceName: newsSources.name,
        publishedAt: newsArticles.publishedAt,
      })
      .from(newsArticles)
      .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
      .where(gte(newsArticles.publishedAt, yesterday))
      .orderBy(desc(newsArticles.voteScore), desc(newsArticles.publishedAt))
      .limit(8);

    if (articles.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No articles from last 24h' });
    }

    const summaries: ArticleSummary[] = articles.map(a => ({
      title: a.title,
      slug: a.slug,
      summary: a.summary?.slice(0, 150) || '',
      imageUrl: a.imageUrl || undefined,
      source: a.sourceName || 'Footy Feed',
      publishedAt: a.publishedAt?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) || '',
    }));

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const { subject, html } = dailyRoundupEmail(summaries, today);
    // If ?force=true, skip timezone filtering (for manual "Run Now" triggers)
    const force = request.nextUrl.searchParams.get('force') === 'true';
    const result = await sendToAllSubscribers(subject, html, force ? undefined : { targetLocalHour: 8 });

    return NextResponse.json({ success: true, ...result, articles: articles.length });
  } catch (error) {
    console.error('Daily email error:', error);
    return NextResponse.json({ error: 'Failed to send daily roundup' }, { status: 500 });
  }
}
