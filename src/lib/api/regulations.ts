import Anthropic from '@anthropic-ai/sdk';
import { db, f1Regulations, articleRegulations, newsArticles, liveIncidents, races } from '@/lib/db';
import { eq, desc, and, isNull, or, ilike, sql, asc, gte } from 'drizzle-orm';

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

// ===== TYPES =====

export interface RegulationPreview {
  id: string;
  articleNumber: string;
  articleTitle: string;
  category: string;
  simplifiedExplanation: string | null;
  keyPoints: string[] | null;
  relevanceScore: number;
  matchedKeywords: string[] | null;
}

export interface F1Regulation {
  id: string;
  articleNumber: string;
  articleTitle: string;
  document: string;
  category: string;
  chapter: string | null;
  officialText: string;
  simplifiedExplanation: string | null;
  keyPoints: string[] | null;
  keywords: string[] | null;
  relatedTopics: string[] | null;
  seasonYear: number;
  sourceUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface RegulationMatch {
  regulationId: string;
  articleNumber: string;
  relevanceScore: number;
  matchedKeywords: string[];
  contextSnippet: string;
  matchType: 'direct' | 'contextual' | 'ai_inferred';
}

// ===== QUERY FUNCTIONS =====

/**
 * Get regulations linked to a specific article
 */
export async function getArticleRegulations(articleId: string): Promise<RegulationPreview[]> {
  const results = await db
    .select({
      id: f1Regulations.id,
      articleNumber: f1Regulations.articleNumber,
      articleTitle: f1Regulations.articleTitle,
      category: f1Regulations.category,
      simplifiedExplanation: f1Regulations.simplifiedExplanation,
      keyPoints: f1Regulations.keyPoints,
      relevanceScore: articleRegulations.relevanceScore,
      matchedKeywords: articleRegulations.matchedKeywords,
    })
    .from(articleRegulations)
    .innerJoin(f1Regulations, eq(articleRegulations.regulationId, f1Regulations.id))
    .where(eq(articleRegulations.articleId, articleId))
    .orderBy(desc(articleRegulations.relevanceScore));

  return results.map(r => ({
    id: r.id,
    articleNumber: r.articleNumber,
    articleTitle: r.articleTitle,
    category: r.category,
    simplifiedExplanation: r.simplifiedExplanation,
    keyPoints: r.keyPoints as string[] | null,
    relevanceScore: r.relevanceScore,
    matchedKeywords: r.matchedKeywords as string[] | null,
  }));
}

/**
 * Get a single regulation by article number
 */
export async function getRegulationByArticleNumber(
  articleNumber: string,
  seasonYear?: number
): Promise<F1Regulation | null> {
  const year = seasonYear || new Date().getFullYear();

  const [result] = await db
    .select()
    .from(f1Regulations)
    .where(
      and(
        eq(f1Regulations.articleNumber, articleNumber),
        eq(f1Regulations.seasonYear, year)
      )
    )
    .limit(1);

  return result as F1Regulation | null;
}

/**
 * Get a single regulation by ID
 */
export async function getRegulationById(id: string): Promise<F1Regulation | null> {
  const [result] = await db
    .select()
    .from(f1Regulations)
    .where(eq(f1Regulations.id, id))
    .limit(1);

  return result as F1Regulation | null;
}

/**
 * Get all regulations for a category
 */
export async function getRegulationsByCategory(
  category: 'sporting' | 'technical' | 'financial',
  seasonYear?: number
): Promise<F1Regulation[]> {
  const year = seasonYear || new Date().getFullYear();

  const results = await db
    .select()
    .from(f1Regulations)
    .where(
      and(
        eq(f1Regulations.category, category),
        eq(f1Regulations.seasonYear, year)
      )
    )
    .orderBy(f1Regulations.articleNumber);

  return results as F1Regulation[];
}

/**
 * Get all regulations for the current season
 */
export async function getAllRegulations(seasonYear?: number): Promise<F1Regulation[]> {
  const year = seasonYear || new Date().getFullYear();

  const results = await db
    .select()
    .from(f1Regulations)
    .where(eq(f1Regulations.seasonYear, year))
    .orderBy(f1Regulations.category, f1Regulations.articleNumber);

  return results as F1Regulation[];
}

/**
 * Search regulations by keyword or text
 */
export async function searchRegulations(
  query: string,
  category?: string,
  limit = 20
): Promise<F1Regulation[]> {
  const searchTerm = `%${query.toLowerCase()}%`;

  let whereClause = or(
    ilike(f1Regulations.articleTitle, searchTerm),
    ilike(f1Regulations.simplifiedExplanation, searchTerm),
    sql`${f1Regulations.keywords}::text ILIKE ${searchTerm}`
  );

  if (category) {
    whereClause = and(
      whereClause,
      eq(f1Regulations.category, category)
    );
  }

  const results = await db
    .select()
    .from(f1Regulations)
    .where(whereClause)
    .orderBy(f1Regulations.articleNumber)
    .limit(limit);

  return results as F1Regulation[];
}

/**
 * Get articles that reference a specific regulation
 */
export async function getArticlesForRegulation(
  regulationId: string,
  limit = 10
): Promise<Array<{ id: string; title: string; slug: string; publishedAt: Date | null }>> {
  const results = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      publishedAt: newsArticles.publishedAt,
    })
    .from(articleRegulations)
    .innerJoin(newsArticles, eq(articleRegulations.articleId, newsArticles.id))
    .where(eq(articleRegulations.regulationId, regulationId))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);

  return results;
}

