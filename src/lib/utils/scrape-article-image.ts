/**
 * Scrape the main image from an article page when RSS doesn't provide one
 */

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Common selectors for article images across news sites
const IMAGE_SELECTORS = [
  // Open Graph (most reliable)
  'meta[property="og:image"]',
  'meta[name="og:image"]',
  // Twitter Card
  'meta[name="twitter:image"]',
  'meta[property="twitter:image"]',
  'meta[name="twitter:image:src"]',
  // Schema.org
  'meta[itemprop="image"]',
  // Common article image patterns
  'article img',
  '.article-image img',
  '.featured-image img',
  '.post-thumbnail img',
  '.entry-image img',
  '.article-hero img',
  '.article__hero img',
  '[class*="hero"] img',
  '[class*="featured"] img',
  'figure img',
  // First large image in main content
  'main img',
  '.content img',
  '#content img',
];

/**
 * Extract image URL from HTML content
 */
function extractImageFromHtml(html: string, baseUrl: string): string | null {
  // Try Open Graph first (most reliable)
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) {
    return resolveUrl(ogMatch[1], baseUrl);
  }

  // Try Twitter Card
  const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);
  if (twitterMatch?.[1]) {
    return resolveUrl(twitterMatch[1], baseUrl);
  }

  // Try Schema.org itemprop
  const schemaMatch = html.match(/<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i);
  if (schemaMatch?.[1]) {
    return resolveUrl(schemaMatch[1], baseUrl);
  }

  // Try JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch?.[1]) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const image = jsonLd.image || jsonLd.thumbnailUrl || jsonLd.primaryImageOfPage?.url;
      if (image) {
        const imgUrl = Array.isArray(image) ? image[0] : (typeof image === 'string' ? image : image.url);
        if (imgUrl) return resolveUrl(imgUrl, baseUrl);
      }
    } catch {
      // JSON parse failed, continue to other methods
    }
  }

  // Try to find first substantial image in content
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    // Skip tiny images, icons, tracking pixels, ads
    if (
      src.includes('logo') ||
      src.includes('icon') ||
      src.includes('avatar') ||
      src.includes('pixel') ||
      src.includes('tracking') ||
      src.includes('ad-') ||
      src.includes('/ads/') ||
      src.includes('1x1') ||
      src.includes('spacer') ||
      src.includes('blank') ||
      src.includes('data:image') ||
      src.endsWith('.gif') ||
      src.endsWith('.svg')
    ) {
      continue;
    }

    // Check if it looks like a content image (has reasonable dimensions or is in article context)
    const widthMatch = match[0].match(/width=["']?(\d+)/i);
    const heightMatch = match[0].match(/height=["']?(\d+)/i);

    if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1]);
      const height = parseInt(heightMatch[1]);
      // Skip small images
      if (width < 200 || height < 150) continue;
    }

    return resolveUrl(src, baseUrl);
  }

  return null;
}

/**
 * Resolve relative URLs to absolute
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * Fetch article page and extract the main image
 */
export async function scrapeArticleImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[ImageScrape] Failed to fetch ${articleUrl}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const imageUrl = extractImageFromHtml(html, articleUrl);

    if (imageUrl) {
      console.log(`[ImageScrape] Found image for ${articleUrl.slice(0, 50)}...`);
    }

    return imageUrl;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.warn(`[ImageScrape] Timeout fetching ${articleUrl}`);
    } else {
      console.warn(`[ImageScrape] Error fetching ${articleUrl}:`, (error as Error).message);
    }
    return null;
  }
}

/**
 * Batch scrape images for multiple articles
 */
export async function scrapeArticleImages(
  articles: { url: string; currentImageUrl?: string }[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Only scrape articles that don't have images
  const needsScraping = articles.filter(a => !a.currentImageUrl);

  // Process in batches to avoid overwhelming servers
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1000;

  for (let i = 0; i < needsScraping.length; i += BATCH_SIZE) {
    const batch = needsScraping.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (article) => {
        const imageUrl = await scrapeArticleImage(article.url);
        return { url: article.url, imageUrl };
      })
    );

    for (const result of batchResults) {
      if (result.imageUrl) {
        results.set(result.url, result.imageUrl);
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < needsScraping.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  return results;
}
