import Anthropic from '@anthropic-ai/sdk';
import { db, newsArticles, newsSources, dailyRoundups } from '@/lib/db';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

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

interface ArticleSummary {
  title: string;
  summary: string;
  sourceName: string;
}

interface RoundupSection {
  articles: ArticleSummary[];
  summary: string | null;
}

interface DailyRoundupResult {
  date: string;
  verified: RoundupSection;
  unverified: RoundupSection;
  rumour: RoundupSection;
  lastUpdatedAt: Date;
  roundupArticleId?: string;
}

/**
 * Generate an AI summary for a list of articles in a category
 */
async function generateSectionSummary(
  articles: ArticleSummary[],
  category: 'verified' | 'unverified' | 'rumour'
): Promise<string | null> {
  if (articles.length === 0) {
    console.log(`[Roundup] No articles for ${category}, skipping summary`);
    return null;
  }

  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(`[Roundup] ANTHROPIC_API_KEY not set, generating fallback summary for ${category}`);
    // Generate a simple fallback summary
    const topTitles = articles.slice(0, 3).map(a => a.title).join('; ');
    return `Today's top ${category} stories: ${topTitles}...`;
  }

  const categoryDescriptions = {
    verified: 'confirmed and verified',
    unverified: 'unverified or opinion-based',
    rumour: 'rumoured or speculated',
  };

  const articleList = articles
    .slice(0, 10) // Limit to prevent token overflow
    .map((a, i) => `${i + 1}. "${a.title}" (${a.sourceName}): ${a.summary || 'No summary'}`)
    .join('\n');

  console.log(`[Roundup] Generating AI summary for ${category} (${articles.length} articles)`);

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-latest',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are an football journalist writing a daily news roundup for fans.
Write a concise 2-4 sentence summary of today's ${categoryDescriptions[category]} football news stories.
Highlight the most significant stories and keep it engaging.

Today's ${category} stories:
${articleList}

Write the summary now (2-4 sentences, no preamble):`,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      console.error(`[Roundup] Unexpected response type for ${category}:`, textContent.type);
      return null;
    }

    console.log(`[Roundup] Generated summary for ${category}: ${textContent.text.slice(0, 50)}...`);
    return textContent.text.trim();
  } catch (error) {
    console.error(`[Roundup] Failed to generate ${category} summary:`, error);
    // Return a fallback instead of null
    const topTitles = articles.slice(0, 3).map(a => a.title).join('; ');
    return `Today's ${category} highlights include: ${topTitles}...`;
  }
}

/**
 * Generate a full-length daily roundup article for newsArticles table
 */
async function generateRoundupArticle(
  verified: ArticleSummary[],
  unverified: ArticleSummary[],
  rumour: ArticleSummary[],
  dateStr: string
): Promise<{ title: string; summary: string; content: string } | null> {
  const allArticles = [...verified, ...unverified, ...rumour];
  if (allArticles.length === 0) {
    console.log('[Roundup] No articles to generate roundup article from');
    return null;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[Roundup] ANTHROPIC_API_KEY not set, skipping roundup article generation');
    return null;
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00Z');
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  };

  const formattedDate = formatDate(dateStr);

  const buildSection = (articles: ArticleSummary[], label: string) => {
    if (articles.length === 0) return '';
    const items = articles
      .slice(0, 15)
      .map((a, i) => `${i + 1}. "${a.title}" (${a.sourceName}): ${a.summary || 'No summary available'}`)
      .join('\n');
    return `\n${label} NEWS (${articles.length} stories):\n${items}`;
  };

  const articleList = [
    buildSection(verified, 'CONFIRMED'),
    buildSection(unverified, 'DEVELOPING'),
    buildSection(rumour, 'RUMOUR MILL'),
  ].filter(Boolean).join('\n');

  console.log(`[Roundup] Generating full roundup article for ${dateStr} (${allArticles.length} total articles)`);

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-latest',
      max_tokens: 6000,
      messages: [
        {
          role: 'user',
          content: `You are a senior football journalist writing the daily news roundup for FootyFeed. Write a comprehensive, engaging article summarising all of today's important football news.

DATE: ${formattedDate}

TODAY'S STORIES:
${articleList}

ARTICLE REQUIREMENTS:
- Title format: "Football Daily Roundup: [Key Headline] | ${formattedDate}"
- Write a 3-4 sentence summary capturing the day's biggest stories
- The full article MUST be at least 800 words long
- Structure the article with clear sections using markdown subheadings (##)
- Start with the most significant story of the day as the lead
- Cover confirmed news first, then developing stories, then rumours
- For each major story, provide context about why it matters
- Use engaging, professional sports journalism tone
- End with a "Looking Ahead" section about what to watch for next
- Do NOT add any facts, stats, or claims not present in the source articles
- Do NOT include disclaimers about being AI-generated

Respond using this exact format:

---TITLE---
Your headline here
---SUMMARY---
Your 3-4 sentence summary here
---CONTENT---
Your full article here (800+ words, with ## subheadings)
---END---`,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      console.error('[Roundup] Unexpected response type:', textContent.type);
      return null;
    }

    const text = textContent.text;
    const titleMatch = text.match(/---TITLE---\s*([\s\S]*?)\s*---SUMMARY---/);
    const summaryMatch = text.match(/---SUMMARY---\s*([\s\S]*?)\s*---CONTENT---/);
    const contentMatch = text.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);

    if (!titleMatch || !summaryMatch || !contentMatch) {
      console.error('[Roundup] Could not extract fields from roundup article response');
      return null;
    }

    return {
      title: titleMatch[1].trim(),
      summary: summaryMatch[1].trim(),
      content: contentMatch[1].trim(),
    };
  } catch (error) {
    console.error('[Roundup] Failed to generate roundup article:', error);
    return null;
  }
}

