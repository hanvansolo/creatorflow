import { NextResponse } from 'next/server';
import { db, newsArticles } from '@/lib/db';
import { isNotNull, not, like, eq } from 'drizzle-orm';
import { downloadImage } from '@/lib/utils/image-downloader';

export const dynamic = 'force-dynamic';

// Protect with a simple API key
const API_KEY = process.env.ADMIN_API_KEY || 'dev-key';

export async function POST(request: Request) {
  try {
    // Check API key
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get articles with external image URLs (not local paths)
    const articles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        imageUrl: newsArticles.imageUrl,
      })
      .from(newsArticles)
      .where(
        isNotNull(newsArticles.imageUrl)
      )
      .limit(100);

    // Filter to only external URLs (not starting with /)
    const externalImages = articles.filter(
      (a) => a.imageUrl && !a.imageUrl.startsWith('/')
    );

    let downloaded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const article of externalImages) {
      if (!article.imageUrl) continue;

      const result = await downloadImage(article.imageUrl);

      if (result.success && result.localPath) {
        // Update the database with the local path
        await db
          .update(newsArticles)
          .set({ imageUrl: result.localPath })
          .where(eq(newsArticles.id, article.id));
        downloaded++;
      } else {
        failed++;
        errors.push(`${article.title.slice(0, 40)}: ${result.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: externalImages.length,
      downloaded,
      failed,
      errors: errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error('Image redownload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check how many articles have external vs local images
  const articles = await db
    .select({
      id: newsArticles.id,
      imageUrl: newsArticles.imageUrl,
    })
    .from(newsArticles)
    .where(isNotNull(newsArticles.imageUrl));

  const external = articles.filter((a) => a.imageUrl && !a.imageUrl.startsWith('/'));
  const local = articles.filter((a) => a.imageUrl && a.imageUrl.startsWith('/'));

  return NextResponse.json({
    total: articles.length,
    external: external.length,
    local: local.length,
    message: `${external.length} articles need image downloading`,
  });
}
