// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import { db, newsArticles } from '@/lib/db';
import { desc, gte, and, isNotNull, sql } from 'drizzle-orm';
import { generateNewsSlug } from '@/lib/utils';
import { pickAuthor } from '@/lib/constants/authors';

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

interface ArticleSource {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  tags: string[] | null;
  publishedAt: Date;
}

interface TopicCluster {
  topic: string;
  articles: ArticleSource[];
  keyTerms: string[];
}

/**
 * Find clusters of articles covering the same story in the last 18h.
 * Groups by shared entity names (clubs, players, competitions) in titles.
 */
async function findTopicClusters(): Promise<TopicCluster[]> {
  const since = new Date(Date.now() - 18 * 60 * 60 * 1000);

  const recent = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      summary: newsArticles.summary,
      content: newsArticles.content,
      tags: newsArticles.tags,
      publishedAt: newsArticles.publishedAt,
      credibilityRating: newsArticles.credibilityRating,
    })
    .from(newsArticles)
    .where(and(
      gte(newsArticles.publishedAt, since),
      isNotNull(newsArticles.content),
    ))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(100);

  // Skip articles that are already synthesis pieces
  const candidates = recent.filter(a => a.credibilityRating !== 'analysis');

  // Extract key terms from each title (2+ word proper nouns, team names, player names)
  const BIG_CLUBS = [
    'Arsenal', 'Manchester City', 'Liverpool', 'Manchester United', 'Chelsea', 'Tottenham',
    'Real Madrid', 'Barcelona', 'Bayern Munich', 'PSG', 'Juventus', 'Inter Milan',
    'AC Milan', 'Napoli', 'Borussia Dortmund', 'Atletico Madrid', 'Newcastle',
    'Aston Villa', 'West Ham', 'Brighton',
  ];

  const COMPETITIONS = [
    'Champions League', 'Europa League', 'Premier League', 'La Liga', 'Serie A',
    'Bundesliga', 'Ligue 1', 'FA Cup', 'World Cup', 'Nations League',
  ];

  function extractTerms(title: string, tags?: string[] | null): string[] {
    const terms: string[] = [];
    const text = title.toLowerCase();
    for (const club of BIG_CLUBS) {
      if (text.includes(club.toLowerCase())) terms.push(club);
    }
    for (const comp of COMPETITIONS) {
      if (text.includes(comp.toLowerCase())) terms.push(comp);
    }
    // Also use tags
    if (tags) {
      for (const tag of tags) {
        if (BIG_CLUBS.some(c => c.toLowerCase() === tag.toLowerCase())) terms.push(tag);
      }
    }
    return [...new Set(terms)];
  }

  // Group articles that share at least one key entity
  const termToArticles = new Map<string, ArticleSource[]>();
  for (const article of candidates) {
    const terms = extractTerms(article.title, article.tags);
    for (const term of terms) {
      if (!termToArticles.has(term)) termToArticles.set(term, []);
      termToArticles.get(term)!.push(article);
    }
  }

  // Build clusters: groups of 3+ articles sharing a key term
  const clusters: TopicCluster[] = [];
  const usedIds = new Set<string>();

  // Sort by cluster size (biggest stories first)
  const sorted = [...termToArticles.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [topic, articles] of sorted) {
    // Only use articles not already in another cluster
    const fresh = articles.filter(a => !usedIds.has(a.id));
    if (fresh.length < 3) continue;

    // Take top 5 articles max
    const cluster = fresh.slice(0, 5);
    cluster.forEach(a => usedIds.add(a.id));

    clusters.push({
      topic,
      articles: cluster,
      keyTerms: extractTerms(cluster.map(a => a.title).join(' '), cluster.flatMap(a => a.tags || [])),
    });

    if (clusters.length >= 3) break; // Max 3 synthesis pieces per run
  }

  return clusters;
}

/**
 * Synthesize multiple source articles into one original analysis piece.
 */