/**
 * Get today's date string in YYYY-MM-DD format
 * Uses the current date in the server's timezone (or configured timezone)
 */
function getTodayDateString(): string {
  const now = new Date();
  // Use UTC to ensure consistency across server restarts
  return now.toISOString().split('T')[0];
}

/**
 * Map credibility ratings to our 3 categories
 */
function mapCredibilityToCategory(rating: string | null): 'verified' | 'unverified' | 'rumour' {
  switch (rating) {
    case 'verified':
      return 'verified';
    case 'rumour':
      return 'rumour';
    case 'unverified':
    case 'clickbait':
    case 'opinion':
    default:
      return 'unverified';
  }
}

/**
 * Get or create the FootyFeed roundup source
 */
async function getRoundupSource(): Promise<string> {
  const [existing] = await db
    .select()
    .from(newsSources)
    .where(eq(newsSources.slug, 'footyfeed-roundup'))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(newsSources)
    .values({
      name: 'FootyFeed Daily Roundup',
      slug: 'footyfeed-roundup',
      type: 'roundup',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com',
      isActive: true,
      priority: 10,
    })
    .returning();

  return created.id;
}

/**
 * Generate or update today's daily roundup
 */
export async function generateDailyRoundup(): Promise<DailyRoundupResult> {
  const todayStr = getTodayDateString();
  const todayStart = new Date(todayStr + 'T00:00:00.000Z');
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // Fetch today's articles with their sources (exclude previous roundup articles)
  const articles = await db
    .select({
      title: newsArticles.title,
      summary: newsArticles.summary,
      credibilityRating: newsArticles.credibilityRating,
      sourceName: newsSources.name,
      sourceSlug: newsSources.slug,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      and(
        gte(newsArticles.publishedAt, todayStart),
        lt(newsArticles.publishedAt, tomorrowStart)
      )
    );

  // Group articles by category, excluding roundup articles
  const verified: ArticleSummary[] = [];
  const unverified: ArticleSummary[] = [];
  const rumour: ArticleSummary[] = [];

  for (const article of articles) {
    // Skip our own roundup articles
    if (article.sourceSlug === 'footyfeed-roundup') continue;

    const category = mapCredibilityToCategory(article.credibilityRating);
    const articleSummary: ArticleSummary = {
      title: article.title,
      summary: article.summary || '',
      sourceName: article.sourceName || 'Unknown',
    };

    switch (category) {
      case 'verified':
        verified.push(articleSummary);
        break;
      case 'rumour':
        rumour.push(articleSummary);
        break;
      default:
        unverified.push(articleSummary);
    }
  }

  // Generate summaries for each section and the full roundup article in parallel
  const [verifiedSummary, unverifiedSummary, rumourSummary, roundupArticle] = await Promise.all([
    generateSectionSummary(verified, 'verified'),
    generateSectionSummary(unverified, 'unverified'),
    generateSectionSummary(rumour, 'rumour'),
    generateRoundupArticle(verified, unverified, rumour, todayStr),
  ]);

  const now = new Date();

  // Upsert the daily roundup record
  await db
    .insert(dailyRoundups)
    .values({
      date: todayStr,
      verifiedSummary,
      unverifiedSummary,
      rumourSummary,
      verifiedArticleCount: verified.length,
      unverifiedArticleCount: unverified.length,
      rumourArticleCount: rumour.length,
      lastUpdatedAt: now,
    })
    .onConflictDoUpdate({
      target: dailyRoundups.date,
      set: {
        verifiedSummary,
        unverifiedSummary,
        rumourSummary,
        verifiedArticleCount: verified.length,
        unverifiedArticleCount: unverified.length,
        rumourArticleCount: rumour.length,
        lastUpdatedAt: now,
      },
    });

  // Insert or update the roundup as a news article
  let roundupArticleId: string | undefined;
  if (roundupArticle) {
    const sourceId = await getRoundupSource();
    const slug = `football-daily-roundup-${todayStr}`;
    const externalId = `roundup-${todayStr}`;

    // Check if roundup article already exists for today
    const [existing] = await db
      .select({ id: newsArticles.id })
      .from(newsArticles)
      .where(
        and(
          eq(newsArticles.sourceId, sourceId),
          eq(newsArticles.externalId, externalId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing roundup article
      await db
        .update(newsArticles)
        .set({
          title: roundupArticle.title,
          summary: roundupArticle.summary,
          content: roundupArticle.content,
        })
        .where(eq(newsArticles.id, existing.id));
      roundupArticleId = existing.id;
      console.log(`[Roundup] Updated existing roundup article: ${existing.id}`);
    } else {
      // Create new roundup article
      const [created] = await db
        .insert(newsArticles)
        .values({
          sourceId,
          externalId,
          title: roundupArticle.title,
          slug,
          summary: roundupArticle.summary,
          content: roundupArticle.content,
          author: 'FootyFeed',
          originalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/news/${slug}`,
          publishedAt: now,
          credibilityRating: 'verified',
          tags: ['daily-roundup', 'news-roundup'],
        })
        .returning();
      roundupArticleId = created.id;
      console.log(`[Roundup] Created new roundup article: ${created.id}`);
    }
  }

  return {
    date: todayStr,
    verified: {
      articles: verified,
      summary: verifiedSummary,
    },
    unverified: {
      articles: unverified,
      summary: unverifiedSummary,
    },
    rumour: {
      articles: rumour,
      summary: rumourSummary,
    },
    lastUpdatedAt: now,
    roundupArticleId,
  };
}

/**
 * Get today's roundup from the database (without regenerating)
 */
export async function getTodayRoundup() {
  const todayStr = getTodayDateString();

  const [roundup] = await db
    .select()
    .from(dailyRoundups)
    .where(eq(dailyRoundups.date, todayStr))
    .limit(1);

  return roundup || null;
}

/**
 * Get articles for today grouped by category
 */
export async function getTodayArticlesByCategory() {
  const todayStr = getTodayDateString();
  const todayStart = new Date(todayStr + 'T00:00:00.000Z');
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      imageUrl: newsArticles.imageUrl,
      credibilityRating: newsArticles.credibilityRating,
      publishedAt: newsArticles.publishedAt,
      sourceName: newsSources.name,
      sourceSlug: newsSources.slug,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      and(
        gte(newsArticles.publishedAt, todayStart),
        lt(newsArticles.publishedAt, tomorrowStart)
      )
    )
    .orderBy(sql`${newsArticles.publishedAt} DESC`);

  const verified: typeof articles = [];
  const unverified: typeof articles = [];
  const rumour: typeof articles = [];

  for (const article of articles) {
    const category = mapCredibilityToCategory(article.credibilityRating);
    switch (category) {
      case 'verified':
        verified.push(article);
        break;
      case 'rumour':
        rumour.push(article);
        break;
      default:
        unverified.push(article);
    }
  }

  return { verified, unverified, rumour };
}
