import { findTechnicalTerms, getDeepDiveMatches, type AnnotatedTerm } from './annotate-technical-terms';

interface TermMatch {
  term: string;
  start: number;
  end: number;
  info: AnnotatedTerm;
}

interface PreparedContent {
  paragraphs: string[];
  termsByParagraph: TermMatch[][];
}

/**
 * Server-side function to prepare annotated content data
 * This finds all technical terms and matches them to deep dives
 */
export async function prepareAnnotatedContent(content: string): Promise<PreparedContent> {
  // Split into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // Find terms in all paragraphs and collect unique terms
  const allTerms = new Set<string>();
  const termsByParagraph: ReturnType<typeof findTechnicalTerms>[] = [];

  for (const paragraph of paragraphs) {
    const terms = findTechnicalTerms(paragraph);
    termsByParagraph.push(terms);
    terms.forEach(t => allTerms.add(t.info.term.toLowerCase()));
  }

  // Get deep dive matches for all terms
  const deepDiveMatches = await getDeepDiveMatches(Array.from(allTerms));

  // Enrich terms with deep dive slugs
  const enrichedTermsByParagraph: TermMatch[][] = termsByParagraph.map(terms =>
    terms.map(term => ({
      ...term,
      info: {
        ...term.info,
        deepDiveSlug: deepDiveMatches.get(term.info.term.toLowerCase()),
      },
    }))
  );

  return {
    paragraphs,
    termsByParagraph: enrichedTermsByParagraph,
  };
}

/**
 * Lighter version that doesn't query database - uses only static terms
 */
export function prepareAnnotatedContentStatic(content: string): {
  paragraphs: string[];
  termsByParagraph: TermMatch[][];
} {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const termsByParagraph = paragraphs.map(p => findTechnicalTerms(p));

  return {
    paragraphs,
    termsByParagraph,
  };
}
