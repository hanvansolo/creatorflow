// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles } from '@/lib/db';
import { desc, gte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function titleSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // dry=true (default) just shows what would be deleted, dry=false actually deletes
  const dryRun = request.nextUrl.searchParams.get('dry') !== 'false';

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      originalTitle: newsArticles.originalTitle,
      publishedAt: newsArticles.publishedAt,
    })
    .from(newsArticles)
    .where(gte(newsArticles.publishedAt, cutoff))
    .orderBy(desc(newsArticles.publishedAt));

  // Group by similar titles — keep the oldest in each group
  const kept = new Map<string, { id: string; title: string; normalized: string; publishedAt: Date }>();
  const toDelete: Array<{ id: string; title: string; similarTo: string }> = [];

  for (const article of articles) {
    const normalized = normalizeTitle(article.originalTitle || article.title);
    let foundSimilar = false;

    for (const [, existing] of kept) {
      if (titleSimilarity(normalized, existing.normalized) >= 0.6) {
        // This is a duplicate — mark for deletion (keep the older one)
        toDelete.push({
          id: article.id,
          title: article.title,
          similarTo: existing.title,
        });
        foundSimilar = true;
        break;
      }
    }

    if (!foundSimilar) {
      kept.set(article.id, { id: article.id, title: article.title, normalized, publishedAt: article.publishedAt });
    }
  }

  // Actually delete if not dry run
  let deleted = 0;
  if (!dryRun && toDelete.length > 0) {
    for (const dupe of toDelete) {
      await db.delete(newsArticles).where(sql`${newsArticles.id} = ${dupe.id}::uuid`);
      deleted++;
    }
  }

  return NextResponse.json({
    dryRun,
    totalArticles: articles.length,
    duplicatesFound: toDelete.length,
    deleted,
    kept: kept.size,
    duplicates: toDelete.slice(0, 50).map(d => ({
      id: d.id,
      title: d.title,
      similarTo: d.similarTo,
    })),
    instruction: dryRun ? 'Add &dry=false to actually delete' : 'Deletion complete',
  });
}
