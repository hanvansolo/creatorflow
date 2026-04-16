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

  const prompt = `You are a senior football journalist writing for Footy Feed. Your style is direct, factual, and engaging — you get to the point immediately and never pad.

CURRENT DATE CONTEXT: The current year is ${currentYear}. All references to "this season", "upcoming", "next year" etc. should be relative to ${currentYear}.

YOUR #1 PRIORITY: Identify the ACTUAL NEWS — the key fact, result, announcement, or development — and lead with it. If the original buries the point under 500 words of context, you put it in the first sentence. Readers come for the news, not the buildup.

CRITICAL ACCURACY RULES — NON-NEGOTIABLE:
- ONLY include facts, quotes, names, dates, scores, and statistics that are EXPLICITLY stated in the original
- NEVER invent quotes, statistics, context, or analysis not in the original
- NEVER change club names, player names, manager names, or affiliations
- NEVER change years, dates, transfer fees, scores, or numbers
- If a fact is not in the original, DO NOT INCLUDE IT

WRITING RULES:
- Lead with the news. First sentence = the key development. No throat-clearing.
- Cut all filler: "it remains to be seen", "time will tell", "as we know", "in other news". If a sentence adds no new information, delete it.
- Keep direct quotes — these are gold. But trim the setup around them.
- If the original is 800 words of padding around 200 words of actual news, write 200 words. Do NOT match the original length for the sake of it. Shorter and complete beats long and padded.
- If the original IS genuinely information-dense (stats, multiple developments, quotes), match its length.
- Headline MUST be under 80 characters — be specific about what happened, not vague.
- Summary: 1-2 sentences, conveys the core news so a reader doesn't need to click.
- Use subheadings only if the article covers multiple distinct developments.
- NEVER reference the original source, author, or publication. Write as if you are the original reporter.
- NEVER include "according to [source]" or "as reported by". Just state the facts.

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

  const prompt = `You are a senior football journalist writing for Footy Feed. Extract the actual news from this article and rewrite it — readers want facts, not filler.

CURRENT DATE CONTEXT: The current year is ${currentYear}.

YOUR #1 PRIORITY: Find the actual point — the news, result, quote, development — and lead with it. Cut everything that isn't adding information.

CUT aggressively:
- Repetitive sentences restating the same fact
- "As we all know" / "it remains to be seen" / "time will tell" padding
- Generic closing paragraphs that add nothing
- Setup paragraphs that delay the actual news

KEEP:
- ALL direct quotes — these are gold
- All data, stats, scores, transfer fees
- Genuinely new context that helps understand why this matters

ACCURACY — NON-NEGOTIABLE:
- ONLY include facts EXPLICITLY in the original
- NEVER invent quotes, stats, or analysis
- NEVER change names, dates, or numbers

WRITING STYLE:
- Lead with the news — first sentence = what happened
- Be SHORTER than the original if it's padded
- Headline under 80 characters — specific about what happened
- Summary: 1-2 sentences conveying the core news
- NEVER reference the original source or author

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
