// @ts-nocheck — Stub API data, will be properly typed when rewritten for Footy Feed
import { NextRequest, NextResponse } from 'next/server';
import { generateUpcomingPreviews } from '@/lib/api/race-previews';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // Allow 3 minutes for AI processing

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '7', 10);

    console.log(`Generating race previews for races within ${daysAhead} days...`);
    const startTime = Date.now();

    // Generate previews for races within the specified days
    const results = await generateUpcomingPreviews(daysAhead);

    const duration = Date.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`Preview generation completed in ${duration}ms`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      previewsGenerated: successful,
      previewsFailed: failed,
      results,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Preview generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
