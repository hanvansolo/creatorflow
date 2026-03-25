import type { ParsedArticle } from './rss-parser';

// Simple similarity check based on title
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

export function deduplicateArticles(
  articles: ParsedArticle[],
  similarityThreshold: number = 0.7
): ParsedArticle[] {
  const seen = new Map<string, ParsedArticle>();
  const result: ParsedArticle[] = [];

  // Sort by date (newest first) so we keep the most recent version
  const sorted = [...articles].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  for (const article of sorted) {
    const normalizedTitle = normalizeTitle(article.title);
    let isDuplicate = false;

    // Check against all seen articles
    for (const [seenTitle] of seen) {
      if (calculateSimilarity(normalizedTitle, seenTitle) >= similarityThreshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalizedTitle, article);
      result.push(article);
    }
  }

  return result;
}

export function mergeAndDeduplicate(
  articlesBySource: Map<string, ParsedArticle[]>,
  similarityThreshold: number = 0.7
): ParsedArticle[] {
  // Flatten all articles
  const allArticles: ParsedArticle[] = [];
  for (const articles of articlesBySource.values()) {
    allArticles.push(...articles);
  }

  // Deduplicate
  return deduplicateArticles(allArticles, similarityThreshold);
}
