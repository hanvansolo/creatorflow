// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, newsSources, newsArticles, aggregationJobs } from '@/lib/db';
import { eq, and, gte } from 'drizzle-orm';
import { parseMultipleFeeds, type RSSFeedConfig } from '@/lib/aggregation';
import { RSS_FEEDS } from '@/lib/constants/sources';
import { spinArticle } from '@/lib/api/article-spinner';
import { rateCredibility, rateCredibilityHeuristic } from '@/lib/api/credibility-rater';
import { generateNewsSlug } from '@/lib/utils';
import { downloadImage } from '@/lib/utils/image-downloader';
import { generateArticleImage } from '@/lib/api/image-generator';
import { pickAuthor } from '@/lib/constants/authors';
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

    // Load recent article titles from DB for similarity dedup (last 48h)
    const recentCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentTitles = await db
      .select({ title: newsArticles.title, originalTitle: newsArticles.originalTitle })
      .from(newsArticles)
      .where(gte(newsArticles.publishedAt, recentCutoff));

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
    // Build normalized title set from DB + current batch
    const knownTitles = new Set<string>();
    for (const row of recentTitles) {
      knownTitles.add(normalizeTitle(row.title));
      if (row.originalTitle) knownTitles.add(normalizeTitle(row.originalTitle));
    }

    function isSimilarToKnown(title: string): boolean {
      const normalized = normalizeTitle(title);
      for (const known of knownTitles) {
        if (titleSimilarity(normalized, known) >= 0.65) return true;
      }
      return false;
    }

    // Insert articles into database
    let insertedCount = 0;
    let skippedCount = 0;
    let dedupedCount = 0;
    let spunCount = 0;
    let imagesDownloaded = 0;
    let imagesGenerated = 0;
    const newArticleUrls: string[] = [];

    for (const [sourceSlug, articles] of articlesBySource) {
      const sourceId = sourceMap.get(sourceSlug);
      if (!sourceId) continue;

      for (const article of articles) {
        // Filter out non-football content (cricket, rugby, NFL, etc.)
        const titleLower = (article.title || '').toLowerCase();
        const contentLower = (article.content || article.summary || '').toLowerCase().slice(0, 500);
        const combined = titleLower + ' ' + contentLower;
        const nonFootballKeywords = [
          'cricket', 'ipl', 'test match', 'ashes', 'wicket', 'batsman', 'bowler', 'twenty20', 't20',
          'rugby', 'rugby league', 'super league', 'six nations', 'all blacks', 'springboks', 'scrum', 'try scorer',
          'hull kr', 'hull kingston', 'st helens', 'wigan warriors', 'warrington wolves', 'catalans dragons',
          'salford red devils', 'leigh leopards', 'castleford tigers', 'huddersfield giants',
          'nfl', 'super bowl', 'quarterback', 'touchdown', 'nba', 'baseball', 'mlb',
          'tennis', 'wimbledon', 'grand slam', 'roland garros',
          'golf', 'pga', 'masters tournament', 'ryder cup',
          'formula 1', 'f1', 'grand prix', 'motorsport', 'moto gp',
          'boxing', 'ufc', 'mma', 'heavyweight bout',
          'cycling', 'tour de france',
          'horse racing', 'cheltenham', 'grand national',
          'olympics', 'olympic games',
          'nhl', 'ice hockey', 'stanley cup',
        ];
        const isNonFootball = nonFootballKeywords.some(kw => combined.includes(kw));
        if (isNonFootball) {
          console.log(`[Aggregate] Skipped non-football: "${article.title?.slice(0, 60)}..."`);
          skippedCount++;
          continue;
        }

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

        // Title similarity dedup — catch "same story, different ID" from same or different sources
        if (isSimilarToKnown(article.title)) {
          console.log(`[Aggregate] Skipped similar: "${article.title?.slice(0, 60)}..."`);
          dedupedCount++;
          skippedCount++;
          continue;
        }
        // Add this title to known set so later articles in this batch also get deduped
        knownTitles.add(normalizeTitle(article.title));

        // Spin the article content if enabled
        const MAX_SPINS_PER_RUN = 20;
        let finalTitle = article.title;
        let finalSummary = article.summary;
        let finalContent = article.content;

        if (ENABLE_SPINNING && (article.content || article.summary) && spunCount < MAX_SPINS_PER_RUN) {
          try {
            // Scrape the full article text from the source URL
            // RSS only gives us 1-2 sentence excerpts — we need the real article
            let fullText = article.content || article.summary || '';
            if (article.originalUrl && fullText.length < 500) {
              try {
                const scrapeRes = await fetch(article.originalUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html',
                  },
                  signal: AbortSignal.timeout(10000),
                  redirect: 'follow',
                });
                if (scrapeRes.ok) {
                  const html = await scrapeRes.text();
                  // Extract article body text — strip HTML tags, scripts, styles
                  const cleaned = html
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
                    .replace(/<header[\s\S]*?<\/header>/gi, '')
                    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
                    .replace(/<aside[\s\S]*?<\/aside>/gi, '');
                  // Try to find article content via common patterns
                  const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i)
                    || cleaned.match(/<div[^>]+class="[^"]*article[^"]*"[\s\S]*?<\/div>/i)
                    || cleaned.match(/<div[^>]+class="[^"]*content[^"]*"[\s\S]*?<\/div>/i)
                    || cleaned.match(/<div[^>]+class="[^"]*story[^"]*"[\s\S]*?<\/div>/i);
                  const articleHtml = articleMatch ? articleMatch[0] : cleaned;
                  // Strip remaining HTML tags
                  const plainText = articleHtml
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\s+/g, ' ')
                    .trim();
                  // Only use if we got meaningful text (> 200 chars)
                  if (plainText.length > 200) {
                    // Cap at 5000 chars to avoid huge prompts
                    fullText = plainText.slice(0, 5000);
                    console.log(`[Spinner] Scraped ${plainText.length} chars from ${article.originalUrl?.slice(0, 50)}`);
                  }
                }
              } catch (scrapeErr) {
                console.warn(`[Spinner] Failed to scrape source:`, (scrapeErr as Error).message);
              }
            }

            // Only spin if we have enough source material (300+ chars)
            // Otherwise we'd just be padding a 1-sentence RSS excerpt with AI fluff
            if (fullText.length < 300) {
              console.log(`[Spinner] Skipping spin — only ${fullText.length} chars available for: ${article.title?.slice(0, 50)}`);
              // Don't spin — use original content as-is
            } else {

            const spun = await spinArticle(
              article.title,
              fullText,
              article.summary
            );
            finalTitle = spun.title;
            finalSummary = spun.summary;
            finalContent = spun.content;
            spunCount++;

            } // end of else (enough source material)
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

        // Download image — prefer og:image from source (full-size, 1200x630)
        // RSS thumbnails are often tiny (240x135) and rejected by X/Twitter cards
        let finalImageUrl = article.imageUrl;
        if (ENABLE_IMAGE_DOWNLOAD) {
          try {
            // 1. Try scraping og:image from original article page (always full-size)
            let imageToDownload: string | null = null;
            if (article.originalUrl) {
              const { scrapeArticleImage } = await import('@/lib/utils/scrape-article-image');
              const ogImage = await scrapeArticleImage(article.originalUrl);
              if (ogImage) {
                imageToDownload = ogImage;
              }
            }
            // 2. Fall back to RSS thumbnail if og:image scrape failed
            if (!imageToDownload && article.imageUrl) {
              imageToDownload = article.imageUrl;
            }
            // 3. Download whichever we found
            if (imageToDownload) {
              const result = await downloadImage(imageToDownload);
              if (result.success && result.localPath) {
                finalImageUrl = result.localPath;
                imagesDownloaded++;
              }
            }
          } catch (error) {
            console.error('Image download error:', error);
          }
        }

        // Skip thin articles — Google News penalises pages with no real content.
        // 150 words ≈ 900 chars is the minimum for a meaningful article.
        const wordCount = (finalContent || finalSummary || '').split(/\s+/).length;
        if (wordCount < 50) {
          console.log(`[Aggregate] Skipping thin article (${wordCount} words): ${finalTitle?.slice(0, 60)}`);
          continue;
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
          const assignedAuthor = pickAuthor(finalTitle, article.tags, credibilityRating);
          const [insertedArticle] = await db.insert(newsArticles).values({
            sourceId,
            externalId: article.externalId,
            title: finalTitle,
            originalTitle: article.title,
            slug: finalSlug,
            summary: finalSummary,
            content: finalContent,
            author: assignedAuthor.name,
            imageUrl: finalImageUrl,
            originalUrl: article.originalUrl,
            publishedAt: article.publishedAt,
            tags: article.tags,
            isBreaking: false,
            credibilityRating,
          }).returning({ id: newsArticles.id });
          insertedCount++;
          newArticleUrls.push(`https://www.footy-feed.com/news/${slug}`);

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
      deduped: dedupedCount,
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
