import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, inArray, isNull, or } from 'drizzle-orm';
import { db, newsArticles, newsSources, socialPosts } from '@/lib/db';
import { postArticleWithTracking, type RelatedCoverage } from '@/lib/social/post';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET || process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

// ---- Throttle knobs ----
// Regular articles: one every N minutes across the whole site. Default 180
// (= 3 hours, so max ~8 regular posts/day). Breaking news bypasses this gap.
const MIN_REGULAR_GAP_MINUTES = Number(process.env.SOCIAL_MIN_REGULAR_GAP_MINUTES || 180);
// Breaking news cap per hour (prevents a wire-news blowout on transfer
// deadline day from flooding the feed).
const MAX_BREAKING_PER_HOUR = Number(process.env.SOCIAL_MAX_BREAKING_PER_HOUR || 2);
// Overall safety net across article + breaking. Leave generous.
const MAX_POSTS_PER_HOUR = Number(process.env.SOCIAL_MAX_POSTS_PER_HOUR || 3);
// Importance floor for a regular article to be worth a post.
const MIN_IMPORTANCE_SCORE = Number(process.env.SOCIAL_MIN_IMPORTANCE_SCORE || 25);
// Two candidates whose normalized-title shingle Jaccard exceeds this are
// treated as "same story" — skip the later one.
const DUPLICATE_TITLE_THRESHOLD = Number(process.env.SOCIAL_DUPLICATE_TITLE_THRESHOLD || 0.45);

