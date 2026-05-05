// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, newsSources, newsArticles, articleSources, aggregationJobs } from '@/lib/db';
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
import { runCronJob } from '@/lib/cron/run-job';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Secret token for cron authentication (use CRON_KEY env var)
const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

const ENABLE_SPINNING = process.env.ANTHROPIC_API_KEY ? true : false;
const ENABLE_IMAGE_DOWNLOAD = process.env.DOWNLOAD_IMAGES !== 'false';
// Old gate (`OPENAI_API_KEY ? true : false`) was always-on because the
// key is always set. Now requires explicit ENABLE_AI_IMAGES=true so we
// don't quietly burn ~$0.08 per article on broken F1-themed prompts.
const ENABLE_AI_IMAGES = process.env.ENABLE_AI_IMAGES === 'true';

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

    // Load recent article titles from DB for similarity clustering (last 48h).
    // We use this to detect "same story covered by a different source" so we
    // can attach the new source to the existing primary article instead of
    // creating another near-duplicate that would need its own AI spin.
    const recentCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentArticles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        originalTitle: newsArticles.originalTitle,
      })
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

    // (articleId, normalizedTitle) pairs — populated from recent DB rows and
    // any new primaries we insert in this batch. Keyed by article.id so we
    // can return the primary's id when a match is found.
    const indexedTitles: Array<{ id: string; norm: string }> = [];
    for (const row of recentArticles) {
      if (row.title) indexedTitles.push({ id: row.id, norm: normalizeTitle(row.title) });
      if (row.originalTitle) indexedTitles.push({ id: row.id, norm: normalizeTitle(row.originalTitle) });
    }

    /**
     * Returns the id of an existing primary article whose title is close
     * enough to `title` that they're covering the same story, or null if
     * this is a fresh story that should become its own primary.
     */
    function findPrimary(title: string): string | null {
      const normalized = normalizeTitle(title);
      for (const row of indexedTitles) {
        if (titleSimilarity(normalized, row.norm) >= 0.45) return row.id;
      }
      return null;
    }

    // Insert articles into database
    let insertedCount = 0;
    let skippedCount = 0;
    let clusteredCount = 0;   // attached to an existing primary — no spin, no duplicate row
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

        // If this story is already covered by a primary in our DB, attach
        // the new source to that primary instead of creating a duplicate.
        // No spin call, no duplicate row — just a record that BBC / Sky /
        // whoever else covered the same thing, rendered at the bottom of
        // the primary's page as "More coverage".
        const primaryId = findPrimary(article.title);
        if (primaryId) {
          try {
            const [feedSource] = await db
              .select({ name: newsSources.name })
              .from(newsSources)
              .where(eq(newsSources.id, sourceId))
              .limit(1);
            await db.insert(articleSources).values({
              articleId: primaryId,
              sourceId,
              sourceName: feedSource?.name || sourceSlug,
              originalUrl: article.originalUrl,
              originalTitle: article.title,
              publishedAt: article.publishedAt,
            }).onConflictDoNothing();
            clusteredCount++;
            console.log(`[Aggregate] Clustered "${article.title?.slice(0, 60)}..." into primary ${primaryId.slice(0, 8)}`);
          } catch (e) {
            console.error('[Aggregate] Failed to record source:', e);
          }
          continue;
        }

        // New story — we'll add it to the in-batch index right after the
        // insert below so later items in this run can cluster into it.

        // Cheap pre-filter: if the heuristic credibility rater already says
        // "clickbait" or "opinion", there's no point paying for the AI spin.
        // These pieces rarely convert for AdSense and are the easiest to
        // identify from title alone.
        const preRating = rateCredibilityHeuristic(
          article.title,
          article.content || article.summary || '',
          sourceSlug,
        );
        const spinSkippedLowValue = preRating === 'clickbait' || preRating === 'opinion';
        if (spinSkippedLowValue) {
          console.log(`[Aggregate] Skipping spin (low-value ${preRating}): "${article.title?.slice(0, 60)}..."`);
        }

        // Spin the article content if enabled
        const MAX_SPINS_PER_RUN = 20;
        let finalTitle = article.title;
        let finalSummary = article.summary;
        let finalContent = article.content;
        let spinSucceeded = false;           // true → set spun_at on insert (never retried)
        let spinAttempted = false;           // true → spin_attempts starts at 1 (respin gated)

        if (ENABLE_SPINNING && !spinSkippedLowValue && (article.content || article.summary) && spunCount < MAX_SPINS_PER_RUN) {
          spinAttempted = true;
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
            spinSucceeded = true;

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

        // Insert article. Coerce tags to a plain string[] because some RSS
        // feeds deliver tags as objects (e.g. { _: 'Transfer', $: { domain: 'x' } }),
        // which crashes postgres-js serialisation with "Cannot convert object
        // to primitive value" when it tries to Array.join internally.
        const safeTags: string[] = Array.isArray(article.tags)
          ? article.tags
              .map((t: unknown) => {
                if (typeof t === 'string') return t;
                if (t && typeof t === 'object') {
                  const obj = t as Record<string, unknown>;
                  // rss-parser sometimes returns { _: 'label', $: {...} }
                  if (typeof obj._ === 'string') return obj._;
                  if (typeof obj.name === 'string') return obj.name;
                  if (typeof obj.term === 'string') return obj.term;
                }
                return '';
              })
              .filter((s) => s.length > 0 && s.length < 100)
          : [];

        try {
          const assignedAuthor = pickAuthor(finalTitle, safeTags, credibilityRating);
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
            tags: safeTags,
            isBreaking: false,
            credibilityRating,
            // Spin tracking: success → spun_at set, no retry. Attempt (success
            // or fail) → attempts=1 so respin only tries N-1 more times.
            spunAt: spinSucceeded ? new Date() : null,
            spinAttempts: spinAttempted ? 1 : 0,
          }).returning({ id: newsArticles.id });
          insertedCount++;
          newArticleUrls.push(`https://www.footy-feed.com/news/${slug}`);

          // Add to in-batch index so any later RSS items in this run that
          // cover the same story cluster into this article rather than
          // creating yet another duplicate.
          if (insertedArticle?.id) {
            indexedTitles.push({ id: insertedArticle.id, norm: normalizeTitle(article.title) });
            if (finalTitle && finalTitle !== article.title) {
              indexedTitles.push({ id: insertedArticle.id, norm: normalizeTitle(finalTitle) });
            }
          }

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

          // Social posting is decoupled: the social-post cron picks up
          // unposted articles every 30 minutes with hourly-cap throttling
          // to prevent the Facebook algorithm from flagging us as spammy.
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
      clustered: clusteredCount,
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
