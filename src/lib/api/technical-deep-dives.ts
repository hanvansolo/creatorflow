import Anthropic from '@anthropic-ai/sdk';
import { db, newsArticles, technicalDeepDives } from '@/lib/db';
import { eq, desc, isNull, sql, and, gte, not, inArray } from 'drizzle-orm';

// Lazy-load Anthropic client to avoid initialization issues
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

// Technical topics that trigger deep-dive generation
const TECHNICAL_KEYWORDS = {
  aerodynamics: [
    'floor', 'diffuser', 'downforce', 'drag', 'sidepod', 'front wing', 'rear wing',
    'bargeboards', 'aero', 'wind tunnel', 'cfd', 'porpoising', 'ground effect',
    'vortex', 'airflow', 'rake', 'outwash', 'inwash', 'beam wing', 'drs',
  ],
  power_unit: [
    'mgu-k', 'mgu-h', 'ers', 'battery', 'hybrid', 'internal combustion',
    'turbo', 'compressor', 'engine', 'power unit', 'pu', 'fuel', 'e-fuel',
    'energy recovery', 'deployment', 'harvesting', 'electrical', 'ice',
  ],
  regulations: [
    'regulation', 'rule', 'fia', 'technical directive', 'td', 'cost cap',
    'budget cap', 'penalty', 'compliance', 'legality', 'scrutineering',
    'parc ferme', 'sporting code', 'illegal', 'protest', 'clarification',
  ],
  strategy: [
    'undercut', 'overcut', 'pit strategy', 'tyre strategy', 'one-stop',
    'two-stop', 'safety car', 'virtual safety car', 'vsc', 'red flag',
    'track position', 'pit window', 'gap management', 'tyre life',
  ],
  tyres: [
    'compound', 'pirelli', 'soft', 'medium', 'hard', 'intermediate', 'wet',
    'tyre degradation', 'graining', 'blistering', 'thermal degradation',
    'tyre management', 'rubber', 'grip', 'wear', 'surface temperature',
  ],
  technology: [
    'simulation', 'telemetry', 'data', 'sensor', 'steering wheel',
    'suspension', 'damper', 'brake-by-wire', 'active suspension',
    'carbon fibre', 'composite', 'manufacturing', '3d printing', 'halo',
  ],
};

interface KeyConcept {
  term: string;
  definition: string;
}

interface DeepDiveContent {
  title: string;
  category: string;
  summary: string;
  explanation: string;
  keyConcepts: KeyConcept[];
  realWorldExample: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/**
 * Detect if an article contains technical content worth explaining
 */
export function detectTechnicalTopic(
  title: string,
  content: string | null
): { hasTechnicalContent: boolean; category: string | null; triggerPhrases: string[] } {
  const text = `${title} ${content || ''}`.toLowerCase();
  const foundPhrases: string[] = [];
  let bestCategory: string | null = null;
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(TECHNICAL_KEYWORDS)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        if (!foundPhrases.includes(keyword)) {
          foundPhrases.push(keyword);
        }
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }

  // Require at least 2 keyword matches to consider it technical content
  return {
    hasTechnicalContent: maxMatches >= 2,
    category: bestCategory,
    triggerPhrases: foundPhrases.slice(0, 5),
  };
}

/**
 * Generate a technical deep-dive explanation from article content
 */
