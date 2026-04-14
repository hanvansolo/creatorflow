// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, matches } from '@/lib/db';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reset socialPosted for all currently live matches so they get re-posted
  const result = await db.execute(sql`
    UPDATE matches
    SET social_posted = FALSE
    WHERE status IN ('live', 'halftime', 'extra_time', 'penalties')
    RETURNING id, home_club_id, away_club_id, status, minute
  `);

  const resetMatches = result as any[];

  // Get match names for the response
  const matchDetails = [];
  for (const m of resetMatches) {
    const [details] = await db.execute(sql`
      SELECT hc.name as home, ac.name as away, m.status, m.minute
      FROM matches m
      JOIN clubs hc ON m.home_club_id = hc.id
      JOIN clubs ac ON m.away_club_id = ac.id
      WHERE m.id = ${m.id}::uuid
    `);
    if (details) matchDetails.push(details);
  }

  return NextResponse.json({
    message: `Reset ${resetMatches.length} live matches for re-posting`,
    matches: matchDetails,
    nextStep: 'Live-sync cron will re-post these on next run (1 min)',
  });
}
