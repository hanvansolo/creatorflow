// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import type { CredibilityRating } from '@/types';

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

/**
 * Uses AI to rate an article's credibility based on title and content.
 * Returns one of: verified, unverified, clickbait, opinion, rumour
 */
export async function rateCredibility(
  title: string,
  content: string,
  sourceName: string
): Promise<CredibilityRating> {
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Rate this football news article's credibility. Respond with ONLY one word from these options: verified, unverified, clickbait, opinion, rumour

Rules:
- "verified" = factual reporting with quotes/data from official sources, press conferences, or team statements
- "unverified" = news that seems factual but source/claims are not confirmed
- "clickbait" = sensational/misleading headline that exaggerates or doesn't match content
- "opinion" = editorial, analysis, or opinion piece
- "rumour" = based on unnamed sources, speculation, or "reportedly"

Source: ${sourceName}
Title: ${title}
Content: ${content.slice(0, 500)}

Rating:`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type !== 'text') return 'unverified';

    const rating = text.text.trim().toLowerCase() as CredibilityRating;
    const validRatings: CredibilityRating[] = ['verified', 'unverified', 'clickbait', 'opinion', 'rumour'];

    return validRatings.includes(rating) ? rating : 'unverified';
  } catch (error) {
    console.error('Credibility rating failed:', error);
    return 'unverified';
  }
}

/**
 * Simple heuristic-based credibility rating that doesn't require AI.
 * Used as fallback when ANTHROPIC_API_KEY is not set.
 */
export function rateCredibilityHeuristic(
  title: string,
  content: string,
  sourceName: string
): CredibilityRating {
  const titleLower = title.toLowerCase();
  const contentLower = (content || '').toLowerCase();

  // Official sources are more likely verified
  const officialSources = ['premierleague.com', 'bbc sport football', 'bbc', 'sky sports', 'skysports', 'uefa.com', 'fifa.com', 'theguardian'];
  if (officialSources.some(s => sourceName.toLowerCase().includes(s))) {
    return 'verified';
  }

  // Clickbait indicators
  const clickbaitPatterns = [
    /\bshock(ing|ed)?\b/i,
    /\bbombshell\b/i,
    /you won't believe/i,
    /\bsensational\b/i,
    /\bexclusive\b/i,
    /\!\s*$/,
    /\?\s*$/,
  ];
  if (clickbaitPatterns.some(p => p.test(title))) {
    return 'clickbait';
  }

  // Rumour indicators
  const rumourPatterns = [
    /\breportedly\b/i,
    /\brumour/i,
    /\brumor/i,
    /\baccording to sources\b/i,
    /\bunnamed sources?\b/i,
    /\balleged(ly)?\b/i,
    /\bcould\b.*\bmove\b/i,
    /\bset to\b/i,
    /\btipped to\b/i,
  ];
  if (rumourPatterns.some(p => p.test(titleLower) || p.test(contentLower.slice(0, 300)))) {
    return 'rumour';
  }

  // Opinion indicators
  const opinionPatterns = [
    /\bopinion\b/i,
    /\banalysis\b/i,
    /\bcommentary\b/i,
    /\beditorial\b/i,
    /\bi think\b/i,
    /\bcolumn\b/i,
    /\branking\b/i,
    /\brated\b/i,
  ];
  if (opinionPatterns.some(p => p.test(titleLower) || p.test(contentLower.slice(0, 300)))) {
    return 'opinion';
  }

  return 'unverified';
}
