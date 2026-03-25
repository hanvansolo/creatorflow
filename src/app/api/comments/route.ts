import { NextRequest, NextResponse } from 'next/server';
import { db, comments, users } from '@/lib/db';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/comments?type=article&id=slug
export async function GET(request: NextRequest) {
  const contentType = request.nextUrl.searchParams.get('type');
  const contentId = request.nextUrl.searchParams.get('id');

  if (!contentType || !contentId) {
    return NextResponse.json({ error: 'type and id required' }, { status: 400 });
  }

  // Fetch top-level comments with user info
  const topLevel = await db
    .select({
      id: comments.id,
      body: comments.body,
      likes: comments.likes,
      status: comments.status,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.displayName,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(
      and(
        eq(comments.contentType, contentType),
        eq(comments.contentId, contentId),
        eq(comments.status, 'active'),
      )
    )
    .orderBy(desc(comments.createdAt))
    .limit(100);

  // Group into threads
  const byId = new Map<string, typeof topLevel[0] & { replies: typeof topLevel }>();
  const roots: (typeof topLevel[0] & { replies: typeof topLevel })[] = [];

  for (const c of topLevel) {
    const withReplies = { ...c, replies: [] as typeof topLevel };
    byId.set(c.id, withReplies);
  }

  for (const c of topLevel) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({ comments: roots, total: topLevel.length });
}

// Spam detection patterns
const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+\.[^\s]+/gi,        // URLs (more than 2 = spam)
  /\b(buy|cheap|discount|free|winner|congratulations|click here|act now|limited time|order now|viagra|crypto|bitcoin|earn money|work from home)\b/gi,
  /(.)\1{5,}/,                            // Repeated chars (aaaaaa)
  /[\u0400-\u04FF]{10,}/,                // Long Cyrillic blocks
  /[\u4E00-\u9FFF]{10,}/,                // Long Chinese blocks (unless content is Chinese)
];

const RATE_LIMIT_MAP = new Map<string, number[]>();

function isSpam(text: string): { spam: boolean; reason?: string } {
  const lower = text.toLowerCase();

  // Check for excessive URLs (allow 1 max)
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi);
  if (urlMatches && urlMatches.length > 1) {
    return { spam: true, reason: 'Too many links' };
  }

  // Check spam keywords
  const spamKeywords = lower.match(SPAM_PATTERNS[1]);
  if (spamKeywords && spamKeywords.length >= 2) {
    return { spam: true, reason: 'Spam detected' };
  }

  // Repeated characters
  if (SPAM_PATTERNS[2].test(text)) {
    return { spam: true, reason: 'Repetitive content' };
  }

  // All caps (more than 80% of letters)
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 10 && letters === letters.toUpperCase()) {
    return { spam: true, reason: 'Please don\'t shout' };
  }

  // Too short (less than 3 chars of actual content)
  const stripped = text.replace(/\s+/g, '');
  if (stripped.length < 3) {
    return { spam: true, reason: 'Comment too short' };
  }

  // Duplicate content check (same text repeated)
  const words = lower.split(/\s+/);
  if (words.length > 5) {
    const unique = new Set(words);
    if (unique.size < words.length * 0.3) {
      return { spam: true, reason: 'Repetitive content' };
    }
  }

  return { spam: false };
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxPerWindow = 5;

  const timestamps = RATE_LIMIT_MAP.get(userId) || [];
  const recent = timestamps.filter(t => now - t < windowMs);

  if (recent.length >= maxPerWindow) {
    return false; // Rate limited
  }

  recent.push(now);
  RATE_LIMIT_MAP.set(userId, recent);
  return true;
}

// POST /api/comments
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Login required to comment' }, { status: 401 });
  }

  // Rate limit: max 5 comments per minute
  if (!checkRateLimit(session.userId)) {
    return NextResponse.json({ error: 'Slow down! Max 5 comments per minute.' }, { status: 429 });
  }

  const body = await request.json();
  const { contentType, contentId, text, parentId } = body;

  if (!contentType || !contentId || !text?.trim()) {
    return NextResponse.json({ error: 'contentType, contentId, and text required' }, { status: 400 });
  }

  if (!['article', 'video', 'prediction'].includes(contentType)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  if (text.length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
  }

  // Spam check
  const spamCheck = isSpam(text);
  if (spamCheck.spam) {
    return NextResponse.json({ error: spamCheck.reason || 'Spam detected' }, { status: 400 });
  }

  // Duplicate comment check (same user, same content, last 5 min)
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
  const [duplicate] = await db
    .select({ id: comments.id })
    .from(comments)
    .where(
      and(
        eq(comments.userId, session.userId),
        eq(comments.body, text.trim()),
        eq(comments.status, 'active'),
      )
    )
    .limit(1);

  if (duplicate) {
    return NextResponse.json({ error: 'You already posted this comment' }, { status: 400 });
  }

  const [comment] = await db.insert(comments).values({
    userId: session.userId,
    contentType,
    contentId,
    parentId: parentId || null,
    body: text.trim(),
  }).returning();

  return NextResponse.json({ success: true, comment });
}

// DELETE /api/comments
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Comment id required' }, { status: 400 });
  }

  // Users can delete own comments, admins can delete any
  const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if (comment.userId !== session.userId && session.role !== 'admin' && session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await db.update(comments).set({ status: 'deleted' }).where(eq(comments.id, id));
  return NextResponse.json({ success: true });
}
