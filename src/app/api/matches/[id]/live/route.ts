// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get match status + score
  const matchResult = await db.execute(sql`
    SELECT status, minute, home_score, away_score, home_score_ht, away_score_ht
    FROM matches WHERE id = ${id}
  `);
  const match = (matchResult as any[])[0];
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get events
  const events = await db.execute(sql`
    SELECT me.*,
      p.known_as as player_known_as, p.first_name as player_first_name, p.last_name as player_last_name,
      sp.known_as as second_player_known_as, sp.first_name as second_player_first_name, sp.last_name as second_player_last_name,
      c.name as club_name, c.code as club_code
    FROM match_events me
    LEFT JOIN players p ON me.player_id = p.id
    LEFT JOIN players sp ON me.second_player_id = sp.id
    LEFT JOIN clubs c ON me.club_id = c.id
    WHERE me.match_id = ${id}
    ORDER BY me.minute ASC, me.added_time ASC NULLS FIRST
  `);

  // Get stats
  const stats = await db.execute(sql`
    SELECT * FROM match_stats WHERE match_id = ${id}
  `);
  const homeStats = (stats as any[]).find(s => s.is_home) || null;
  const awayStats = (stats as any[]).find(s => !s.is_home) || null;

  // Get latest analysis
  const analyses = await db.execute(sql`
    SELECT * FROM match_analysis WHERE match_id = ${id} ORDER BY created_at DESC LIMIT 1
  `);

  return NextResponse.json({
    status: match.status,
    minute: match.minute,
    homeScore: match.home_score,
    awayScore: match.away_score,
    homeScoreHt: match.home_score_ht,
    awayScoreHt: match.away_score_ht,
    events: events as any[],
    homeStats,
    awayStats,
    latestAnalysis: (analyses as any[])[0] || null,
  });
}
