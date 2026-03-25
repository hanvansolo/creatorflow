import { NextResponse } from 'next/server';
import { db, newsSources, newsArticles, aggregationJobs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { parseMultipleFeeds, type RSSFeedConfig } from '@/lib/aggregation';
import { RSS_FEEDS } from '@/lib/constants/sources';
import { spinArticle } from '@/lib/api/article-spinner';
import { generateNewsSlug } from '@/lib/utils';
import { downloadImage } from '@/lib/utils/image-downloader';
import { generateArticleImage } from '@/lib/api/image-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Protect with API key
const API_KEY = process.env.ADMIN_API_KEY || 'dev-key';

const ENABLE_SPINNING = process.env.ANTHROPIC_API_KEY ? true : false;
const ENABLE_IMAGE_DOWNLOAD = process.env.DOWNLOAD_IMAGES !== 'false';
const ENABLE_AI_IMAGES = process.env.OPENAI_API_KEY ? true : false;

export async function POST(request: Request) {
  try {
    // Check API key
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting news aggregation via API...');
    console.log(`Article spinning: ${ENABLE_SPINNING ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Image downloading: ${ENABLE_IMAGE_DOWNLOAD ? 'ENABLED' : 'DISABLED'}`);
    console.log(`AI image generation: ${ENABLE_AI_IMAGES ? 'ENABLED' : 'DISABLED'}`);
    const startTime = Date.now();

    // Log job start
    const [job] = await db.insert(aggregationJobs).values({
      jobType: 'news_aggregation',
      status: 'running',
    }).returning();

    // Get or create news sources in database
    const sourceMap = new Map<string, string>();

    for (const feed of RSS_FEEDS) {
      const [existingSource] = await db
        .select({ id: newsSources.id })
        .from(newsSources)
        .where(eq(newsSources.slug, feed.slug))
        .limit(1);

      if (existingSource) {
        sourceMap.set(feed.slug, existingSource.id);
      } else {
        const [newSource] = await db.insert(newsSources).values({
          name: feed.name,
          slug: feed.slug,
          type: 'rss',
          url: feed.websiteUrl,
          feedUrl: feed.feedUrl,
          logoUrl: feed.logoUrl,
          priority: feed.priority,
          isActive: true,
        }).returning();

        if (newSource) {
          sourceMap.set(feed.slug, newSource.id);
        }
      }
    }

    // Parse all feeds
    const feedConfigs: RSSFeedConfig[] = RSS_FEEDS.map((f) => ({
      name: f.name,
      slug: f.slug,
      feedUrl: f.feedUrl,
      websiteUrl: f.websiteUrl,
      priority: f.priority,
    }));

    console.log(`Parsing ${feedConfigs.length} feeds...`);
    const articlesBySource = await parseMultipleFeeds(feedConfigs);

    // Insert articles into database
    let insertedCount = 0;
    let skippedCount = 0;
    let spunCount = 0;
    let imagesDownloaded = 0;
    let imagesGenerated = 0;

    for (const [sourceSlug, articles] of articlesBySource) {
      const sourceId = sourceMap.get(sourceSlug);
      if (!sourceId) continue;

      for (const article of articles) {
        // Check if article already exists
        const [existing] = await db
          .select({ id: newsArticles.id })
          .from(newsArticles)
          .where(
            and(
              eq(newsArticles.sourceId, sourceId),
              eq(newsArticles.externalId, article.externalId)
            )
          )
          .limit(1);

        if (existing) {
          skippedCount++;
          continue;
        }

        // Spin the article content if enabled
        let finalTitle = article.title;
        let finalSummary = article.summary;
        let finalContent = article.content;

        if (ENABLE_SPINNING && (article.content || article.summary)) {
          try {
            const spun = await spinArticle(
              article.title,
              article.content || '',
              article.summary
            );
            finalTitle = spun.title;
            finalSummary = spun.summary;
            finalContent = spun.content;
            spunCount++;
          } catch (error) {
            console.error('Spinning failed, using original:', error);
          }
        }

        // Download image if enabled
        let finalImageUrl = article.imageUrl;
        if (ENABLE_IMAGE_DOWNLOAD && article.imageUrl) {
          try {
            const result = await downloadImage(article.imageUrl);
            if (result.success && result.localPath) {
              finalImageUrl = result.localPath;
              imagesDownloaded++;
            }
          } catch (error) {
            console.error('Image download error:', error);
          }
        }

        // Generate slug
        const slug = generateNewsSlug(finalTitle, article.publishedAt);
        let finalSlug = slug;
        const [slugExists] = await db
          .select({ id: newsArticles.id })
          .from(newsArticles)
          .where(eq(newsArticles.slug, slug))
          .limit(1);

        if (slugExists) {
          finalSlug = `${slug}-${Date.now()}`;
        }

        // Insert article
        try {
          const [insertedArticle] = await db.insert(newsArticles).values({
            sourceId,
            externalId: article.externalId,
            title: finalTitle,
            slug: finalSlug,
            summary: finalSummary,
            content: finalContent,
            author: article.author,
            imageUrl: finalImageUrl,
            originalUrl: article.originalUrl,
            publishedAt: article.publishedAt,
            tags: article.tags,
            isBreaking: false,
          }).returning({ id: newsArticles.id });
          insertedCount++;

          // Generate AI image if article has no image
          if (ENABLE_AI_IMAGES && !finalImageUrl && insertedArticle) {
            try {
              console.log(`[ImageGen] Generating image for: ${finalTitle.slice(0, 50)}...`);
              const generatedImageUrl = await generateArticleImage(finalTitle, finalSummary || undefined);
              if (generatedImageUrl) {
                await db
                  .update(newsArticles)
                  .set({ imageUrl: generatedImageUrl })
                  .where(eq(newsArticles.id, insertedArticle.id));
                imagesGenerated++;
                console.log(`[ImageGen] Image generated successfully`);
              }
            } catch (imgError) {
              console.error('[ImageGen] Failed to generate image:', imgError);
            }
          }
        } catch (error) {
          console.error('Failed to insert article:', error);
        }
      }
    }

    const duration = Date.now() - startTime;

    // Update job status
    if (job) {
      await db
        .update(aggregationJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          itemsProcessed: insertedCount,
          metadata: {
            skipped: skippedCount,
            spun: spunCount,
            imagesDownloaded,
            imagesGenerated,
            duration_ms: duration,
          },
        })
        .where(eq(aggregationJobs.id, job.id));
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      spun: spunCount,
      imagesDownloaded,
      imagesGenerated,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Aggregation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with Authorization: Bearer <ADMIN_API_KEY> to trigger aggregation',
  });
}
