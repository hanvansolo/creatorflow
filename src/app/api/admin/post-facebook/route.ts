// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { postToFacebook } from '@/lib/social/facebook';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '1');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

  const articles = await db
    .select({
      title: newsArticles.title,
      slug: newsArticles.slug,
      tags: newsArticles.tags,
      summary: newsArticles.summary,
    })
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt))
    .offset(offset)
    .limit(limit);

  const results = [];
  for (const article of articles) {
    const result = await postToFacebook(article.title, article.slug, article.summary || undefined, article.tags || []);
    results.push({ title: article.title.slice(0, 50), ...result });
    await new Promise(r => setTimeout(r, 2000));
  }

  return NextResponse.json({ posted: results.length, results });
}
