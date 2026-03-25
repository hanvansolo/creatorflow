import { NextRequest, NextResponse } from 'next/server';
import { updatePreviewsAfterSessions } from '@/lib/api/race-previews';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // Allow 3 minutes for AI processing

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

/**
 * Cron job to update race previews after sessions complete.
 * This should run every 30-60 minutes during race weekends.
 *
 * It will:
 * 1. Find races that are currently in progress (race weekend)
 * 2. Check which sessions have completed since the last preview update
 * 3. Regenerate previews with updated predictions based on session data
 * 4. Track prediction changes for the live updates feed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking for sessions that need preview updates...');
    const startTime = Date.now();

    const results = await updatePreviewsAfterSessions();

    const duration = Date.now() - startTime;
    const updated = results.filter((r) => r.updated).length;
    const skipped = results.filter((r) => !r.updated).length;

    console.log(`Preview update check completed in ${duration}ms`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      previewsUpdated: updated,
      previewsSkipped: skipped,
      results,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Preview update failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
