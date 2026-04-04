import Anthropic from '@anthropic-ai/sdk';

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

export interface SpunArticle {
  title: string;
  summary: string;
  content: string;
}

export async function spinArticle(
  originalTitle: string,
  originalContent: string,
  originalSummary?: string
): Promise<SpunArticle> {
  const currentYear = new Date().getFullYear();

  const prompt = `You are a football/soccer news writer. Rewrite the following article in your own words, maintaining the factual information but using completely different phrasing and structure. Make it engaging and professional.

CURRENT DATE CONTEXT: The current year is ${currentYear}. All references to "this season", "upcoming", "next year" etc. should be relative to ${currentYear}.

CRITICAL ACCURACY RULES — THESE ARE NON-NEGOTIABLE:
- ONLY include facts, quotes, names, dates, scores, and statistics that are EXPLICITLY stated in the original article below
- NEVER invent quotes, statistics, background context, or analysis that isn't in the original
- NEVER add "according to reports", "it is believed", or any speculative language unless the original contains it
- NEVER change club names, player names, manager names, or club affiliations — use EXACTLY what the original states
- NEVER change years, dates, transfer fees, scores, or any numbers — copy them EXACTLY
- If a fact is not in the original text, DO NOT INCLUDE IT. Period.

WRITING RULES:
- Rewrite the original in your own words with different phrasing and structure
- Write in an engaging, professional football journalism style
- Create a new compelling headline (same subject matter). Headline MUST be under 48 characters — be concise and punchy
- Write a brief 2-3 sentence summary
- Match the LENGTH of the original article. If the original is 200 words, write ~200 words. If it's 800 words, write ~800 words. Do NOT pad short articles to make them longer.
- Use proper paragraph structure
- Include subheadings where appropriate for articles over 400 words
- Do not add any information that wasn't in the original
- Do not include any disclaimers about rewriting

Original Title: ${originalTitle}

Original Article:
${originalContent || originalSummary}

Respond using this exact format with the delimiters:

---TITLE---
Your new headline here
---SUMMARY---
Your 2-3 sentence summary here
---CONTENT---
Your full rewritten article here
---END---`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract fields using delimiter format
    const text = textContent.text;

    const titleMatch = text.match(/---TITLE---\s*([\s\S]*?)\s*---SUMMARY---/);
    const summaryMatch = text.match(/---SUMMARY---\s*([\s\S]*?)\s*---CONTENT---/);
    const contentMatch = text.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);

    if (!titleMatch || !summaryMatch || !contentMatch) {
      throw new Error('Could not extract all fields from response');
    }

    const result: SpunArticle = {
      title: titleMatch[1].trim(),
      summary: summaryMatch[1].trim(),
      content: contentMatch[1].trim(),
    };

    return result;
  } catch (error) {
    console.error('Failed to spin article:', error);
    // Return original content if spinning fails
    return {
      title: originalTitle,
      summary: originalSummary || originalContent?.slice(0, 200) + '...',
      content: originalContent || originalSummary || '',
    };
  }
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
  if (!sourceText.trim()) {
    return { title: originalTitle, summary: '', content: '' };
  }

  const prompt = `You are a senior football journalist. Rewrite this article in a clean, engaging style while trimming unnecessary padding and filler.

CURRENT DATE CONTEXT: The current year is ${currentYear}.

TRIM these types of filler:
- Repetitive sentences that restate the same point
- Obvious "as we all know" or "it goes without saying" padding
- Generic closing paragraphs that add no new information
- Excessive marketing or promotional language

KEEP ALL of the following - these are essential:
- The full story arc and narrative flow
- ALL direct quotes from players, managers, officials
- All data, stats, scores, and tactical details
- Background context that helps readers understand the story
- Analysis and expert insight
- Multiple perspectives on the story

CRITICAL ACCURACY RULES — NON-NEGOTIABLE:
- ONLY include facts that are EXPLICITLY stated in the original article
- NEVER invent quotes, stats, context, or analysis not in the original
- NEVER change club names, player names, or affiliations — use EXACTLY what the original states
- NEVER change years, dates, or numbers — copy them EXACTLY
- If a fact is not in the original, DO NOT INCLUDE IT

WRITING STYLE:
- Professional sports journalism with good flow
- Lead with the most newsworthy angle
- Match the length of the original — do NOT pad short articles
- If the original is 300 words, write ~300 words. If 1000 words, write ~1000 words
- Use subheadings to break up longer sections
- Write a sharp headline that captures the key news. The headline MUST be under 48 characters (a suffix will be appended) - be concise and punchy
- Summary should be 2-3 sentences conveying the core story

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

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const text = textContent.text;
    const titleMatch = text.match(/---TITLE---\s*([\s\S]*?)\s*---SUMMARY---/);
    const summaryMatch = text.match(/---SUMMARY---\s*([\s\S]*?)\s*---CONTENT---/);
    const contentMatch = text.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);

    if (!titleMatch || !summaryMatch || !contentMatch) {
      throw new Error('Could not extract all fields from response');
    }

    return {
      title: titleMatch[1].trim(),
      summary: summaryMatch[1].trim(),
      content: contentMatch[1].trim(),
    };
  } catch (error) {
    console.error('Failed to extract and spin article:', error);
    return {
      title: originalTitle,
      summary: originalSummary || sourceText.slice(0, 200) + '...',
      content: sourceText,
    };
  }
}

export async function spinArticleBatch(
  articles: Array<{
    title: string;
    content?: string;
    summary?: string;
  }>
): Promise<SpunArticle[]> {
  const results: SpunArticle[] = [];

  // Process in batches to avoid rate limits
  for (const article of articles) {
    try {
      const spun = await spinArticle(
        article.title,
        article.content || '',
        article.summary
      );
      results.push(spun);

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to spin article "${article.title}":`, error);
      results.push({
        title: article.title,
        summary: article.summary || '',
        content: article.content || '',
      });
    }
  }

  return results;
}
