// @ts-nocheck — Stub API data, will be properly typed when rewritten for Footy Feed
import { NextRequest, NextResponse } from 'next/server';
import { getDeepDives, getDeepDiveCategories } from '@/lib/api/technical-deep-dives';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const [deepDives, categories] = await Promise.all([
      getDeepDives(category, limit),
      getDeepDiveCategories(),
    ]);

    return NextResponse.json({
      deepDives,
      categories,
      total: deepDives.length,
    });
  } catch (error) {
    console.error('[API] Failed to fetch deep-dives:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
