// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Lightweight page view tracker — called from client components
export async function POST(request: NextRequest) {
  try {
    const { pageType, pageSlug, competitionSlug } = await request.json();
    if (!pageType) return NextResponse.json({ ok: true });

    await db.execute(sql`
      INSERT INTO page_views (page_type, page_slug, competition_slug)
      VALUES (${pageType}, ${pageSlug || null}, ${competitionSlug || null})
    `);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail
  }
}
