// @ts-nocheck
import OpenAI from 'openai';

// Lazy initialization of OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface TestingUpdate {
  team: string;
  teamSlug: string;
  performance: 'strong' | 'average' | 'weak';
  reliability: 'good' | 'issues' | 'major_problems';
  lapTimeRanking: number; // 1-11
  notes: string;
}

export interface DriverUpdate {
  driverCode: string;
  adaptation: 'excellent' | 'good' | 'struggling';
  notes: string;
}

export interface AnalysisResult {
  timestamp: Date;
  source: string;
  teamUpdates: TestingUpdate[];
  driverUpdates: DriverUpdate[];
  summary: string;
  explanation: string; // Detailed human-readable explanation
  confidenceAdjustments: Record<string, number>; // teamSlug -> adjustment (-0.2 to +0.2)
}

/**
 * Analyze football news/match report and extract relevant information
 */
export async function analyzeF1Content(content: string, source: string): Promise<AnalysisResult> {
  const systemPrompt = `You are a football analyst. Analyze the provided football news or match report and extract:

1. Team performance updates (pace, reliability, development direction)
2. Driver adaptation to new cars (especially for new team pairings)
3. Any concerns or standout performances

For the 2026 season, the teams are:
- Red Bull (red-bull): Verstappen, Hadjar
- McLaren (mclaren): Norris, Piastri
- Ferrari (ferrari): Leclerc, Hamilton
- Mercedes (mercedes): Russell, Antonelli
- Aston Martin (aston-martin): Alonso, Stroll
- Alpine (alpine): Gasly, Colapinto
- Williams (williams): Sainz, Albon
- Racing Bulls (racing-bulls): Lawson, Lindblad
- Audi (audi): Hulkenberg, Bortoleto
- Haas (haas): Ocon, Bearman
- Cadillac (cadillac): Perez, Bottas

Respond in JSON format with this structure:
{
  "teamUpdates": [
    {
      "team": "Team Name",
      "teamSlug": "team-slug",
      "performance": "strong|average|weak",
      "reliability": "good|issues|major_problems",
      "lapTimeRanking": 1-11,
      "notes": "Brief notes"
    }
  ],
  "driverUpdates": [
    {
      "driverCode": "VER",
      "adaptation": "excellent|good|struggling",
      "notes": "Brief notes"
    }
  ],
  "summary": "One paragraph summary of key findings",
  "explanation": "A detailed 2-3 paragraph explanation written for fans. Explain what the news means for the championship, which teams are looking strong or weak, any driver storylines, and what to watch for in upcoming races. Write in an engaging, informative style.",
  "confidenceAdjustments": {
    "team-slug": 0.1 // adjustment from -0.2 to +0.2
  }
}

If the content doesn't contain football performance information, return empty arrays and a summary explaining why.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this football content:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      timestamp: new Date(),
      source,
      teamUpdates: result.teamUpdates || [],
      driverUpdates: result.driverUpdates || [],
      summary: result.summary || 'No relevant information found',
      explanation: result.explanation || 'No detailed explanation available.',
      confidenceAdjustments: result.confidenceAdjustments || {},
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      timestamp: new Date(),
      source,
      teamUpdates: [],
      driverUpdates: [],
      summary: 'Analysis failed',
      explanation: 'Unable to generate analysis at this time.',
      confidenceAdjustments: {},
    };
  }
}

/**
 * Fetch and analyze latest football news from multiple sources
 */
export async function fetchAndAnalyzeF1News(): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Fetch from football RSS feeds and news sources
  const sources = [
    { url: 'https://www.formula1.com/en/latest/all', name: 'Formula1.com' },
    { url: 'https://www.autosport.com/f1/news/', name: 'Autosport' },
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'FootyFeed/1.0' },
      });

      if (response.ok) {
        const html = await response.text();
        // Extract main content (simplified - in production use proper HTML parsing)
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 8000); // Limit content length

        const analysis = await analyzeF1Content(textContent, source.name);
        results.push(analysis);
      }
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error);
    }
  }

  return results;
}

/**
 * Generate AI-powered prediction insights
 */
export async function generatePredictionInsights(
  raceName: string,
  circuitName: string,
  predictions: Array<{ driverCode: string; position: number; teamName: string }>
): Promise<string> {
  const predictionList = predictions
    .slice(0, 10)
    .map((p, i) => `${i + 1}. ${p.driverCode} (${p.teamName})`)
    .join('\n');

  const prompt = `For the ${raceName} at ${circuitName}, here are the predicted top 10:

${predictionList}

Write a brief (2-3 sentences) analysis of these predictions, considering:
- Circuit characteristics
- Team/driver strengths that match this circuit
- Any interesting battles to watch

Keep it concise and insightful.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a football analyst providing brief, insightful match predictions.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('AI insights error:', error);
    return '';
  }
}

/**
 * Generate AI race debrief after a race is completed
 */
export interface RaceDebriefInput {
  raceName: string;
  circuitName: string;
  results: Array<{
    position: number;
    driverCode: string;
    driverName: string;
    teamName: string;
    gridPosition: number;
    points: number;
    status: string;
    fastestLap: boolean;
  }>;
  predictions: Array<{
    driverCode: string;
    predictedPosition: number;
  }>;
}

export interface RaceDebriefResult {
  summary: string;
  keyMoments: string[];
  driverGrades: Record<string, { grade: string; reason: string }>;
  strategyNotes: string;
}

export async function generateRaceDebrief(input: RaceDebriefInput): Promise<RaceDebriefResult> {
  const resultsText = input.results
    .map(r => `P${r.position} ${r.driverCode} (${r.teamName}) - Grid: P${r.gridPosition}, Points: ${r.points}${r.fastestLap ? ', Fastest Lap' : ''}${r.status !== 'Finished' ? `, ${r.status}` : ''}`)
    .join('\n');

  const predictionsText = input.predictions
    .slice(0, 10)
    .map(p => `P${p.predictedPosition}: ${p.driverCode}`)
    .join(', ');

  const prompt = `Analyze this football match and generate a debrief.

Race: ${input.raceName} at ${input.circuitName}

RESULTS:
${resultsText}

OUR PREDICTIONS (top 10): ${predictionsText}

Generate a JSON response with:
{
  "summary": "A 2-3 sentence race summary highlighting the winner, key storyline, and championship implications",
  "keyMoments": ["Array of 4-6 key moments from the race, each 1-2 sentences. Infer likely incidents from position changes, DNFs, and grid-to-finish deltas"],
  "driverGrades": {
    "VER": { "grade": "A", "reason": "Brief reason for grade based on grid vs finish, overtakes, consistency" }
  },
  "strategyNotes": "A paragraph analyzing likely strategy decisions based on position changes through the field"
}

Grade drivers A+ through F based on:
- Finishing position vs grid position (gaining places = good)
- Points scored relative to expectations
- DNF/incidents (lower grade unless clearly not their fault)
Only grade the top 15 finishers plus any notable DNFs.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert football analyst writing a post-match debrief. Be specific, insightful, and engaging. Focus on what the data reveals about each player\'s performance.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      summary: result.summary || '',
      keyMoments: result.keyMoments || [],
      driverGrades: result.driverGrades || {},
      strategyNotes: result.strategyNotes || '',
    };
  } catch (error) {
    console.error('Race debrief generation error:', error);
    return {
      summary: '',
      keyMoments: [],
      driverGrades: {},
      strategyNotes: '',
    };
  }
}
