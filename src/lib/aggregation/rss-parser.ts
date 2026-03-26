import Parser from 'rss-parser';
import { generateNewsSlug } from '@/lib/utils';
import { scrapeArticleImage } from '@/lib/utils/scrape-article-image';

// Enable scraping article pages for images when RSS doesn't include them
const ENABLE_IMAGE_SCRAPING = process.env.SCRAPE_ARTICLE_IMAGES !== 'false';

// Decode common HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&quot;': '"',
    '&#34;': '"',
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&mdash;': '\u2014',
    '&#8212;': '\u2014',
    '&ndash;': '\u2013',
    '&#8211;': '\u2013',
    '&hellip;': '\u2026',
    '&#8230;': '\u2026',
    '&rsquo;': "'",
    '&#8217;': "'",
    '&lsquo;': "'",
    '&#8216;': "'",
    '&rdquo;': '"',
    '&#8221;': '"',
    '&ldquo;': '"',
    '&#8220;': '"',
  };
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }
  return result;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'dcCreator'],
    ],
  },
});

export interface RSSFeedConfig {
  name: string;
  slug: string;
  feedUrl: string;
  websiteUrl: string;
  priority: number;
}

export interface ParsedArticle {
  externalId: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author?: string;
  imageUrl?: string;
  originalUrl: string;
  publishedAt: Date;
  tags: string[];
}

export async function parseFeed(config: RSSFeedConfig): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(config.feedUrl);
    const articles: ParsedArticle[] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
      const externalId = item.guid || item.link;

      // Extract image URL from various sources
      let imageUrl: string | undefined;

      // Try media:content
      if ((item as any).mediaContent?.$ ?.url) {
        imageUrl = (item as any).mediaContent.$.url;
      }
      // Try media:thumbnail
      else if ((item as any).mediaThumbnail?.$ ?.url) {
        imageUrl = (item as any).mediaThumbnail.$.url;
      }
      // Try enclosure
      else if ((item as any).enclosure?.url && (item as any).enclosure?.type?.startsWith('image')) {
        imageUrl = (item as any).enclosure.url;
      }
      // Try to extract from content
      else if (item.content) {
        const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }

      // Fallback: scrape the article page for the image
      if (!imageUrl && ENABLE_IMAGE_SCRAPING && item.link) {
        try {
          const scrapedImage = await scrapeArticleImage(item.link);
          if (scrapedImage) {
            imageUrl = scrapedImage;
          }
        } catch (error) {
          // Silent fail - image scraping is best effort
        }
      }

      // Extract tags from categories
      const tags: string[] = [];
      if (item.categories) {
        tags.push(...item.categories.slice(0, 5));
      }

      // Clean up summary/content
      let summary = item.contentSnippet || item.content;
      if (summary) {
        // Remove HTML tags and limit length
        summary = summary
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 300);
        if (summary.length === 300) {
          summary += '...';
        }
      }

      // Decode HTML entities in title and content
      const decodedTitle = decodeHtmlEntities(item.title.trim());
      const decodedSummary = summary ? decodeHtmlEntities(summary) : undefined;

      // Clean content: strip HTML, remove promotional junk
      let decodedContent: string | undefined;
      if (item.content) {
        let cleaned = item.content
          .replace(/<[^>]*>/g, ' ')       // strip HTML tags
          .replace(/\s+/g, ' ')            // collapse whitespace
          .trim();
        cleaned = decodeHtmlEntities(cleaned);

        // Remove common promotional patterns
        const junkPatterns = [
          /DOWNLOAD THE OFFICIAL.*?(PLAY|STORE)\s*/gi,
          /The post\s+.*?appeared first on\s+.*?\.?\s*$/gi,
          /Click here to.*$/gi,
          /Subscribe to.*$/gi,
          /Sign up for.*$/gi,
          /Read more at.*$/gi,
          /Continue reading.*$/gi,
          /For more stories like this.*$/gi,
          /\[…\]/g,
          /\[\.\.\.\]/g,
        ];
        for (const pattern of junkPatterns) {
          cleaned = cleaned.replace(pattern, '').trim();
        }

        decodedContent = cleaned || undefined;
      }

      const articleUrl = item.link;
      const author = item.creator || (item as any).dcCreator;

      articles.push({
        externalId,
        title: decodedTitle,
        slug: generateNewsSlug(decodedTitle, publishedAt),
        summary: decodedSummary,
        content: decodedContent,
        author,
        imageUrl,
        originalUrl: articleUrl,
        publishedAt,
        tags,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Failed to parse feed ${config.name}:`, error);
    return [];
  }
}

export async function parseMultipleFeeds(
  configs: RSSFeedConfig[]
): Promise<Map<string, ParsedArticle[]>> {
  const results = new Map<string, ParsedArticle[]>();

  await Promise.all(
    configs.map(async (config) => {
      const articles = await parseFeed(config);
      results.set(config.slug, articles);
    })
  );

  return results;
}