async function generateDeepDiveContent(
  articleTitle: string,
  articleContent: string | null,
  category: string,
  triggerPhrases: string[]
): Promise<DeepDiveContent | null> {
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a football tactics expert writing educational content for fans.

Based on this football news article, create a tactical deep-dive that explains the underlying concepts.

Article Title: ${articleTitle}
Article Content: ${articleContent?.slice(0, 2000) || 'No content available'}
Category: ${category}
Key terms mentioned: ${triggerPhrases.join(', ')}

Create a deep-dive with:
1. A clear, educational title (not the article title - focus on the technical concept)
2. A 1-2 sentence summary
3. A detailed explanation (3-5 paragraphs, using markdown formatting)
4. 3-4 key concepts with simple definitions
5. A real-world football example that illustrates the concept
6. Difficulty level (beginner/intermediate/advanced)

Respond in this exact JSON format:
{
  "title": "Understanding [Technical Concept]",
  "summary": "Brief summary...",
  "explanation": "Detailed markdown explanation...",
  "keyConcepts": [
    {"term": "Term 1", "definition": "Simple definition..."},
    {"term": "Term 2", "definition": "Simple definition..."}
  ],
  "realWorldExample": "In the 2023 season, Team X used this when...",
  "difficulty": "intermediate"
}`,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      return null;
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[DeepDive] No JSON found in response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<DeepDiveContent, 'category'>;
    return {
      ...parsed,
      category,
    };
  } catch (error) {
    console.error('[DeepDive] Failed to generate content:', error);
    return null;
  }
}

/**
 * Check if a similar deep-dive already exists
 */
async function findSimilarDeepDive(title: string, category: string): Promise<boolean> {
  // Check for existing deep-dives with similar titles
  const existing = await db
    .select({ id: technicalDeepDives.id })
    .from(technicalDeepDives)
    .where(
      and(
        eq(technicalDeepDives.category, category),
        sql`similarity(${technicalDeepDives.title}, ${title}) > 0.3`
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Create a technical deep-dive from an article
 */
export async function createDeepDiveFromArticle(
  articleId: string,
  articleTitle: string,
  articleContent: string | null,
  category: string,
  triggerPhrases: string[]
): Promise<{ success: boolean; deepDiveId?: string; error?: string }> {
  console.log('[DeepDive] Generating deep-dive for:', articleTitle);

  const content = await generateDeepDiveContent(
    articleTitle,
    articleContent,
    category,
    triggerPhrases
  );

  if (!content) {
    return { success: false, error: 'Failed to generate content' };
  }

  // Check for duplicates (simple title check since pg_trgm might not be installed)
  const slug = generateSlug(content.title);
  const existing = await db
    .select({ id: technicalDeepDives.id })
    .from(technicalDeepDives)
    .where(eq(technicalDeepDives.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    console.log('[DeepDive] Similar deep-dive already exists');
    return { success: false, error: 'Similar deep-dive already exists' };
  }

  // Insert the new deep-dive
  const [inserted] = await db
    .insert(technicalDeepDives)
    .values({
      title: content.title,
      slug,
      category: content.category,
      difficulty: content.difficulty,
      summary: content.summary,
      explanation: content.explanation,
      keyConcepts: content.keyConcepts,
      realWorldExample: content.realWorldExample,
      sourceArticleId: articleId,
      triggerPhrase: triggerPhrases.join(', '),
      tags: triggerPhrases,
      isPublished: true,
    })
    .returning({ id: technicalDeepDives.id });

  console.log('[DeepDive] Created deep-dive:', content.title);
  return { success: true, deepDiveId: inserted.id };
}

/**
 * Scan recent articles for technical content and generate deep-dives
 */
export async function extractTechnicalDeepDives(
  limit: number = 10
): Promise<{ scanned: number; generated: number; skipped: number }> {
  console.log('[DeepDive] Scanning recent articles for technical content...');

  // Get articles from the last 24 hours that haven't been processed
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // Get IDs of articles that already have deep-dives
  const processedArticleIds = await db
    .select({ id: technicalDeepDives.sourceArticleId })
    .from(technicalDeepDives)
    .where(not(isNull(technicalDeepDives.sourceArticleId)));

  const processedIds = processedArticleIds
    .map(a => a.id)
    .filter((id): id is string => id !== null);

  // Fetch recent articles
  let query = db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      content: newsArticles.content,
      summary: newsArticles.summary,
    })
    .from(newsArticles)
    .where(gte(newsArticles.publishedAt, oneDayAgo))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit * 3); // Get more to filter

  const articles = await query;

  // Filter out already processed
  const unprocessedArticles = articles.filter(a => !processedIds.includes(a.id));

  let scanned = 0;
  let generated = 0;
  let skipped = 0;

  for (const article of unprocessedArticles.slice(0, limit)) {
    scanned++;

    const { hasTechnicalContent, category, triggerPhrases } = detectTechnicalTopic(
      article.title,
      article.content || article.summary
    );

    if (!hasTechnicalContent || !category) {
      skipped++;
      continue;
    }

    const result = await createDeepDiveFromArticle(
      article.id,
      article.title,
      article.content || article.summary,
      category,
      triggerPhrases
    );

    if (result.success) {
      generated++;
    } else {
      skipped++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[DeepDive] Scanned: ${scanned}, Generated: ${generated}, Skipped: ${skipped}`);
  return { scanned, generated, skipped };
}

/**
 * Get all published deep-dives, optionally filtered by category
 */
export async function getDeepDives(category?: string, limit: number = 20) {
  let query = db
    .select()
    .from(technicalDeepDives)
    .where(eq(technicalDeepDives.isPublished, true))
    .orderBy(desc(technicalDeepDives.createdAt))
    .limit(limit);

  if (category) {
    query = db
      .select()
      .from(technicalDeepDives)
      .where(
        and(
          eq(technicalDeepDives.isPublished, true),
          eq(technicalDeepDives.category, category)
        )
      )
      .orderBy(desc(technicalDeepDives.createdAt))
      .limit(limit);
  }

  return query;
}

/**
 * Get a single deep-dive by slug
 */
export async function getDeepDiveBySlug(slug: string) {
  const [deepDive] = await db
    .select()
    .from(technicalDeepDives)
    .where(eq(technicalDeepDives.slug, slug))
    .limit(1);

  if (deepDive) {
    // Increment view count
    await db
      .update(technicalDeepDives)
      .set({ viewCount: sql`${technicalDeepDives.viewCount} + 1` })
      .where(eq(technicalDeepDives.id, deepDive.id));
  }

  return deepDive || null;
}

/**
 * Get categories with counts
 */
export async function getDeepDiveCategories() {
  const categories = await db
    .select({
      category: technicalDeepDives.category,
      count: sql<number>`count(*)::int`,
    })
    .from(technicalDeepDives)
    .where(eq(technicalDeepDives.isPublished, true))
    .groupBy(technicalDeepDives.category)
    .orderBy(sql`count(*) desc`);

  return categories;
}
