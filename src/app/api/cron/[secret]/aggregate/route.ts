// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, newsSources, newsArticles, aggregationJobs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { parseMultipleFeeds, type RSSFeedConfig } from '@/lib/aggregation';
import { RSS_FEEDS } from '@/lib/constants/sources';
import { spinArticle } from '@/lib/api/article-spinner';
import { rateCredibility, rateCredibilityHeuristic } from '@/lib/api/credibility-rater';
import { generateNewsSlug } from '@/lib/utils';
import { downloadImage } from '@/lib/utils/image-downloader';
import { generateArticleImage } from '@/lib/api/image-generator';
import { pingNewUrls } from '@/lib/seo/ping';
import { postToAllPlatforms } from '@/lib/social/post';
import { runCronJob } from '@/lib/cron/run-job';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Secret token for cron authentication (use CRON_KEY env var)
const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

const ENABLE_SPINNING = process.env.ANTHROPIC_API_KEY ? true : false;
const ENABLE_IMAGE_DOWNLOAD = process.env.DOWNLOAD_IMAGES !== 'false';
const ENABLE_AI_IMAGES = process.env.OPENAI_API_KEY ? true : false;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    // Validate secret token
    if (secret !== CRON_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting news aggregation via cron...');
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
    const newArticleUrls: string[] = [];

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

        // Rate credibility
        let credibilityRating: string;
        if (ENABLE_SPINNING) {
          try {
            credibilityRating = await rateCredibility(
              article.title,
              article.content || article.summary || '',
              sourceSlug
            );
          } catch {
            credibilityRating = rateCredibilityHeuristic(
              article.title,
              article.content || article.summary || '',
              sourceSlug
            );
          }
        } else {
          credibilityRating = rateCredibilityHeuristic(
            article.title,
            article.content || article.summary || '',
            sourceSlug
          );
        }

        // Download image to persistent storage (Railway volume)
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
            originalTitle: article.title,
            slug: finalSlug,
            summary: finalSummary,
            content: finalContent,
            author: article.author,
            imageUrl: finalImageUrl,
            originalUrl: article.originalUrl,
            publishedAt: article.publishedAt,
            tags: article.tags,
            isBreaking: false,
            credibilityRating,
          }).returning({ id: newsArticles.id });
          insertedCount++;
          newArticleUrls.push(`https://footy-feed.com/news/${slug}`);

          // Generate AI image if article has no image
          let socialImageUrl = finalImageUrl;
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
                socialImageUrl = generatedImageUrl;
                console.log(`[ImageGen] Image generated successfully`);
              }
            } catch (imgError) {
              console.error('[ImageGen] Failed to generate image:', imgError);
            }
          }

          // Auto-post to social platforms with image (non-blocking)
          postToAllPlatforms(finalTitle, slug, finalSummary || undefined, article.tags || undefined, socialImageUrl || undefined)
            .catch(e => console.error('[SOCIAL] Post failed:', e));
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

    // Run fix-images to repair any broken image references after deployment
    console.log('Running fix-images job...');
    let fixImagesResult: { success: boolean; result: unknown } = { success: false, result: {} };
    try {
      fixImagesResult = await runCronJob('fix-images');
      console.log('Fix-images result:', fixImagesResult);
    } catch (error) {
      console.error('Fix-images failed:', error);
    }

    // Ping search engines with new article URLs
    let searchPing = null;
    if (newArticleUrls.length > 0) {
      try {
        searchPing = await pingNewUrls(newArticleUrls);
        console.log(`Pinged search engines with ${newArticleUrls.length} new URLs`);
      } catch (e) {
        console.error('Search engine ping failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      spun: spunCount,
      imagesDownloaded,
      imagesGenerated,
      fixImages: fixImagesResult.result,
      searchPing,
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
