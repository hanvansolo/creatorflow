import type { CredibilityRating } from '@/types';

interface QualityScore {
  rating: CredibilityRating;
  score: number; // 0-100
  reasons: string[];
}

// Clickbait indicators
const clickbaitPatterns = [
  /you won't believe/i,
  /shocking/i,
  /mind-?blowing/i,
  /insane/i,
  /epic fail/i,
  /^\d+\s+(things|reasons|ways|facts)/i, // "5 things you didn't know"
  /^(what|why|how|when|where|who)\s+.{0,20}\?$/i, // Question headlines
  /this is (huge|massive|big)/i,
  /breaking.*!/i,
  /!!!+/,
  /REVEALED/i,
  /EXPOSED/i,
  /SECRET/i,
  /find out/i,
  /click here/i,
  /\bwon't believe\b/i,
  /\bgame.?changer\b/i,
  /\bbombshell\b/i,
  // "The one thing/reason/condition" clickbait formula
  /\bthe\s+(one|only|single|real)\s+(thing|reason|condition|secret|way|trick)\b/i,
  /\b(reveals?|uncovers?)\s+(the|what|why|how)\b/i, // "Reveals the/what/why"
  /\bwill\s+(shock|surprise|blow)\b/i,
  /\bhere'?s\s+(what|why|how|the)\b/i, // "Here's what you need to know"
  /\bneed to know\b/i,
  /\beverything you need\b/i,
  /\bthe truth about\b/i,
  /\bfinally\s+(reveals?|admits?|confirms?)\b/i,
];

// Opinion/analysis indicators - articles expressing subjective views
const opinionPatterns = [
  /\b(i think|i believe|in my opinion|personally)\b/i,
  /\b(should|must|need to)\b.*\b(be|do|change|consider)\b/i,
  /^\[(opinion|editorial|column|analysis)\]/i,
  /\bmy take\b/i,
  /\bhottest take\b/i,
  /\b(predict|prediction|predicting)\b/i,
  /\bwill win\b.*\b(championship|title|race)\b/i,
  /\b(better than|worse than|best|worst)\b.*\b(driver|team)\b/i,
  /\b(ranking|ranked|rate|rating)\b.*\b(drivers?|teams?)\b/i,
  /\bwho (should|will|can)\b/i,
  /\bdeserves?\b/i,
  /\boverrated|underrated\b/i,
];

// Rumour/speculation indicators
const rumourPatterns = [
  /\b(reportedly|allegedly|rumou?red?)\b/i,
  /\b(sources say|sources claim|paddock whispers)\b/i,
  /\b(unconfirmed|speculation|speculated)\b/i,
  /\b(is set to|looks set to)\b/i,
  /\?\s*$/,  // Headlines ending with question mark
  // Fake insider framing
  /\binsider\s+(reveals?|claims?|says?)\b/i,
  /\b(reveals?|uncovers?)\s+(the\s+)?(secret|truth|real|one)\b/i,
  // YouTube/social media "analysis"
  /\b(youtube|podcast|twitter|x\.com)\s+(channel|video|post)\b/i,
  /\bon\s+(his|her|their)\s+(youtube|podcast|channel)\b/i,
  // Personal speculation language
  /\bwouldn't surprise me\b/i,
  /\bi (just\s+)?can't see\b/i,
  /\bi wouldn't be surprised\b/i,
  /\bit wouldn't surprise\b/i,
];

// Soft speculation - common in journalism but not necessarily rumour
const softSpeculationPatterns = [
  /\b(could|might|may|possibly)\b/i,
  /\b(expected to|likely|unlikely)\b/i,
];

// Speculative quote content - quotes that are opinions, not facts
const speculativeQuotePatterns = [
  /wouldn't surprise/i,
  /can't see/i,
  /wouldn't be surprised/i,
  /don't think/i,
  /hard to imagine/i,
  /remains to be seen/i,
  /only time will tell/i,
  /if .{5,30} then/i,  // Hypothetical statements
];

// Quality/verified indicators - signs of good journalism
const verifiedPatterns = [
  /"[^"]{15,}"/, // Direct quotes (at least 15 chars - more substantial)
  /\b(confirmed|announced|official statement)\b/i,
  /\b(according to [A-Z][a-z]+)\b/, // Attribution with a name
  /\b\d+\s*(km\/h|mph|seconds?|laps?|points?)\b/i, // Specific stats
  /\b(press release|press conference|media session)\b/i,
  /[A-Z][a-z]+\s+(said|told|explained|stated|revealed)\b/, // Named person said
  /\btold\s+(the\s+)?(media|press|reporters?|journalists?)\b/i,
];

