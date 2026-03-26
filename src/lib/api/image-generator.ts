// @ts-nocheck
import OpenAI from 'openai';
import { db, newsArticles } from '@/lib/db';
import { eq, isNull, desc } from 'drizzle-orm';
import { downloadImage } from '@/lib/utils/image-downloader';
import { scrapeArticleImage } from '@/lib/utils/scrape-article-image';

// Initialize OpenAI client lazily
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

// Extract key subject from article title for image prompt
// Returns both the subject and whether it's driver-focused (to avoid faces)
function extractSubject(title: string): { subject: string; isDriver: boolean; teamColor?: string } {
  const lowerTitle = title.toLowerCase();

  // Driver names with their team colors for visual consistency
  const drivers: Record<string, { name: string; team: string; color: string }> = {
    'verstappen': { name: 'Max Verstappen', team: 'Red Bull', color: 'dark blue and red' },
    'hamilton': { name: 'Lewis Hamilton', team: 'Ferrari', color: 'scarlet red' },
    'leclerc': { name: 'Charles Leclerc', team: 'Ferrari', color: 'scarlet red' },
    'norris': { name: 'Lando Norris', team: 'McLaren', color: 'papaya orange' },
    'piastri': { name: 'Oscar Piastri', team: 'McLaren', color: 'papaya orange' },
    'sainz': { name: 'Carlos Sainz', team: 'Williams', color: 'blue and white' },
    'russell': { name: 'George Russell', team: 'Mercedes', color: 'silver and teal' },
    'alonso': { name: 'Fernando Alonso', team: 'Aston Martin', color: 'british racing green' },
    'stroll': { name: 'Lance Stroll', team: 'Aston Martin', color: 'british racing green' },
    'gasly': { name: 'Pierre Gasly', team: 'Alpine', color: 'blue and pink' },
    'ocon': { name: 'Esteban Ocon', team: 'Haas', color: 'white and red' },
    'albon': { name: 'Alex Albon', team: 'Williams', color: 'blue and white' },
    'perez': { name: 'Sergio Perez', team: 'Red Bull', color: 'dark blue and red' },
    'bottas': { name: 'Valtteri Bottas', team: 'Sauber', color: 'green and black' },
    'hulkenberg': { name: 'Nico Hulkenberg', team: 'Sauber', color: 'green and black' },
    'magnussen': { name: 'Kevin Magnussen', team: 'Haas', color: 'white and red' },
    'tsunoda': { name: 'Yuki Tsunoda', team: 'Red Bull Racing', color: 'dark blue and red' },
    'lawson': { name: 'Liam Lawson', team: 'Red Bull Racing', color: 'dark blue and red' },
    'bearman': { name: 'Oliver Bearman', team: 'Haas', color: 'white and red' },
    'antonelli': { name: 'Kimi Antonelli', team: 'Mercedes', color: 'silver and teal' },
    'colapinto': { name: 'Franco Colapinto', team: 'Alpine', color: 'blue and pink' },
  };

  // Team names with their livery colors
  const teams: Record<string, { name: string; color: string }> = {
    'red bull': { name: 'Red Bull Racing', color: 'dark blue and red' },
    'ferrari': { name: 'Scuderia Ferrari', color: 'scarlet red' },
    'mercedes': { name: 'Mercedes-AMG', color: 'silver and teal' },
    'mclaren': { name: 'McLaren', color: 'papaya orange and blue' },
    'aston martin': { name: 'Aston Martin', color: 'british racing green' },
    'alpine': { name: 'Alpine', color: 'blue and pink' },
    'williams': { name: 'Williams Racing', color: 'blue and white' },
    'haas': { name: 'Haas F1', color: 'white and red' },
    'sauber': { name: 'Stake F1 Team Kick Sauber', color: 'green and black' },
    'audi': { name: 'Audi F1', color: 'black and red' },
  };

  // Check for drivers - return car-focused subject with team colors
  for (const [key, info] of Object.entries(drivers)) {
    if (lowerTitle.includes(key)) {
      return {
        subject: `${info.team} football player in ${info.color} kit`,
        isDriver: true,
        teamColor: info.color
      };
    }
  }

  // Check for teams
  for (const [key, info] of Object.entries(teams)) {
    if (lowerTitle.includes(key)) {
      return {
        subject: `${info.name} football player in ${info.color} kit`,
        isDriver: false,
        teamColor: info.color
      };
    }
  }

  // Default to generic football
  return { subject: 'modern football match action shot', isDriver: false };
}

