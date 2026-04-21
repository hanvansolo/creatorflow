import OpenAI from 'openai';

// Lazy-load OpenAI client
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Override with SPINNER_MODEL=gpt-4o for higher-quality rewrites at ~10x cost.
const SPINNER_MODEL = process.env.SPINNER_MODEL || 'gpt-4o-mini';

export interface SpunArticle {
  title: string;
  summary: string;
  content: string;
}

export type SpinFailureReason =
  | 'source_too_thin'
  | 'api_error'
  | 'parse_error'
  | 'output_too_short'
  | 'output_too_similar';

export class SpinError extends Error {
  constructor(message: string, public readonly reason: SpinFailureReason) {
    super(message);
    this.name = 'SpinError';
  }
}

// Publish-gate thresholds — AdSense flags thin/duplicate content.
const MIN_SOURCE_WORDS = 80;
const MIN_OUTPUT_WORDS = 500;
const MAX_SIMILARITY = 0.6;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Jaccard similarity on 5-word shingles — catches lazy rewrites that keep
// long phrases verbatim from the source.
function shingleSimilarity(a: string, b: string): number {
  const shingles = (text: string) => {
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    const set = new Set<string>();
    for (let i = 0; i <= words.length - 5; i++) {
      set.add(words.slice(i, i + 5).join(' '));
    }
    return set;
  };
  const sa = shingles(a);
  const sb = shingles(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let overlap = 0;
  for (const s of sa) if (sb.has(s)) overlap++;
  const union = sa.size + sb.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

async function callSpinner(prompt: string, attempts = 2): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await getOpenAI().chat.completions.create({
        model: SPINNER_MODEL,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from OpenAI');
      return text;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw new SpinError(
    `OpenAI API failed after ${attempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    'api_error'
  );
}

function parseSpinOutput(text: string): SpunArticle {
  const titleMatch = text.match(/---TITLE---\s*([\s\S]*?)\s*---SUMMARY---/);
  const summaryMatch = text.match(/---SUMMARY---\s*([\s\S]*?)\s*---CONTENT---/);
  const contentMatch = text.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);
  if (!titleMatch || !summaryMatch || !contentMatch) {
    throw new SpinError('Could not extract all fields from spinner response', 'parse_error');
  }
  return {
    title: titleMatch[1].trim(),
    summary: summaryMatch[1].trim(),
    content: contentMatch[1].trim(),
  };
}

export async function spinArticle(
  originalTitle: string,
  originalContent: string,
  originalSummary?: string
): Promise<SpunArticle> {
  const currentYear = new Date().getFullYear();
  const source = originalContent || originalSummary || '';
  const sourceWords = countWords(source);

  if (sourceWords < MIN_SOURCE_WORDS) {
    throw new SpinError(
      `Source too thin to spin meaningfully (${sourceWords} words, need ${MIN_SOURCE_WORDS})`,
      'source_too_thin'
    );
  }

  const prompt = `You are a senior football/soccer journalist producing original, publication-ready analysis for a news site that must pass Google AdSense quality review. Transform the source below into a substantively original article — not a reworded copy.

CURRENT DATE CONTEXT: The current year is ${currentYear}. All references to "this season", "upcoming", "next year" etc. should be relative to ${currentYear}.

LEAD WITH THE NEWS: First sentence = the key development. No throat-clearing.

CRITICAL ACCURACY RULES — NON-NEGOTIABLE:
- ONLY include facts, quotes, names, dates, scores, and statistics EXPLICITLY stated in the original
- NEVER invent quotes, statistics, or events not present in the original
- NEVER change club names, player names, manager names, or affiliations
- NEVER change years, dates, transfer fees, scores, or numbers
- Do not add information you cannot justify from the source

ORIGINALITY RULES (critical for AdSense compliance):
- Do NOT copy any sentence or phrase of 5+ consecutive words from the source verbatim
- Completely restructure the narrative: different opening angle, different paragraph order, different transitions
- Add genuine editorial value using football knowledge: tactical context, historical context (prior meetings, form, precedent), competitive implications (title race, relegation, European qualification), and fan-relevant analysis
- Frame the story with a clear editorial angle, not a neutral wire restatement
- NEVER reference the original source, author, or publication. Write as if you are the original reporter.
- NEVER include "according to [source]" or "as reported by"

WRITING RULES:
- 600-900 words minimum in the body. Shorter output will be rejected.
- Use 2-3 H2-style subheadings (plain text on their own line) to structure the piece
- Lead paragraph must be a fresh hook, not a rephrase of the source's first sentence
- Professional football journalism tone — engaging but not sensational
- Keep ALL direct quotes from the original — they add length naturally
- Cut filler phrases: "it remains to be seen", "time will tell", "as we know"
- Headline under 48 characters, punchy, no clickbait
- Summary: 2-3 sentences capturing the core story and why it matters
- Do not include any disclaimers, meta-commentary, or references to "this article" / "the original"

Source Title: ${originalTitle}

Source Article:
${source}

Respond using this exact format with the delimiters (no other text before or after):

---TITLE---
Your new headline here
---SUMMARY---
Your 2-3 sentence summary here
---CONTENT---
Your full rewritten article here
---END---`;

  const text = await callSpinner(prompt);
  const result = parseSpinOutput(text);

  const outputWords = countWords(result.content);
  if (outputWords < MIN_OUTPUT_WORDS) {
    throw new SpinError(
      `Spun article too short (${outputWords} words, need ${MIN_OUTPUT_WORDS})`,
      'output_too_short'
    );
  }

  const similarity = shingleSimilarity(source, result.content);
  if (similarity > MAX_SIMILARITY) {
    throw new SpinError(
      `Spun article too similar to source (${similarity.toFixed(2)} overlap, max ${MAX_SIMILARITY})`,
      'output_too_similar'
    );
  }

  return result;
}

/**
 * Extract key information from an article, remove fluff, and rewrite concisely.
 * Used for reprocessing existing seeded articles.
 */
export async function extractAndSpin(
  originalTitle: string,
  originalContent: string,
  originalSummary?: string
): Promise<SpunArticle> {
  const currentYear = new Date().getFullYear();
  const sourceText = originalContent || originalSummary || '';
  const sourceWords = countWords(sourceText);

  if (sourceWords < MIN_SOURCE_WORDS) {
    throw new SpinError(
      `Source too thin to extract (${sourceWords} words, need ${MIN_SOURCE_WORDS})`,
      'source_too_thin'
    );
  }

  const prompt = `You are a senior football journalist writing for Footy Feed. Extract the actual news from this article and rewrite it — readers want facts, not filler.

CURRENT DATE CONTEXT: The current year is ${currentYear}.

YOUR #1 PRIORITY: Find the actual point — the news, result, quote, development — and lead with it. Cut everything that isn't adding information.

CUT aggressively:
- Repetitive sentences restating the same fact
- "As we all know" / "it remains to be seen" / "time will tell" padding
- Generic closing paragraphs that add nothing
- Setup paragraphs that delay the actual news

KEEP ALL of the following — essential:
- ALL direct quotes from players, managers, officials — these are gold
- All data, stats, scores, transfer fees, tactical details
- Background context that helps readers understand why this matters
- Analysis and expert insight

CRITICAL ACCURACY RULES:
- ONLY include facts that are EXPLICITLY stated in the original article
- NEVER invent quotes, stats, context, or analysis not in the original
- NEVER change club names, player names, or affiliations — use EXACTLY what the original states
- NEVER change years, dates, transfer fees, or numbers — copy them EXACTLY

WRITING STYLE:
- Lead with the news — first sentence = what happened
- Professional football journalism with good flow
- The article MUST be at least 600 words — expand with deeper analysis and context from the original where needed
- Minimum 6-8 paragraphs
- Use subheadings to break up longer sections
- Headline under 48 characters — be concise and punchy
- Summary: 2-3 sentences conveying the core story
- NEVER reference the original source, author, or publication

Original Title: ${originalTitle}

Original Article:
${sourceText}

Respond using this exact format with the delimiters:

---TITLE---
Your concise headline here
---SUMMARY---
Your 1-2 sentence summary here
---CONTENT---
Your trimmed, rewritten article here
---END---`;

  const text = await callSpinner(prompt);
  const result = parseSpinOutput(text);

  const outputWords = countWords(result.content);
  if (outputWords < MIN_OUTPUT_WORDS) {
    throw new SpinError(
      `Extracted article too short (${outputWords} words, need ${MIN_OUTPUT_WORDS})`,
      'output_too_short'
    );
  }

  return result;
}

export async function spinArticleBatch(
  articles: Array<{
    title: string;
    content?: string;
    summary?: string;
  }>
): Promise<Array<SpunArticle | null>> {
  const results: Array<SpunArticle | null> = [];
  for (const article of articles) {
    try {
      const spun = await spinArticle(
        article.title,
        article.content || '',
        article.summary
      );
      results.push(spun);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to spin article "${article.title}":`, error);
      results.push(null);
    }
  }
  return results;
}
