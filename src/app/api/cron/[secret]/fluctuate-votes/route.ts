import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  if (secret !== process.env.CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Randomly adjust vote scores by -3 to +5 for recent articles (last 7 days)
    // This creates organic-feeling fluctuation with a slight upward bias
    await db.execute(sql`
      UPDATE news_articles
      SET vote_score = GREATEST(0, COALESCE(vote_score, 0) + floor(random() * 9) - 3)
      WHERE published_at > NOW() - INTERVAL '7 days'
    `);

    // Occasionally give a boost to high-quality articles (verified sources)
    await db.execute(sql`
      UPDATE news_articles
      SET vote_score = COALESCE(vote_score, 0) + floor(random() * 3)
      WHERE published_at > NOW() - INTERVAL '3 days'
        AND credibility_rating = 'verified'
        AND random() < 0.3
    `);

    return NextResponse.json({
      success: true,
      message: 'Vote scores fluctuated successfully'
    });
  } catch (error) {
    console.error('Error fluctuating votes:', error);
    return NextResponse.json(
      { error: 'Failed to fluctuate votes' },
      { status: 500 }
    );
  }
}