// Generate a football-themed image for an article
export async function generateArticleImage(title: string, summary?: string): Promise<string | null> {
  try {
    const openai = getOpenAIClient();
    const { subject, isDriver, teamColor } = extractSubject(title);

    // Create a prompt that focuses on cars and action - NEVER human faces
    // DALL-E struggles with photorealistic faces, creating uncanny results
    const prompt = `Stunning motorsport photography: ${subject} racing on track.
Dynamic action shot from trackside perspective, motion blur on wheels.
${teamColor ? `Dominant ${teamColor} color scheme.` : ''}
Wide angle view showing the full car, no close-ups of people, no visible faces.
Professional sports photography lighting, golden hour or dramatic overcast.
Sharp focus on the car, blurred grandstands in background.
Modern football stadium atmosphere with floodlights visible.
Clean composition, no text, no watermarks, no logos.`;

    console.log('[ImageGen] Generating image for:', title);
    console.log('[ImageGen] Subject:', subject, isDriver ? '(driver article - car focus)' : '');

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024', // Wide format for article headers
      quality: 'standard',
    });

    const tempImageUrl = response.data?.[0]?.url;
    if (!tempImageUrl) {
      console.error('[ImageGen] No image URL in response');
      return null;
    }

    console.log('[ImageGen] Generated image, downloading to permanent storage...');

    // Download the image to permanent storage (DALL-E URLs expire after ~1 hour)
    const downloadResult = await downloadImage(tempImageUrl);
    if (!downloadResult.success || !downloadResult.localPath) {
      console.error('[ImageGen] Failed to download generated image:', downloadResult.error);
      return null;
    }

    console.log('[ImageGen] Image saved to:', downloadResult.localPath);
    return downloadResult.localPath;
  } catch (error) {
    console.error('[ImageGen] Failed to generate image:', error);
    return null;
  }
}

// Find articles without images - try scraping first, AI generation as LAST RESORT
export async function generateMissingImages(limit: number = 5): Promise<{ success: number; failed: number; scraped: number; aiGenerated: number }> {
  console.log('[ImageGen] Finding articles without images...');

  // Get articles without images, newest first
  const articlesWithoutImages = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      summary: newsArticles.summary,
      originalUrl: newsArticles.originalUrl,
    })
    .from(newsArticles)
    .where(isNull(newsArticles.imageUrl))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);

  console.log(`[ImageGen] Found ${articlesWithoutImages.length} articles without images`);

  let success = 0;
  let failed = 0;
  let scraped = 0;
  let aiGenerated = 0;

  for (const article of articlesWithoutImages) {
    try {
      let imageUrl: string | null = null;

      // STEP 1: Try to scrape the original article page for an image
      if (article.originalUrl) {
        console.log(`[ImageGen] Trying to scrape: ${article.title.slice(0, 50)}...`);
        const scrapedUrl = await scrapeArticleImage(article.originalUrl);

        if (scrapedUrl) {
          // Try to download the scraped image - ONLY use if download succeeds
          const downloadResult = await downloadImage(scrapedUrl);
          if (downloadResult.success && downloadResult.localPath) {
            imageUrl = downloadResult.localPath;
            scraped++;
            console.log(`[ImageGen] Scraped image: ${imageUrl}`);
          } else {
            // Download failed - don't use external URL (causes broken images)
            // Will fall through to AI generation as last resort
            console.log(`[ImageGen] Download failed for: ${scrapedUrl.slice(0, 60)}... (will try AI)`);
          }
        }
      }

      // STEP 2: ONLY if scraping failed, use AI generation as LAST RESORT
      if (!imageUrl) {
        console.log(`[ImageGen] No scraped image found, generating AI image for: ${article.title.slice(0, 50)}...`);
        imageUrl = await generateArticleImage(article.title, article.summary || undefined);
        if (imageUrl) {
          aiGenerated++;
        }
      }

      if (imageUrl) {
        // Update article with the image
        await db
          .update(newsArticles)
          .set({ imageUrl })
          .where(eq(newsArticles.id, article.id));

        console.log(`[ImageGen] Updated article: ${article.title.slice(0, 50)}...`);
        success++;
      } else {
        failed++;
      }

      // Small delay between articles to be polite
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`[ImageGen] Error processing article ${article.id}:`, error);
      failed++;
    }
  }

  console.log(`[ImageGen] Summary: ${scraped} scraped, ${aiGenerated} AI-generated, ${failed} failed`);
  return { success, failed, scraped, aiGenerated };
}

