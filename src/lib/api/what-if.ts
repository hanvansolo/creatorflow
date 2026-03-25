import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { whatIfScenarios, drivers, teams, driverStandings, constructorStandings, seasons } from '@/lib/db/schema';
import { eq, desc, asc, ilike, sql } from 'drizzle-orm';

/**
 * Simple slugify function to avoid external dependency
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 100); // Limit length
}

// Initialize Anthropic client lazily to ensure env vars are loaded
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey: apiKey.trim() });
}

interface KeyFactor {
  factor: string;
  impact: string;
}

interface AlternativeOutcome {
  scenario: string;
  probability: string;
  reasoning: string;
}

interface WhatIfResponse {
  shortAnswer: string;
  detailedAnalysis: string;
  keyFactors: KeyFactor[];
  alternativeOutcomes: AlternativeOutcome[];
  confidenceLevel: 'high' | 'medium' | 'low' | 'speculative';
  scenarioType: 'driver_transfer' | 'historical' | 'regulation' | 'championship';
}

/**
 * Classify the type of What If scenario
 */
function classifyScenario(question: string): WhatIfResponse['scenarioType'] {
  const lower = question.toLowerCase();

  if (lower.includes('transfer') || lower.includes('moved to') || lower.includes('joined') || lower.includes('signed')) {
    return 'driver_transfer';
  }
  if (lower.includes('had') || lower.includes('won') || lower.includes('happened') || lower.includes('history')) {
    return 'historical';
  }
  if (lower.includes('rule') || lower.includes('regulation') || lower.includes('ban') || lower.includes('change')) {
    return 'regulation';
  }
  return 'championship';
}

/**
 * Generate a slug from a question
 */
function generateSlug(question: string): string {
  // Take first ~60 chars and make it a slug
  const truncated = question.slice(0, 60).trim();
  return slugify(truncated);
}

/**
 * Get current football context for the AI
 */
async function getF1Context() {
  // Get current season
  const [currentSeason] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isCurrent, true))
    .limit(1);

  // Get current driver standings
  const driverStandingsData = currentSeason
    ? await db
        .select({
          position: driverStandings.position,
          points: driverStandings.points,
          driverFirstName: drivers.firstName,
          driverLastName: drivers.lastName,
          driverCode: drivers.code,
          teamName: teams.name,
        })
        .from(driverStandings)
        .leftJoin(drivers, eq(driverStandings.driverId, drivers.id))
        .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
        .where(eq(driverStandings.seasonId, currentSeason.id))
        .orderBy(asc(driverStandings.position))
        .limit(10)
    : [];

  // Get constructor standings
  const constructorStandingsData = currentSeason
    ? await db
        .select({
          position: constructorStandings.position,
          points: constructorStandings.points,
          teamName: teams.name,
        })
        .from(constructorStandings)
        .leftJoin(teams, eq(constructorStandings.teamId, teams.id))
        .where(eq(constructorStandings.seasonId, currentSeason.id))
        .orderBy(asc(constructorStandings.position))
        .limit(10)
    : [];

  const standingsText = driverStandingsData.length > 0
    ? driverStandingsData.map(d => `${d.position}. ${d.driverFirstName} ${d.driverLastName} (${d.teamName}) - ${d.points}pts`).join('\n')
    : 'Standings not yet available';

  const constructorText = constructorStandingsData.length > 0
    ? constructorStandingsData.map(c => `${c.position}. ${c.teamName} - ${c.points}pts`).join('\n')
    : 'Standings not yet available';

  return { standingsText, constructorText, year: currentSeason?.year || 2026 };
}

/**
 * Generate a What If analysis using AI
 */
