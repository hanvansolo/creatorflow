import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, gte, eq } from 'drizzle-orm';
import { weeklyRoundupEmail, type ArticleSummary } from '@/lib/email/templates';
import { sendToAllSubscribers } from '@/lib/email/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get top articles from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

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
      .where(gte(newsArticles.publishedAt, weekAgo))
      .orderBy(desc(newsArticles.voteScore), desc(newsArticles.publishedAt))
      .limit(10);

    if (articles.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No articles from last week' });
    }

    const summaries: ArticleSummary[] = articles.map(a => ({
      title: a.title,
      slug: a.slug,
      summary: a.summary?.slice(0, 150) || '',
      imageUrl: a.imageUrl || undefined,
      source: a.sourceName || 'Footy Feed',
      publishedAt: a.publishedAt?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) || '',
    }));

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const { subject, html } = weeklyRoundupEmail(summaries, weekLabel);
    const force = request.nextUrl.searchParams.get('force') === 'true';
    const result = await sendToAllSubscribers(subject, html, force ? undefined : { targetLocalHour: 10 });

    return NextResponse.json({ success: true, ...result, articles: articles.length });
  } catch (error) {
    console.error('Weekly email error:', error);
    return NextResponse.json({ error: 'Failed to send weekly roundup' }, { status: 500 });
  }
}
