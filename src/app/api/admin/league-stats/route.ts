// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

  const results = await db.execute(sql`
    SELECT
      competition_slug,
      COUNT(*) as views,
      COUNT(DISTINCT DATE(created_at)) as active_days
    FROM page_views
    WHERE created_at > NOW() - INTERVAL '1 day' * ${days}
      AND competition_slug IS NOT NULL
    GROUP BY competition_slug
    ORDER BY views DESC
    LIMIT 50
  `);

  const byPageType = await db.execute(sql`
    SELECT page_type, COUNT(*) as views
    FROM page_views
    WHERE created_at > NOW() - INTERVAL '1 day' * ${days}
    GROUP BY page_type
    ORDER BY views DESC
  `);

  return NextResponse.json({
    period: `${days} days`,
    topLeagues: results,
    byPageType,
  });
}