export async function generateWhatIfAnalysis(question: string): Promise<WhatIfResponse | null> {
  console.log('[What-If] Starting analysis for:', question);
  console.log('[What-If] Fetching football context...');
  const context = await getF1Context();
  console.log('[What-If] Context fetched:', { year: context.year });

  const scenarioType = classifyScenario(question);
  console.log('[What-If] Scenario type:', scenarioType);

  try {
    console.log('[What-If] Calling Anthropic API...');
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are an expert football analyst answering hypothetical "What If" questions from fans. Your analysis should be thoughtful, entertaining, and grounded in football knowledge.

CURRENT ${context.year} DRIVER STANDINGS:
${context.standingsText}

CURRENT ${context.year} CONSTRUCTOR STANDINGS:
${context.constructorText}

WHAT IF QUESTION: "${question}"

Analyze this hypothetical scenario and respond in the following JSON format:

{
  "shortAnswer": "A 1-2 sentence punchy answer that directly addresses the question",
  "detailedAnalysis": "A 2-3 paragraph detailed analysis exploring the scenario, its implications, and the reasoning behind your conclusions. Be engaging and insightful.",
  "keyFactors": [
    {"factor": "Key consideration", "impact": "How this factor influences the outcome"}
  ],
  "alternativeOutcomes": [
    {"scenario": "Alternative possibility", "probability": "Likely/Possible/Unlikely", "reasoning": "Brief explanation"}
  ],
  "confidenceLevel": "high/medium/low/speculative"
}

Guidelines:
- For historical scenarios, use actual football history as context
- For transfer scenarios, consider team dynamics, car performance, and driver strengths
- For championship scenarios, analyze point differentials and remaining races
- For regulation scenarios, consider precedents and potential ripple effects
- Be bold with predictions but acknowledge uncertainty
- Make it entertaining while being analytically sound

Respond ONLY with valid JSON, no markdown code blocks:`,
        },
      ],
    });

    console.log('[What-If] API call successful, processing response...');

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      console.error('[What-If] Unexpected response type from Anthropic:', textContent.type);
      return null;
    }

    console.log('[What-If] Response text length:', textContent.text.length);

    // Try to parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(textContent.text.trim()) as Omit<WhatIfResponse, 'scenarioType'>;
      console.log('[What-If] Successfully parsed JSON response');
    } catch (parseError) {
      console.error('[What-If] Failed to parse AI response as JSON');
      console.error('[What-If] Parse error:', parseError);
      console.error('[What-If] Response text (first 500 chars):', textContent.text.slice(0, 500));
      return null;
    }

    return { ...analysis, scenarioType };
  } catch (error) {
    console.error('[What-If] Failed to generate analysis:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('[What-If] Error name:', error.name);
      console.error('[What-If] Error message:', error.message);
      if (error.stack) {
        console.error('[What-If] Error stack:', error.stack);
      }
    }
    // Check if it's an API key issue
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[What-If] ANTHROPIC_API_KEY is not set!');
    } else {
      console.error('[What-If] API key length:', apiKey.length);
      console.error('[What-If] API key prefix:', apiKey.substring(0, 10) + '...');
    }
    return null;
  }
}

/**
 * Check if a similar scenario already exists
 */
export async function findSimilarScenario(question: string) {
  try {
    // Simple keyword matching - could be enhanced with semantic search
    const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const searchTerms = words.slice(0, 5);

    for (const term of searchTerms) {
      const [existing] = await db
        .select()
        .from(whatIfScenarios)
        .where(ilike(whatIfScenarios.question, `%${term}%`))
        .limit(1);

      if (existing) {
        return existing;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to find similar scenario:', error);
    return null;
  }
}

/**
 * Save a What If scenario to the database
 */
export async function saveWhatIfScenario(
  question: string,
  analysis: WhatIfResponse,
  generationType: 'pre_generated' | 'on_demand' = 'on_demand'
) {
  const slug = generateSlug(question);

  // Check if slug already exists
  const [existing] = await db
    .select()
    .from(whatIfScenarios)
    .where(eq(whatIfScenarios.slug, slug))
    .limit(1);

  if (existing) {
    // Return existing scenario
    return existing;
  }

  // Extract tags from the question
  const tags = question
    .toLowerCase()
    .match(/\b(hamilton|verstappen|leclerc|norris|alonso|sainz|russell|perez|red bull|ferrari|mercedes|mclaren|aston martin|williams|alpine|sauber|haas|rb)\b/gi)
    ?.filter((v, i, a) => a.indexOf(v) === i) || [];

  const [newScenario] = await db
    .insert(whatIfScenarios)
    .values({
      question,
      slug,
      scenarioType: analysis.scenarioType,
      shortAnswer: analysis.shortAnswer,
      detailedAnalysis: analysis.detailedAnalysis,
      keyFactors: analysis.keyFactors,
      alternativeOutcomes: analysis.alternativeOutcomes,
      confidenceLevel: analysis.confidenceLevel,
      generationType,
      tags,
    })
    .returning();

  return newScenario;
}

/**
 * Get or generate a What If scenario
 */
export async function getOrGenerateWhatIf(question: string) {
  try {
    // First check for existing similar scenario
    const existing = await findSimilarScenario(question);
    if (existing) {
      // Increment view count
      try {
        await db
          .update(whatIfScenarios)
          .set({ viewCount: sql`${whatIfScenarios.viewCount} + 1` })
          .where(eq(whatIfScenarios.id, existing.id));
      } catch (e) {
        console.error('Failed to increment view count:', e);
      }

      return { scenario: existing, isNew: false };
    }

    // Generate new analysis
    console.log('Generating new What If analysis for:', question);
    const analysis = await generateWhatIfAnalysis(question);
    if (!analysis) {
      console.error('generateWhatIfAnalysis returned null');
      return null;
    }

    console.log('Saving What If scenario...');
    const scenario = await saveWhatIfScenario(question, analysis, 'on_demand');
    return { scenario, isNew: true };
  } catch (error) {
    console.error('getOrGenerateWhatIf failed:', error);
    return null;
  }
}

/**
 * Get popular What If scenarios
 */
export async function getPopularScenarios(limit: number = 10) {
  try {
    const scenarios = await db
      .select()
      .from(whatIfScenarios)
      .orderBy(desc(whatIfScenarios.viewCount))
      .limit(limit);

    return scenarios;
  } catch (error) {
    console.error('Failed to fetch popular scenarios:', error);
    return [];
  }
}

/**
 * Get recent What If scenarios
 */
export async function getRecentScenarios(limit: number = 10) {
  try {
    const scenarios = await db
      .select()
      .from(whatIfScenarios)
      .orderBy(desc(whatIfScenarios.createdAt))
      .limit(limit);

    return scenarios;
  } catch (error) {
    console.error('Failed to fetch recent scenarios:', error);
    return [];
  }
}

/**
 * Get What If scenario by slug
 */
export async function getScenarioBySlug(slug: string) {
  const [scenario] = await db
    .select()
    .from(whatIfScenarios)
    .where(eq(whatIfScenarios.slug, slug))
    .limit(1);

  if (scenario) {
    // Increment view count
    await db
      .update(whatIfScenarios)
      .set({ viewCount: sql`${whatIfScenarios.viewCount} + 1` })
      .where(eq(whatIfScenarios.id, scenario.id));
  }

  return scenario || null;
}

/**
 * Get scenarios by type
 */
export async function getScenariosByType(type: string, limit: number = 10) {
  const scenarios = await db
    .select()
    .from(whatIfScenarios)
    .where(eq(whatIfScenarios.scenarioType, type))
    .orderBy(desc(whatIfScenarios.viewCount))
    .limit(limit);

  return scenarios;
}

/**
 * Mark a scenario as popular (for curated lists)
 */
export async function markAsPopular(id: string, isPopular: boolean = true) {
  await db
    .update(whatIfScenarios)
    .set({ isPopular, updatedAt: new Date() })
    .where(eq(whatIfScenarios.id, id));
}

/**
 * Pre-generate some popular What If scenarios
 */
export async function preGeneratePopularScenarios() {
  const popularQuestions = [
    "What if Mbappe had stayed at PSG instead of moving to Real Madrid?",
    "What if VAR was removed from football entirely?",
    "What if Messi had joined Manchester City in 2021?",
    "What if the offside rule was abolished in football?",
    "What if the Champions League used a round-robin format instead of groups?",
    "What if every Premier League match had extra time instead of draws?",
    "What if Haaland joined Barcelona alongside Yamal?",
    "What if the back-pass rule was never introduced?",
    "What if the salary cap was set at $100 million for all clubs?",
    "What if academy players were required to spend 3 years in youth leagues?",
  ];

  const results: { question: string; success: boolean }[] = [];

  for (const question of popularQuestions) {
    const existing = await findSimilarScenario(question);
    if (existing) {
      results.push({ question, success: true });
      continue;
    }

    const analysis = await generateWhatIfAnalysis(question);
    if (analysis) {
      await saveWhatIfScenario(question, analysis, 'pre_generated');
      await markAsPopular(generateSlug(question), true);
      results.push({ question, success: true });
    } else {
      results.push({ question, success: false });
    }

    // Small delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}
