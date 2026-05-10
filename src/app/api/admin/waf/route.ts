// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, requestSamples } from '@/lib/db';
import { sql, and, gte, eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hours = Math.max(1, Math.min(168, parseInt(request.nextUrl.searchParams.get('hours') || '24', 10)));
  const limit = Math.max(1, Math.min(500, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
  const recent = request.nextUrl.searchParams.get('recent') === '1';
  const country = request.nextUrl.searchParams.get('country');
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const where = country
    ? and(gte(requestSamples.createdAt, since), eq(requestSamples.country, country))
    : gte(requestSamples.createdAt, since);

  if (recent) {
    const rows = await db
      .select()
      .from(requestSamples)
      .where(where)
      .orderBy(desc(requestSamples.createdAt))
      .limit(limit);
    return NextResponse.json({ windowHours: hours, count: rows.length, rows });
  }

  const [totalsRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      blocked: sql<number>`sum(case when ${requestSamples.blocked} then 1 else 0 end)::int`,
      uniqueIps: sql<number>`count(distinct ${requestSamples.ipHash})::int`,
      uniqueUas: sql<number>`count(distinct ${requestSamples.ua})::int`,
    })
    .from(requestSamples)
    .where(where);

  const topCountries = await db
    .select({
      country: requestSamples.country,
      count: sql<number>`count(*)::int`,
      uniqueIps: sql<number>`count(distinct ${requestSamples.ipHash})::int`,
    })
    .from(requestSamples)
    .where(where)
    .groupBy(requestSamples.country)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const topUserAgents = await db
    .select({
      ua: requestSamples.ua,
      count: sql<number>`count(*)::int`,
      countries: sql<string>`string_agg(distinct ${requestSamples.country}, ',' order by ${requestSamples.country})`,
    })
    .from(requestSamples)
    .where(where)
    .groupBy(requestSamples.ua)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const topPaths = await db
    .select({
      path: requestSamples.path,
      count: sql<number>`count(*)::int`,
    })
    .from(requestSamples)
    .where(where)
    .groupBy(requestSamples.path)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const topReferers = await db
    .select({
      referer: requestSamples.referer,
      count: sql<number>`count(*)::int`,
    })
    .from(requestSamples)
    .where(where)
    .groupBy(requestSamples.referer)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const topIps = await db
    .select({
      ipHash: requestSamples.ipHash,
      country: sql<string>`max(${requestSamples.country})`,
      ua: sql<string>`max(${requestSamples.ua})`,
      count: sql<number>`count(*)::int`,
      paths: sql<number>`count(distinct ${requestSamples.path})::int`,
    })
    .from(requestSamples)
    .where(where)
    .groupBy(requestSamples.ipHash)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const blockReasons = await db
    .select({
      reason: requestSamples.reason,
      count: sql<number>`count(*)::int`,
    })
    .from(requestSamples)
    .where(and(where, eq(requestSamples.blocked, true)))
    .groupBy(requestSamples.reason)
    .orderBy(sql`count(*) desc`);

  return NextResponse.json({
    windowHours: hours,
    note: 'samples only — multiply by 1/WAF_SAMPLE_RATE for est. true volume',
    sampleRate: parseFloat(process.env.WAF_SAMPLE_RATE || '0.1'),
    totals: totalsRow,
    topCountries,
    topUserAgents,
    topPaths,
    topReferers,
    topIps,
    blockReasons,
  });
}
