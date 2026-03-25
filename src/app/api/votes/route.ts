import { NextRequest, NextResponse } from 'next/server';
import { db, articleVotes, newsArticles } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface VoteRequest {
  articleId: string;
  voteType: 1 | -1 | 0; // 1 = upvote, -1 = downvote, 0 = remove vote
}

export async function POST(request: NextRequest) {
  try {
    const body: VoteRequest = await request.json();
    const { articleId, voteType } = body;

    if (!articleId || ![1, -1, 0].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid request: articleId and voteType (1, -1, or 0) required' },
        { status: 400 }
      );
    }

    // Get user session or visitor ID
    const session = await getSession();
    const visitorId = request.headers.get('x-visitor-id');

    if (!session && !visitorId) {
      return NextResponse.json(
        { error: 'Must be logged in or provide visitor ID' },
        { status: 401 }
      );
    }

    // Verify article exists
    const [article] = await db
      .select({ id: newsArticles.id, voteScore: newsArticles.voteScore })
      .from(newsArticles)
      .where(eq(newsArticles.id, articleId))
      .limit(1);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Find existing vote
    let existingVote;
    if (session) {
      [existingVote] = await db
        .select()
        .from(articleVotes)
        .where(
          and(
            eq(articleVotes.articleId, articleId),
            eq(articleVotes.userId, session.userId)
          )
        )
        .limit(1);
    } else if (visitorId) {
      [existingVote] = await db
        .select()
        .from(articleVotes)
        .where(
          and(
            eq(articleVotes.articleId, articleId),
            eq(articleVotes.visitorId, visitorId)
          )
        )
        .limit(1);
    }

    let scoreDelta = 0;
    let newUserVote: 1 | -1 | null = voteType === 0 ? null : voteType;

    if (voteType === 0) {
      // Remove vote
      if (existingVote) {
        scoreDelta = -existingVote.voteType;
        if (session) {
          await db
            .delete(articleVotes)
            .where(
              and(
                eq(articleVotes.articleId, articleId),
                eq(articleVotes.userId, session.userId)
              )
            );
        } else {
          await db
            .delete(articleVotes)
            .where(
              and(
                eq(articleVotes.articleId, articleId),
                eq(articleVotes.visitorId, visitorId!)
              )
            );
        }
      }
    } else if (existingVote) {
      // Update existing vote
      if (existingVote.voteType !== voteType) {
        scoreDelta = voteType - existingVote.voteType; // e.g., going from -1 to 1 = +2
        await db
          .update(articleVotes)
          .set({ voteType, updatedAt: new Date() })
          .where(eq(articleVotes.id, existingVote.id));
      }
    } else {
      // Create new vote
      scoreDelta = voteType;
      await db.insert(articleVotes).values({
        articleId,
        userId: session?.userId || null,
        visitorId: session ? null : visitorId,
        voteType,
      });
    }

    // Update article vote score
    if (scoreDelta !== 0) {
      await db
        .update(newsArticles)
        .set({
          voteScore: sql`COALESCE(${newsArticles.voteScore}, 0) + ${scoreDelta}`,
        })
        .where(eq(newsArticles.id, articleId));
    }

    // Get updated score
    const [updatedArticle] = await db
      .select({ voteScore: newsArticles.voteScore })
      .from(newsArticles)
      .where(eq(newsArticles.id, articleId))
      .limit(1);

    return NextResponse.json({
      success: true,
      newScore: updatedArticle?.voteScore ?? 0,
      userVote: newUserVote,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get user's votes for multiple articles
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const visitorId = request.headers.get('x-visitor-id');
    const articleIds = request.nextUrl.searchParams.get('articleIds')?.split(',');

    if (!session && !visitorId) {
      return NextResponse.json({ votes: {} });
    }

    if (!articleIds || articleIds.length === 0) {
      return NextResponse.json({ votes: {} });
    }

    let votes;
    if (session) {
      votes = await db
        .select({
          articleId: articleVotes.articleId,
          voteType: articleVotes.voteType,
        })
        .from(articleVotes)
        .where(
          and(
            eq(articleVotes.userId, session.userId),
            sql`${articleVotes.articleId} IN (${sql.join(articleIds.map(id => sql`${id}`), sql`, `)})`
          )
        );
    } else {
      votes = await db
        .select({
          articleId: articleVotes.articleId,
          voteType: articleVotes.voteType,
        })
        .from(articleVotes)
        .where(
          and(
            eq(articleVotes.visitorId, visitorId!),
            sql`${articleVotes.articleId} IN (${sql.join(articleIds.map(id => sql`${id}`), sql`, `)})`
          )
        );
    }

    // Convert to a map
    const voteMap: Record<string, 1 | -1> = {};
    for (const vote of votes) {
      voteMap[vote.articleId] = vote.voteType as 1 | -1;
    }

    return NextResponse.json({ votes: voteMap });
  } catch (error) {
    console.error('Get votes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