async function synthesize(cluster: TopicCluster): Promise<{
  title: string;
  summary: string;
  content: string;
} | null> {
  const currentYear = new Date().getFullYear();
  const sourceMaterial = cluster.articles
    .map((a, i) => `--- SOURCE ${i + 1} ---\nTitle: ${a.title}\n\n${a.content || a.summary || ''}`)
    .join('\n\n');

  const prompt = `You are a senior football analyst writing an original analysis piece for Footy Feed. Below are ${cluster.articles.length} different reports covering the same story about ${cluster.keyTerms.join(', ')}. Your job is to synthesize them into ONE comprehensive, original analysis that is better and more complete than any single source.

CURRENT YEAR: ${currentYear}

WHAT MAKES THIS VALUABLE:
- Combine ALL unique facts from every source — one source may mention a quote another missed
- Identify angles that only one source covered and include them
- Add tactical or strategic context where the facts support it
- Present a complete picture no single article achieves alone

CRITICAL RULES:
- ONLY use facts, quotes, stats, and claims that appear in at least one source below
- NEVER invent quotes, statistics, or analysis not supported by the sources
- NEVER reference "reports suggest" or "according to sources" — state facts directly
- NEVER mention that this is a synthesis or that you read multiple sources
- Write as if YOU reported this story from scratch

STRUCTURE:
- Compelling headline under 80 characters — capture the key development
- Summary: 2-3 sentences that tell the full story at a glance
- Article body: 400-800 words. This should feel like a premium analysis piece.
  - Lead with the most significant development
  - Use subheadings (##) to break up sections
  - Include every direct quote from the sources (attribute to the person, not the publication)
  - Add a "What This Means" or "The Bigger Picture" section if warranted
  - Close with the key implications or next steps

${sourceMaterial}

Respond using this exact format:

---TITLE---
Your headline
---SUMMARY---
Your 2-3 sentence summary
---CONTENT---
Your full analysis (400-800 words, markdown formatted)
---END---`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0];
    if (text.type !== 'text') return null;

    const titleMatch = text.text.match(/---TITLE---\s*([\s\S]*?)\s*---SUMMARY---/);
    const summaryMatch = text.text.match(/---SUMMARY---\s*([\s\S]*?)\s*---CONTENT---/);
    const contentMatch = text.text.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);

    if (!titleMatch || !summaryMatch || !contentMatch) return null;

    return {
      title: titleMatch[1].trim(),
      summary: summaryMatch[1].trim(),
      content: contentMatch[1].trim(),
    };
  } catch (e) {
    console.error('[synthesis] Claude call failed:', (e as Error).message);
    return null;
  }
}

/**
 * Main entry point: find topic clusters and generate synthesis articles.
 * Returns the number of pieces generated.
 */
export async function generateSynthesisArticles(): Promise<{
  generated: number;
  topics: string[];
  errors: string[];
}> {
  const clusters = await findTopicClusters();
  const results = { generated: 0, topics: [] as string[], errors: [] as string[] };

  if (clusters.length === 0) {
    console.log('[synthesis] No topic clusters found with 3+ articles');
    return results;
  }

  console.log(`[synthesis] Found ${clusters.length} topic clusters: ${clusters.map(c => c.topic).join(', ')}`);

  for (const cluster of clusters) {
    try {
      // Check if we already generated a synthesis for this topic recently
      const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const [existing] = await db
        .select({ id: newsArticles.id })
        .from(newsArticles)
        .where(and(
          sql`${newsArticles.credibilityRating} = 'analysis'`,
          gte(newsArticles.publishedAt, since),
          sql`${newsArticles.title} ILIKE ${'%' + cluster.topic + '%'}`,
        ))
        .limit(1);

      if (existing) {
        console.log(`[synthesis] Already have recent analysis for "${cluster.topic}", skipping`);
        continue;
      }

      const piece = await synthesize(cluster);
      if (!piece) {
        results.errors.push(`Synthesis failed for ${cluster.topic}`);
        continue;
      }

      const wordCount = piece.content.split(/\s+/).length;
      if (wordCount < 150) {
        results.errors.push(`${cluster.topic}: too short (${wordCount} words), skipping`);
        continue;
      }

      const author = pickAuthor(piece.title, cluster.keyTerms, 'analysis');
      const slug = generateNewsSlug(piece.title, new Date());
      let finalSlug = slug;

      // Check slug uniqueness
      const [slugExists] = await db
        .select({ id: newsArticles.id })
        .from(newsArticles)
        .where(sql`${newsArticles.slug} = ${slug}`)
        .limit(1);
      if (slugExists) finalSlug = `${slug}-analysis`;

      await db.insert(newsArticles).values({
        title: piece.title,
        slug: finalSlug,
        summary: piece.summary,
        content: piece.content,
        author: author.name,
        publishedAt: new Date(),
        tags: cluster.keyTerms,
        credibilityRating: 'analysis',
        isBreaking: false,
        isPrimaryStory: true,
      });

      results.generated++;
      results.topics.push(cluster.topic);
      console.log(`[synthesis] Published: "${piece.title}" (${wordCount} words, by ${author.name})`);

      // Delay between pieces
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      results.errors.push(`${cluster.topic}: ${(e as Error).message}`);
      console.error(`[synthesis] Error for ${cluster.topic}:`, e);
    }
  }

  return results;
}