// ---- Title similarity ----

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Jaccard similarity over 3-word shingles on normalized titles. */
function titleSimilarity(a: string, b: string): number {
  const shingles = (t: string) => {
    const words = normalizeTitle(t).split(' ').filter((w) => w.length >= 3);
    const set = new Set<string>();
    for (let i = 0; i <= words.length - 3; i++) set.add(words.slice(i, i + 3).join(' '));
    // Also include single salient words (proper nouns, >=5 chars) — catches
    // cases where two titles share "Haaland" + "hat-trick" but nothing else.
    for (const w of words) if (w.length >= 5) set.add(w);
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

// ---- Importance ----

interface Candidate {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  credibility: string | null;
  isBreaking: boolean | null;
  publishedAt: Date;
  sourceName: string | null;
  sourcePriority: number | null;
  originalUrl: string;
}

function importanceScore(c: Candidate): number {
  let score = 0;
  if (c.isBreaking) score += 40;
  if (c.sourcePriority != null) score += Math.min(20, Math.max(0, c.sourcePriority * 2));

  const ageHours = (Date.now() - c.publishedAt.getTime()) / 3_600_000;
  if (ageHours < 2) score += 25;
  else if (ageHours < 6) score += 15;
  else if (ageHours < 12) score += 5;
  else if (ageHours > 24) score -= 30;

  // Prefer substantive content (spun articles clear 2000 chars easily).
  if (c.content && c.content.length > 2000) score += 10;
  if (c.content && c.summary && c.content.length > c.summary.length * 2.5) score += 5;

  // Signal keywords — crude but cheap, biases toward transfer/results/injury
  // news over pure opinion/speculation pieces.
  const t = c.title.toLowerCase();
  const keywords = ['transfer', 'signs', 'signed', 'sacked', 'sack', 'injury', 'ruled out', 'record', 'beat', 'win', 'defeat', 'final', 'cup', 'debut', 'hat-trick', 'red card', 'penalty'];
  if (keywords.some((k) => t.includes(k))) score += 10;

  // Penalize known low-value shapes.
  if (c.credibility === 'clickbait' || c.credibility === 'opinion') score -= 50;

  return score;
}

/**
 * Smarter news poster.
 * Runs every 30 min. Each run:
 *   1. Breaking-news pass: up to MAX_BREAKING_PER_HOUR breaking items that
 *      haven't been posted and whose title doesn't duplicate anything posted
 *      in the last 24h.
 *   2. Regular pass: if no regular article has been posted in the last
 *      MIN_REGULAR_GAP_MINUTES, pick ONE high-importance un-posted article,
 *      dedup by title similarity, attach up to 3 "more coverage" links from
 *      companion articles on other sites.
 * Both passes share a total-per-hour safety cap.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const gapCutoff = new Date(now - MIN_REGULAR_GAP_MINUTES * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  // ---- Budget checks ----
  const recentPosts = await db
    .select({
      contentType: socialPosts.contentType,
      contentId: socialPosts.contentId,
      postedAt: socialPosts.postedAt,
    })
    .from(socialPosts)
    .where(and(eq(socialPosts.platform, 'facebook'), gte(socialPosts.postedAt, dayAgo)));

  const lastHour = recentPosts.filter((r) => r.postedAt && r.postedAt >= oneHourAgo);
  const breakingLastHour = lastHour.filter((r) => r.contentType === 'article_breaking');
  const regularLastHour = lastHour.filter((r) => r.contentType === 'article');

  const totalBudget = Math.max(0, MAX_POSTS_PER_HOUR - lastHour.length);
  const breakingBudget = Math.max(0, MAX_BREAKING_PER_HOUR - breakingLastHour.length);

  // Can we post a regular article? Need both: total budget AND the
  // min-gap since the last regular article (across all runs).
  const lastRegularPost = recentPosts
    .filter((r) => r.contentType === 'article' && r.postedAt && r.postedAt >= gapCutoff)
    .sort((a, b) => (b.postedAt!.getTime() - a.postedAt!.getTime()))[0];
  const canPostRegular = !lastRegularPost && totalBudget > 0;

  // ---- Load titles of recently posted articles for dedup ----
  const recentPostedIds = Array.from(new Set(recentPosts.map((r) => r.contentId).filter(Boolean)));
  const recentTitles: string[] = [];
  if (recentPostedIds.length > 0) {
    const rows = await db
      .select({ title: newsArticles.title })
      .from(newsArticles)
      .where(inArray(newsArticles.id, recentPostedIds));
    for (const r of rows) if (r.title) recentTitles.push(r.title);
  }

  const isDuplicateOfRecent = (title: string) =>
    recentTitles.some((t) => titleSimilarity(t, title) >= DUPLICATE_TITLE_THRESHOLD);

  const summary = {
    breaking: { posted: 0, skipped_duplicate: 0, errors: 0 },
    regular: { posted: 0, considered: 0, skipped_duplicate: 0, errors: 0, topScore: 0 },
    budget: {
      totalBudget,
      breakingBudget,
      canPostRegular,
      minutesSinceLastRegular: lastRegularPost
        ? Math.round((now - lastRegularPost.postedAt!.getTime()) / 60000)
        : null,
    },
  };

  // ---- PASS 1: breaking news ----
  if (breakingBudget > 0 && totalBudget > 0) {
    const breakingCandidates = await loadCandidates({ breakingOnly: true, limit: 10 });

    for (const c of breakingCandidates) {
      if (summary.breaking.posted >= breakingBudget) break;
      if (summary.breaking.posted + summary.regular.posted >= totalBudget) break;

      if (isDuplicateOfRecent(c.title)) {
        summary.breaking.skipped_duplicate++;
        continue;
      }

      const related = await findRelated(c, dayAgo);
      const res = await postArticleWithTracking({
        articleId: c.id,
        title: c.title,
        slug: c.slug,
        summary: c.summary || undefined,
        tags: c.tags || undefined,
        imageUrl: c.imageUrl || undefined,
        sourceName: c.sourceName,
        isBreaking: true,
        related,
      });
      // Relabel the just-written socialPosts rows as 'article_breaking' so
      // hourly caps and audit queries can distinguish them.
      await relabelJustPosted(c.id, 'article_breaking');

      const anySuccess = Object.values(res).some((r) => r && r.success);
      if (anySuccess) {
        await db.update(newsArticles).set({ socialPosted: true }).where(eq(newsArticles.id, c.id));
        summary.breaking.posted++;
        recentTitles.push(c.title);
      } else {
        summary.breaking.errors++;
      }
    }
  }

  // ---- PASS 2: one regular article ----
  if (canPostRegular && summary.breaking.posted + summary.regular.posted < totalBudget) {
    const candidates = await loadCandidates({ breakingOnly: false, limit: 30 });
    summary.regular.considered = candidates.length;

    const scored = candidates
      .map((c) => ({ c, score: importanceScore(c) }))
      .sort((a, b) => b.score - a.score);

    for (const { c, score } of scored) {
      if (score < MIN_IMPORTANCE_SCORE) break;
      summary.regular.topScore = Math.max(summary.regular.topScore, score);

      if (isDuplicateOfRecent(c.title)) {
        summary.regular.skipped_duplicate++;
        continue;
      }

      const related = await findRelated(c, dayAgo);
      const res = await postArticleWithTracking({
        articleId: c.id,
        title: c.title,
        slug: c.slug,
        summary: c.summary || undefined,
        tags: c.tags || undefined,
        imageUrl: c.imageUrl || undefined,
        sourceName: c.sourceName,
        isBreaking: false,
        related,
      });

      const anySuccess = Object.values(res).some((r) => r && r.success);
      if (anySuccess) {
        await db.update(newsArticles).set({ socialPosted: true }).where(eq(newsArticles.id, c.id));
        summary.regular.posted++;
      } else {
        summary.regular.errors++;
      }
      break; // only one regular post per run
    }
  }

  return NextResponse.json(summary);
}

// ---- Helpers ----

async function loadCandidates(opts: { breakingOnly: boolean; limit: number }): Promise<Candidate[]> {
  const conds = [
    eq(newsArticles.socialPosted, false),
    or(eq(newsArticles.isPrimaryStory, true), isNull(newsArticles.storyGroupId)),
  ];
  if (opts.breakingOnly) conds.push(eq(newsArticles.isBreaking, true));
  const baseWhere = and(...conds);

  const rows = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      content: newsArticles.content,
      imageUrl: newsArticles.imageUrl,
      tags: newsArticles.tags,
      credibility: newsArticles.credibilityRating,
      isBreaking: newsArticles.isBreaking,
      publishedAt: newsArticles.publishedAt,
      originalUrl: newsArticles.originalUrl,
      sourceName: newsSources.name,
      sourcePriority: newsSources.priority,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(baseWhere)
    .orderBy(desc(newsArticles.publishedAt))
    .limit(opts.limit);

  // Filter out thin articles — we still want substantive spun content.
  return rows
    .filter((r): r is typeof r & { publishedAt: Date } => !!r.publishedAt)
    .map((r) => ({ ...r, isBreaking: r.isBreaking ?? false }))
    .filter((c) => {
      if (!c.content) return false;
      if (c.summary && c.content.length <= c.summary.length * 1.5) return false;
      return true;
    });
}

/**
 * Find up to 3 companion articles covering the same story from other sources
 * in the last 24h. Used for the "More coverage:" block.
 */
async function findRelated(picked: Candidate, since: Date): Promise<RelatedCoverage[]> {
  const rows = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      originalUrl: newsArticles.originalUrl,
      sourceName: newsSources.name,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .where(
      and(
        gte(newsArticles.publishedAt, since),
        // Don't include our own pick.
      ),
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(200);

  const out: RelatedCoverage[] = [];
  const seenSources = new Set<string>();
  if (picked.sourceName) seenSources.add(picked.sourceName);

  for (const r of rows) {
    if (r.id === picked.id) continue;
    if (!r.title || !r.originalUrl) continue;
    if (titleSimilarity(picked.title, r.title) < 0.35) continue;
    const src = r.sourceName || 'source';
    if (seenSources.has(src)) continue; // one link per source
    seenSources.add(src);
    out.push({ sourceName: src, url: r.originalUrl });
    if (out.length >= 3) break;
  }

  return out;
}

/**
 * After postArticleWithTracking runs it logs rows with contentType='article'.
 * For breaking news, relabel them so the per-hour breaking cap can count
 * them correctly on subsequent runs.
 */
async function relabelJustPosted(articleId: string, newType: 'article' | 'article_breaking') {
  try {
    const { sql } = await import('drizzle-orm');
    await db.execute(
      sql`UPDATE social_posts SET content_type = ${newType} WHERE content_id = ${articleId} AND content_type = 'article'`,
    );
  } catch (err) {
    console.error('[social-post] Failed to relabel content_type:', err instanceof Error ? err.message : err);
  }
}