// Replace AI-generated images with scraped real images where possible
export async function regenerateAiImages(limit: number = 5): Promise<{ success: number; failed: number; skipped: number; scraped: number }> {
  console.log('[ImageGen] Finding AI-generated images to replace with real ones...');

  // Find articles with locally stored images (AI-generated)
  const { like, or } = await import('drizzle-orm');

  const articlesWithAiImages = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      imageUrl: newsArticles.imageUrl,
      originalUrl: newsArticles.originalUrl,
    })
    .from(newsArticles)
    .where(
      or(
        like(newsArticles.imageUrl, '/images/articles/%'),
        like(newsArticles.imageUrl, '/api/images/%')
      )
    )
    .limit(limit);

  console.log(`[ImageGen] Found ${articlesWithAiImages.length} articles with AI-generated images`);

  let success = 0;
  let failed = 0;
  let skipped = 0;
  let scraped = 0;

  for (const article of articlesWithAiImages) {
    try {
      console.log(`[ImageGen] Processing: ${article.title.slice(0, 50)}...`);
      let newImageUrl: string | null = null;

      // STEP 1: Try to scrape a REAL image from the article
      if (article.originalUrl) {
        const scrapedUrl = await scrapeArticleImage(article.originalUrl);
        if (scrapedUrl) {
          const downloadResult = await downloadImage(scrapedUrl);
          if (downloadResult.success && downloadResult.localPath) {
            newImageUrl = downloadResult.localPath;
            scraped++;
            console.log(`[ImageGen] Replaced with scraped: ${newImageUrl}`);
          } else {
            // Download failed - don't use external URL
            console.log(`[ImageGen] Download failed for: ${scrapedUrl.slice(0, 60)}...`);
          }
        }
      }

      // STEP 2: If no real image downloaded, keep existing AI image
      if (!newImageUrl) {
        console.log(`[ImageGen] No downloadable image found, keeping existing AI image`);
        skipped++;
        continue;
      }

      // Update with the new image
      await db
        .update(newsArticles)
        .set({ imageUrl: newImageUrl })
        .where(eq(newsArticles.id, article.id));

      success++;

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`[ImageGen] Error: ${(error as Error).message}`);
      failed++;
    }
  }

  return { success, failed, skipped, scraped };
}

// Fix broken external image URLs by re-scraping and downloading locally
export async function fixBrokenImages(limit: number = 20): Promise<{ success: number; failed: number; checked: number }> {
  console.log('[ImageGen] Finding articles with external image URLs to fix...');

  const { like, and, not } = await import('drizzle-orm');

  // Find articles with external image URLs (not local paths)
  const articlesWithExternalImages = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      imageUrl: newsArticles.imageUrl,
      originalUrl: newsArticles.originalUrl,
    })
    .from(newsArticles)
    .where(
      and(
        like(newsArticles.imageUrl, 'http%'),
        not(like(newsArticles.imageUrl, '/images/articles/%')),
        not(like(newsArticles.imageUrl, '/api/images/%'))
      )
    )
    .limit(limit);

  console.log(`[ImageGen] Found ${articlesWithExternalImages.length} articles with external images`);

  let success = 0;
  let failed = 0;
  let checked = articlesWithExternalImages.length;

  for (const article of articlesWithExternalImages) {
    try {
      console.log(`[ImageGen] Checking: ${article.title.slice(0, 50)}...`);

      // Try to download the existing image URL
      if (article.imageUrl) {
        const downloadResult = await downloadImage(article.imageUrl);
        if (downloadResult.success && downloadResult.localPath) {
          // Successfully downloaded - update to local path
          await db
            .update(newsArticles)
            .set({ imageUrl: downloadResult.localPath })
            .where(eq(newsArticles.id, article.id));

          console.log(`[ImageGen] Fixed: ${downloadResult.localPath}`);
          success++;
          continue;
        }
      }

      // Download failed - try to scrape a new image
      if (article.originalUrl) {
        const scrapedUrl = await scrapeArticleImage(article.originalUrl);
        if (scrapedUrl && scrapedUrl !== article.imageUrl) {
          const downloadResult = await downloadImage(scrapedUrl);
          if (downloadResult.success && downloadResult.localPath) {
            await db
              .update(newsArticles)
              .set({ imageUrl: downloadResult.localPath })
              .where(eq(newsArticles.id, article.id));

            console.log(`[ImageGen] Re-scraped and fixed: ${downloadResult.localPath}`);
            success++;
            continue;
          }
        }
      }

      // Image is truly broken - clear it so AI can be generated as last resort
      console.log(`[ImageGen] Clearing broken image for: ${article.title.slice(0, 40)}...`);
      await db
        .update(newsArticles)
        .set({ imageUrl: null })
        .where(eq(newsArticles.id, article.id));
      failed++;

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[ImageGen] Error: ${(error as Error).message}`);
      failed++;
    }
  }

  return { success, failed, checked };
}
