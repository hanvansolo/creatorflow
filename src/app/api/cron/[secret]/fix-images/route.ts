import { NextRequest, NextResponse } from 'next/server';
import { db, newsArticles } from '@/lib/db';
import { like, or, eq, desc, isNull } from 'drizzle-orm';
import { downloadImage } from '@/lib/utils/image-downloader';
import { scrapeArticleImage } from '@/lib/utils/scrape-article-image';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

// Storage path - Railway volume or local fallback
const STORAGE_PATH = process.env.IMAGE_STORAGE_PATH || 'public/images/articles';

function getStorageDir(): string {
  if (process.env.IMAGE_STORAGE_PATH) {
    return process.env.IMAGE_STORAGE_PATH;
  }
  return path.join(process.cwd(), STORAGE_PATH);
}

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (secret !== CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');

  console.log('[FixImages] Starting broken image check...');
  const storageDir = getStorageDir();

  // Get articles that need images: either broken local paths or NULL image URLs
  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      imageUrl: newsArticles.imageUrl,
      originalUrl: newsArticles.originalUrl,
    })
    .from(newsArticles)
    .where(
      or(
        like(newsArticles.imageUrl, '/api/images/%'),
        like(newsArticles.imageUrl, '/images/articles/%'),
        isNull(newsArticles.imageUrl)
      )
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);

  let checked = 0;
  let alreadyOk = 0;
  let fixed = 0;
  let cleared = 0;

  for (const article of articles) {
    checked++;

    // If article has an existing local image path, check if file exists AND is large enough
    if (article.imageUrl) {
      const filename = article.imageUrl.split('/').pop();
      if (filename) {
        const filepath = path.join(storageDir, filename);
        if (await fileExists(filepath)) {
          // Check file size — X/Twitter requires minimum 300x157px
          // Images under 15KB are likely tiny thumbnails (240x135 = ~8-12KB)
          try {
            const fstats = await fs.stat(filepath);
            console.log(`[FixImages] File ${filename}: ${fstats.size} bytes at ${filepath}`);
            if (fstats.size < 15000) {
              // Tiny image — re-scrape og:image from source
              console.log(`[FixImages] Tiny image (${fstats.size}b): ${article.title.slice(0, 40)}... - re-scraping`);
              if (article.originalUrl) {
                const scrapedUrl = await scrapeArticleImage(article.originalUrl);
                if (scrapedUrl) {
                  const downloadResult = await downloadImage(scrapedUrl);
                  if (downloadResult.success && downloadResult.localPath) {
                    await db
                      .update(newsArticles)
                      .set({ imageUrl: downloadResult.localPath })
                      .where(eq(newsArticles.id, article.id));
                    fixed++;
                    console.log(`[FixImages] Upgraded tiny → ${downloadResult.localPath} (${fstats.size}b → full size)`);
                    continue;
                  }
                }
              }
            }
          } catch (statErr) { console.log(`[FixImages] stat failed for ${filepath}:`, (statErr as Error).message); }
          alreadyOk++;
          continue;
        }
      }
    }

    // Image missing or null — try to scrape and download from original article
    if (article.originalUrl) {
      console.log(`[FixImages] Missing: ${article.title.slice(0, 40)}... - trying to re-scrape`);
      const scrapedUrl = await scrapeArticleImage(article.originalUrl);
      if (scrapedUrl) {
        const downloadResult = await downloadImage(scrapedUrl);
        if (downloadResult.success && downloadResult.localPath) {
          await db
            .update(newsArticles)
            .set({ imageUrl: downloadResult.localPath })
            .where(eq(newsArticles.id, article.id));
          fixed++;
          console.log(`[FixImages] Fixed: ${downloadResult.localPath}`);
          continue;
        }
      }
    }

    // Couldn't fix - clear the URL so generate-images can regenerate it
    await db
      .update(newsArticles)
      .set({ imageUrl: null })
      .where(eq(newsArticles.id, article.id));
    cleared++;
    console.log(`[FixImages] Cleared broken: ${article.title.slice(0, 40)}...`);

    // Small delay
    await new Promise(r => setTimeout(r, 300));
  }

  // Also check for articles without any images (run generate-images logic)
  const noImageCount = await db
    .select({ id: newsArticles.id })
    .from(newsArticles)
    .where(isNull(newsArticles.imageUrl))
    .limit(1);

  const needsGeneration = noImageCount.length > 0;

  const result = {
    success: true,
    checked,
    alreadyOk,
    fixed,
    cleared,
    needsGeneration,
    message: `Checked ${checked} images: ${alreadyOk} OK, ${fixed} re-scraped, ${cleared} cleared for regeneration`,
  };

  console.log(`[FixImages] ${result.message}`);
  return NextResponse.json(result);
}
