// @ts-nocheck — Stub API data, will be properly typed when rewritten for Footy Feed
import { NextRequest, NextResponse } from 'next/server';
import { extractTechnicalDeepDives } from '@/lib/api/technical-deep-dives';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get limit from query params (default 5)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    console.log(`[Cron] Extracting technical deep-dives (limit: ${limit})...`);
    const startTime = Date.now();

    const result = await extractTechnicalDeepDives(limit);

    const duration = Date.now() - startTime;

    console.log(`[Cron] Deep-dive extraction completed in ${duration}ms`);
    console.log(`  Scanned: ${result.scanned}`);
    console.log(`  Generated: ${result.generated}`);
    console.log(`  Skipped: ${result.skipped}`);

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      generated: result.generated,
      skipped: result.skipped,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[Cron] Deep-dive extraction failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