// Football-specific quality indicators - shows domain knowledge (more specific)
const f1QualityPatterns = [
  // Team principals and key figures (when quoted or attributed)
  /\b(horner|wolff|vasseur|brown|szafnauer|steiner|vowles|komatsu)\b.*\b(said|told|explained|believes?)\b/i,
  // Technical terms showing depth (more specific combinations)
  /\b(downforce|aerodynamic|power unit|mgu-[hk])\b/i,
  /\b(undercut|overcut|pit strategy|tyre strategy)\b/i,
  // Specific event references
  /\b(parc ferm[eé]|scrutineering)\b/i,
  // Regulations (specific)
  /\b(budget cap|cost cap|technical directive)\b/i,
  /\bFIA\s+(president|investigation|ruling|decision)\b/i,
];

// Substance indicators - well-structured journalism (more specific)
const substancePatterns = [
  /\b(because|therefore|as a result|consequently|this means)\b/i,
  /\b(however|although|despite|nevertheless)\b/i, // Nuanced analysis
  /\b(explained|noted|added|continued|emphasized)\b.*["':]/i, // Attribution with quote
  /\b(during|after|before|following)\s+(the|last|this)\s+(race|qualifying|session|weekend)\b/i,
  /\b(analysis|breakdown|in-depth|detailed)\b/i,
];

// Low quality/filler phrases - padding without information
const fillerPatterns = [
  /\bstay tuned\b/i,
  /\bwatch this space\b/i,
  /\bonly time will tell\b/i,
  /\bwe'll have to wait and see\b/i,
  /\bit remains to be seen\b/i,
  /\bmore news as it breaks\b/i,
  /\bwhat do you think\?\b/i,
  /\blet us know\b/i,
  /\bcomment below\b/i,
  /\bfollow us\b/i,
];

// Low substance indicators - vague content without specifics
const lowSubstancePatterns = [
  /\binteresting\b(?!.*\b(data|stats?|figures?)\b)/i, // "interesting" without data
  /\bexciting times?\b/i,
  /\bbig news\b/i,
  /\bwait and see\b/i,
  /\bcould be\b.*\bcould be\b/i, // Multiple vague hedges
  /\bthings are happening\b/i,
  /\bstay updated\b/i,
];

export function scoreArticleQuality(
  title: string,
  content?: string | null,
  summary?: string | null
): QualityScore {
  const fullText = `${title} ${summary || ''} ${content || ''}`;
  const titleAndSummary = `${title} ${summary || ''}`;
  const reasons: string[] = [];
  let score = 50; // Start neutral

  // Check content length
  const contentLength = (content || summary || '').length;
  if (contentLength < 100) {
    score -= 25;
    reasons.push('Very short content');
  } else if (contentLength < 300) {
    score -= 10;
    reasons.push('Limited content');
  } else if (contentLength > 1500) {
    score += 15;
    reasons.push('In-depth content');
  } else if (contentLength > 800) {
    score += 10;
    reasons.push('Substantial content');
  }

  // Check for clickbait (in title/summary only - strongest signal)
  let clickbaitCount = 0;
  for (const pattern of clickbaitPatterns) {
    if (pattern.test(title) || pattern.test(summary || '')) {
      clickbaitCount++;
    }
  }
  if (clickbaitCount >= 2) {
    score -= 35;
    reasons.push('Multiple clickbait indicators');
  } else if (clickbaitCount === 1) {
    score -= 15;
    reasons.push('Clickbait indicator detected');
  }

  // Check for opinion/analysis
  let opinionCount = 0;
  for (const pattern of opinionPatterns) {
    if (pattern.test(fullText)) {
      opinionCount++;
    }
  }
  if (opinionCount >= 3) {
    reasons.push('Strong opinion/analysis piece');
  } else if (opinionCount >= 1) {
    reasons.push('Contains opinion/analysis');
  }

  // Check for hard rumour/speculation (strong signals) - check full text
  let rumourCount = 0;
  for (const pattern of rumourPatterns) {
    if (pattern.test(fullText)) {
      rumourCount++;
    }
  }
  // Extra penalty for rumour framing in title specifically
  const titleHasRumourFraming = rumourPatterns.some(p => p.test(title));
  if (titleHasRumourFraming) {
    rumourCount++; // Double count title rumour signals
  }

  if (rumourCount >= 3) {
    score -= 25;
    reasons.push('Heavy speculation/rumour framing');
  } else if (rumourCount >= 2) {
    score -= 15;
    reasons.push('Heavy speculation');
  } else if (rumourCount === 1) {
    score -= 5;
    reasons.push('Contains speculation');
  }

  // Soft speculation is common in journalism - don't penalize as heavily
  let softSpecCount = 0;
  for (const pattern of softSpeculationPatterns) {
    if (pattern.test(titleAndSummary)) {
      softSpecCount++;
    }
  }
  // Only penalize if multiple soft speculation AND no verified sources

  // Check for verified/quality indicators
  let verifiedCount = 0;
  for (const pattern of verifiedPatterns) {
    if (pattern.test(fullText)) {
      verifiedCount++;
    }
  }

  // Check if quotes are speculative (opinions) rather than factual
  let speculativeQuoteCount = 0;
  for (const pattern of speculativeQuotePatterns) {
    if (pattern.test(fullText)) {
      speculativeQuoteCount++;
    }
  }
  // Reduce verified count if quotes are speculative - they don't add credibility
  if (speculativeQuoteCount >= 2) {
    verifiedCount = Math.max(0, verifiedCount - 2);
    score -= 10;
    reasons.push('Quotes are speculation not facts');
  } else if (speculativeQuoteCount >= 1) {
    verifiedCount = Math.max(0, verifiedCount - 1);
  }

  if (verifiedCount >= 3) {
    score += 25;
    reasons.push('Well-sourced with quotes/data');
  } else if (verifiedCount >= 2) {
    score += 15;
    reasons.push('Contains attribution and sources');
  } else if (verifiedCount >= 1) {
    score += 8;
    reasons.push('Contains sources or data');
  }

  // Check for football-specific quality indicators
  let f1QualityCount = 0;
  for (const pattern of f1QualityPatterns) {
    if (pattern.test(fullText)) {
      f1QualityCount++;
    }
  }
  if (f1QualityCount >= 3) {
    score += 15;
    reasons.push('Strong football domain expertise');
  } else if (f1QualityCount >= 1) {
    score += 8;
    reasons.push('Football-specific detail');
  }

  // Check for substance
  let substanceCount = 0;
  for (const pattern of substancePatterns) {
    if (pattern.test(fullText)) {
      substanceCount++;
    }
  }
  if (substanceCount >= 3) {
    score += 12;
    reasons.push('Well-structured journalism');
  } else if (substanceCount >= 2) {
    score += 8;
    reasons.push('Good structure');
  }

  // Check for filler
  let fillerCount = 0;
  for (const pattern of fillerPatterns) {
    if (pattern.test(fullText)) {
      fillerCount++;
    }
  }
  if (fillerCount >= 2) {
    score -= 20;
    reasons.push('Contains filler phrases');
  } else if (fillerCount === 1) {
    score -= 8;
  }

  // Check for low substance
  let lowSubstanceCount = 0;
  for (const pattern of lowSubstancePatterns) {
    if (pattern.test(fullText)) {
      lowSubstanceCount++;
    }
  }
  if (lowSubstanceCount >= 2) {
    score -= 15;
    reasons.push('Vague/low substance content');
  }

  // Penalize soft speculation only if combined with low quality signals
  if (softSpecCount >= 2 && verifiedCount === 0 && f1QualityCount === 0) {
    score -= 10;
    reasons.push('Unattributed speculation');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine rating - "unverified" is neutral default, "verified" must be earned
  let rating: CredibilityRating;

  // Clickbait: multiple clickbait indicators OR low score with clickbait
  if (clickbaitCount >= 2 || (clickbaitCount >= 1 && score < 35)) {
    rating = 'clickbait';
  }
  // Opinion: clear opinion signals
  else if (opinionCount >= 2 || (opinionCount >= 1 && opinionPatterns.some(p => p.test(title)))) {
    rating = 'opinion';
  }
  // Rumour: speculation without solid sourcing OR insider/reveals framing
  else if (
    rumourCount >= 2 ||
    (rumourCount >= 1 && verifiedCount === 0) ||
    (rumourCount >= 1 && speculativeQuoteCount >= 1)
  ) {
    rating = 'rumour';
  }
  // Verified: requires clear quality signals - this must be EARNED
  else if (
    (verifiedCount >= 2 && score >= 55) ||  // Multiple verified indicators + good score
    (verifiedCount >= 1 && f1QualityCount >= 1 && substanceCount >= 1 && score >= 55) ||  // Sourcing + expertise + structure
    (verifiedCount >= 1 && score >= 65 && contentLength > 800)  // Some sourcing + high quality long-form
  ) {
    rating = 'verified';
  }
  // Default: unverified (neutral - not bad, just not clearly verified)
  else {
    rating = 'unverified';
  }

  return {
    rating,
    score,
    reasons,
  };
}

// Quick check if article should be filtered out entirely
// Note: Clickbait is NOT filtered - we show it but mark it with the badge
export function shouldFilterArticle(
  title: string,
  content?: string | null,
  summary?: string | null
): { filter: boolean; reason?: string } {
  // Filter out empty or near-empty content - literally nothing there
  const contentLength = (content || summary || '').length;
  if (contentLength < 50) {
    return { filter: true, reason: 'No substantive content' };
  }

  return { filter: false };
}