// ===== AI MATCHING =====

interface MatchingResult {
  matches: RegulationMatch[];
  processingNotes: string;
}

/**
 * Uses AI to extract regulation references from an article
 */
export async function extractRegulationReferences(
  articleTitle: string,
  articleContent: string,
  availableRegulations: Array<{
    id: string;
    articleNumber: string;
    articleTitle: string;
    keywords: string[];
    simplifiedExplanation: string;
  }>
): Promise<MatchingResult> {
  if (!articleContent || articleContent.length < 100) {
    return { matches: [], processingNotes: 'Article content too short' };
  }

  // First do a quick keyword pre-filter to avoid unnecessary AI calls
  const contentLower = (articleTitle + ' ' + articleContent).toLowerCase();
  const potentialMatches = availableRegulations.filter(reg =>
    reg.keywords.some(kw => contentLower.includes(kw.toLowerCase()))
  );

  if (potentialMatches.length === 0) {
    return { matches: [], processingNotes: 'No keyword matches found' };
  }

  // Create a map for looking up IDs by article number
  const articleNumberToId = new Map(potentialMatches.map(r => [r.articleNumber, r.id]));

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a football regulations expert. Analyze this news article and identify which football regulations are relevant.

ARTICLE TITLE: ${articleTitle}

ARTICLE CONTENT:
${articleContent.substring(0, 3000)}${articleContent.length > 3000 ? '...[truncated]' : ''}

AVAILABLE REGULATIONS TO MATCH (use the exact articleNumber in your response):
${potentialMatches.map(r => `- articleNumber: "${r.articleNumber}"
  Title: ${r.articleTitle}
  Keywords: ${r.keywords.join(', ')}
  Summary: ${r.simplifiedExplanation.substring(0, 150)}...`).join('\n\n')}

INSTRUCTIONS:
1. Only match regulations that are GENUINELY relevant to what the article discusses
2. Relevance score (1-100):
   - 90-100: Article is primarily about this regulation
   - 70-89: Regulation is significantly discussed
   - 50-69: Regulation is tangentially relevant
   - Below 50: Don't include - not relevant enough
3. Be CONSERVATIVE - only include matches with score >= 50
4. Extract a brief context snippet from the article showing why this regulation is relevant
5. IMPORTANT: Use the EXACT articleNumber from the list above (e.g., "48.1", "57.4")

Return ONLY valid JSON (no markdown, no explanation):
{
  "matches": [
    {
      "articleNumber": "48.1",
      "relevanceScore": 85,
      "matchedKeywords": ["start procedure", "grid"],
      "contextSnippet": "exact quote from article...",
      "matchType": "direct"
    }
  ],
  "processingNotes": "any notes"
}

matchType options:
- "direct": Article explicitly mentions this rule/procedure
- "contextual": Article discusses topic covered by this regulation
- "ai_inferred": You inferred relevance based on football knowledge`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type !== 'text') {
      return { matches: [], processingNotes: 'Invalid AI response type' };
    }

    // Parse JSON response - handle potential markdown code blocks
    let jsonStr = text.text.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { matches: [], processingNotes: 'No JSON found in AI response' };
    }

    interface AIMatch {
      articleNumber: string;
      relevanceScore: number;
      matchedKeywords: string[];
      contextSnippet: string;
      matchType: 'direct' | 'contextual' | 'ai_inferred';
    }

    const parsed = JSON.parse(jsonMatch[0]) as { matches: AIMatch[]; processingNotes: string };

    // Map article numbers back to regulation IDs and filter valid matches
    const matches: RegulationMatch[] = parsed.matches
      .filter(m => m.relevanceScore >= 50)
      .map(m => {
        const regulationId = articleNumberToId.get(m.articleNumber);
        if (!regulationId) {
          console.warn(`Unknown articleNumber in AI response: ${m.articleNumber}`);
          return null;
        }
        return {
          regulationId,
          articleNumber: m.articleNumber,
          relevanceScore: m.relevanceScore,
          matchedKeywords: m.matchedKeywords,
          contextSnippet: m.contextSnippet,
          matchType: m.matchType,
        };
      })
      .filter((m): m is RegulationMatch => m !== null);

    return { matches, processingNotes: parsed.processingNotes };
  } catch (error) {
    console.error('Regulation matching failed:', error);
    return {
      matches: [],
      processingNotes: `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Process a batch of articles for regulation matching
 */
export async function processArticlesForRegulations(
  limit = 10
): Promise<{ processed: number; matched: number; results: Array<{ articleId: string; title: string; matchCount: number }> }> {
  // Get unprocessed articles
  const unprocessedArticles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      content: newsArticles.content,
    })
    .from(newsArticles)
    .where(isNull(newsArticles.regulationsProcessedAt))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);

  if (unprocessedArticles.length === 0) {
    return { processed: 0, matched: 0, results: [] };
  }

  // Get all regulations for matching
  const regulations = await db
    .select({
      id: f1Regulations.id,
      articleNumber: f1Regulations.articleNumber,
      articleTitle: f1Regulations.articleTitle,
      keywords: f1Regulations.keywords,
      simplifiedExplanation: f1Regulations.simplifiedExplanation,
    })
    .from(f1Regulations)
    .where(eq(f1Regulations.seasonYear, new Date().getFullYear()));

  const results: Array<{ articleId: string; title: string; matchCount: number }> = [];
  let totalMatched = 0;

  for (const article of unprocessedArticles) {
    // Extract regulation matches using AI
    const matchResult = await extractRegulationReferences(
      article.title,
      article.content || '',
      regulations as Array<{
        id: string;
        articleNumber: string;
        articleTitle: string;
        keywords: string[];
        simplifiedExplanation: string;
      }>
    );

    // Insert matches into junction table
    if (matchResult.matches.length > 0) {
      const inserts = matchResult.matches.map((match) => ({
        articleId: article.id,
        regulationId: match.regulationId,
        relevanceScore: match.relevanceScore,
        matchedKeywords: match.matchedKeywords,
        contextSnippet: match.contextSnippet,
        matchType: match.matchType,
      }));

      try {
        await db.insert(articleRegulations).values(inserts);
        totalMatched += matchResult.matches.length;
      } catch (error) {
        // Ignore duplicate key errors
        if (!(error instanceof Error && error.message.includes('duplicate'))) {
          console.error(`Failed to insert matches for article ${article.id}:`, error);
        }
      }
    }

    // Mark article as processed
    await db
      .update(newsArticles)
      .set({ regulationsProcessedAt: new Date() })
      .where(eq(newsArticles.id, article.id));

    results.push({
      articleId: article.id,
      title: article.title,
      matchCount: matchResult.matches.length,
    });
  }

  return {
    processed: results.length,
    matched: totalMatched,
    results,
  };
}

