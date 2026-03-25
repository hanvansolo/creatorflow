// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

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

export async function getArticleRegulations(_articleId: string): Promise<RegulationPreview[]> {
  return [];
}

export async function getRegulationByArticleNumber(_articleNumber: string, _seasonYear?: number): Promise<F1Regulation | null> {
  return null;
}

export async function getRegulationById(_id: string): Promise<F1Regulation | null> {
  return null;
}

export async function getRegulationsByCategory(_category: string, _seasonYear?: number): Promise<F1Regulation[]> {
  return [];
}

export async function getAllRegulations(_seasonYear?: number): Promise<F1Regulation[]> {
  return [];
}

export async function searchRegulations(_query: string, _category?: string, _limit?: number): Promise<F1Regulation[]> {
  return [];
}

export async function getArticlesForRegulation(_regulationId: string, _limit?: number): Promise<Array<{ id: string; title: string; slug: string; publishedAt: Date | null }>> {
  return [];
}

export async function extractRegulationReferences(
  _articleTitle: string,
  _articleContent: string,
  _availableRegulations: Array<{ id: string; articleNumber: string; articleTitle: string; keywords: string[]; simplifiedExplanation: string }>
): Promise<{ matches: RegulationMatch[]; processingNotes: string }> {
  return { matches: [], processingNotes: 'Stubbed during migration' };
}

export async function processArticlesForRegulations(_limit?: number): Promise<{ processed: number; matched: number; results: Array<{ articleId: string; title: string; matchCount: number }> }> {
  return { processed: 0, matched: 0, results: [] };
}

export async function detectIncidentFromArticle(_articleTitle: string, _articleContent: string, _publishedAt: Date): Promise<{ isIncident: boolean; incident?: Partial<LiveIncident> }> {
  return { isIncident: false };
}

export async function createLiveIncident(_raceId: string, _sessionType: string, _incidentData: Partial<LiveIncident>): Promise<LiveIncident | null> {
  return null;
}

export async function findRegulationsForIncident(_incidentType: string, _description: string, _penaltyType: string | null): Promise<Array<{ regulationId: string; articleNumber: string; relevance: number }>> {
  return [];
}

export async function getLiveIncidents(_raceId: string, _sessionType?: string): Promise<LiveIncident[]> {
  return [];
}

export async function getCurrentRaceSession(): Promise<{ raceId: string; raceName: string; isLive: boolean } | null> {
  return null;
}

export async function smartRegulationLookup(_query: string): Promise<{ regulations: F1Regulation[]; explanation: string }> {
  return { regulations: [], explanation: '' };
}
