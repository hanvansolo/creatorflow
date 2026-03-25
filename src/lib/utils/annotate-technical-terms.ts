// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export const TECHNICAL_TERMS: Record<string, { definition: string; category: string }> = {};

export interface AnnotatedTerm {
  term: string;
  definition: string;
  category: string;
  deepDiveSlug?: string;
}

export function findTechnicalTerms(_text: string): { term: string; start: number; end: number; info: AnnotatedTerm }[] {
  return [] as any[];
}

export async function getDeepDiveMatches(_terms: string[]): Promise<Map<string, string>> {
  return new Map();
}