// ===== LIVE INCIDENT DETECTION =====

export interface LiveIncident {
  id: string;
  raceId: string;
  sessionType: string;
  incidentType: string;
  description: string;
  drivers: string[] | null;
  teams: string[] | null;
  lap: number | null;
  turn: string | null;
  status: string;
  decision: string | null;
  penaltyType: string | null;
  penaltyDetails: string | null;
  matchedRegulations: Array<{ regulationId: string; articleNumber: string; relevance: number }> | null;
  occurredAt: Date;
  resolvedAt: Date | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
}

/**
 * Detect if a news article describes a live incident during a race session
 */
export async function detectIncidentFromArticle(
  articleTitle: string,
  articleContent: string,
  publishedAt: Date
): Promise<{ isIncident: boolean; incident?: Partial<LiveIncident> }> {
  // Incident keywords to detect
  const incidentKeywords = [
    'investigation', 'stewards', 'penalty', 'collision', 'crash',
    'incident', 'infringement', 'unsafe release', 'track limits',
    'impeding', 'blocking', 'yellow flag', 'red flag', 'safety car',
    'under investigation', 'noted', 'no further action', 'warning',
    'time penalty', 'grid penalty', 'disqualified', 'black flag'
  ];

  const text = `${articleTitle} ${articleContent}`.toLowerCase();
  const hasIncidentKeyword = incidentKeywords.some(kw => text.includes(kw));

  if (!hasIncidentKeyword) {
    return { isIncident: false };
  }

  // Use AI to extract incident details
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Analyze this football news to determine if it describes a live match incident.

TITLE: ${articleTitle}

CONTENT:
${articleContent.substring(0, 2000)}

If this is about a CURRENT race incident (not historical), extract:
1. incidentType: collision, track_limits, unsafe_release, impeding, speeding, technical_infringement, other
2. description: Brief description of what happened
3. drivers: Array of driver codes involved (e.g., ["VER", "HAM"])
4. teams: Array of team names involved
5. lap: Lap number if mentioned
6. turn: Turn number/name if mentioned
7. status: noted, under_investigation, no_action, penalty_applied
8. penaltyType: time_penalty, grid_penalty, warning, disqualification, reprimand, fine, or null
9. penaltyDetails: Specific penalty details if known (e.g., "5 second time penalty")

Return ONLY JSON:
{"isIncident": true/false, "incident": {...} or null}`
      }
    ]
  });

  try {
    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.isIncident && parsed.incident) {
          return {
            isIncident: true,
            incident: {
              ...parsed.incident,
              occurredAt: publishedAt,
              sourceType: 'news',
            }
          };
        }
      }
    }
  } catch (e) {
    console.error('Error parsing incident detection response:', e);
  }

  return { isIncident: false };
}

/**
 * Create a live incident and auto-match relevant regulations
 */
export async function createLiveIncident(
  raceId: string,
  sessionType: string,
  incidentData: Partial<LiveIncident>
): Promise<LiveIncident | null> {
  // Get relevant regulations for this incident
  const matchedRegs = await findRegulationsForIncident(
    incidentData.incidentType || '',
    incidentData.description || '',
    incidentData.penaltyType || null
  );

  const [incident] = await db.insert(liveIncidents).values({
    raceId,
    sessionType,
    incidentType: incidentData.incidentType || 'other',
    description: incidentData.description || '',
    drivers: incidentData.drivers || null,
    teams: incidentData.teams || null,
    lap: incidentData.lap || null,
    turn: incidentData.turn || null,
    status: incidentData.status || 'under_investigation',
    decision: incidentData.decision || null,
    penaltyType: incidentData.penaltyType || null,
    penaltyDetails: incidentData.penaltyDetails || null,
    matchedRegulations: matchedRegs,
    occurredAt: incidentData.occurredAt || new Date(),
    sourceType: incidentData.sourceType || 'news',
    sourceUrl: incidentData.sourceUrl || null,
  }).returning();

  return incident as LiveIncident;
}

/**
 * Find regulations relevant to a specific incident type
 */
export async function findRegulationsForIncident(
  incidentType: string,
  description: string,
  penaltyType: string | null
): Promise<Array<{ regulationId: string; articleNumber: string; relevance: number }>> {
  // Map incident types to likely regulation keywords
  const incidentKeywordMap: Record<string, string[]> = {
    collision: ['collision', 'contact', 'causing a collision', 'driving standards'],
    track_limits: ['track limits', 'leaving the track', 'gaining advantage'],
    unsafe_release: ['unsafe release', 'pit lane', 'pit stop'],
    impeding: ['impeding', 'unnecessarily slow', 'blocking'],
    speeding: ['speed limit', 'pit lane', 'speeding'],
    technical_infringement: ['technical', 'car specification', 'scrutineering'],
  };

  const keywords = incidentKeywordMap[incidentType] || [incidentType];
  const searchQuery = [...keywords, description].join(' ');

  // Search for relevant regulations
  const results = await searchRegulations(searchQuery, undefined, 5);

  // If we have a penalty type, also search by that
  if (penaltyType) {
    const penaltyResults = await db
      .select()
      .from(f1Regulations)
      .where(
        sql`${f1Regulations.penaltyTypes}::text ILIKE ${'%' + penaltyType + '%'}`
      )
      .limit(3);

    // Combine results
    const combinedIds = new Set(results.map(r => r.id));
    for (const reg of penaltyResults) {
      if (!combinedIds.has(reg.id)) {
        results.push(reg as F1Regulation);
      }
    }
  }

  return results.slice(0, 5).map((reg, index) => ({
    regulationId: reg.id,
    articleNumber: reg.articleNumber,
    relevance: 100 - (index * 15), // Decrease relevance by position
  }));
}

/**
 * Get live incidents for a race
 */
export async function getLiveIncidents(
  raceId: string,
  sessionType?: string
): Promise<LiveIncident[]> {
  let query = db
    .select()
    .from(liveIncidents)
    .where(eq(liveIncidents.raceId, raceId));

  if (sessionType) {
    query = db
      .select()
      .from(liveIncidents)
      .where(and(
        eq(liveIncidents.raceId, raceId),
        eq(liveIncidents.sessionType, sessionType)
      ));
  }

  const incidents = await query.orderBy(desc(liveIncidents.occurredAt));
  return incidents as LiveIncident[];
}

/**
 * Get current race session (if any race is happening now)
 */
export async function getCurrentRaceSession(): Promise<{
  raceId: string;
  raceName: string;
  isLive: boolean;
} | null> {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  // Find race happening around now
  const [currentRace] = await db
    .select({
      id: races.id,
      name: races.name,
      raceDatetime: races.raceDatetime,
    })
    .from(races)
    .where(and(
      gte(races.raceDatetime, twoHoursAgo),
      sql`${races.raceDatetime} <= ${fourHoursFromNow}`
    ))
    .limit(1);

  if (!currentRace) return null;

  const raceTime = new Date(currentRace.raceDatetime);
  const isLive = now >= twoHoursAgo && now <= new Date(raceTime.getTime() + 3 * 60 * 60 * 1000);

  return {
    raceId: currentRace.id,
    raceName: currentRace.name,
    isLive,
  };
}

/**
 * Smart regulation lookup - natural language query
 */
export async function smartRegulationLookup(
  query: string
): Promise<{ regulations: F1Regulation[]; explanation: string }> {
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `You're a football regulations expert. A fan asks: "${query}"

Identify the most relevant football regulation search terms to answer this.
Return JSON: {"searchTerms": ["term1", "term2"], "explanation": "Brief explanation of what rules apply"}`
      }
    ]
  });

  let searchTerms: string[] = [query];
  let explanation = '';

  try {
    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        searchTerms = parsed.searchTerms || [query];
        explanation = parsed.explanation || '';
      }
    }
  } catch (e) {
    console.error('Error parsing smart lookup response:', e);
  }

  // Search using the extracted terms
  const regulations = await searchRegulations(searchTerms.join(' '), undefined, 10);

  return { regulations, explanation };
}
