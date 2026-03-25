import { NextRequest, NextResponse } from 'next/server';
import { generateDailyRoundup } from '@/lib/api/daily-roundup';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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

    console.log('Generating daily roundup...');
    const startTime = Date.now();

    const result = await generateDailyRoundup();

    const duration = Date.now() - startTime;

    console.log(`Daily roundup generated in ${duration}ms`);
    console.log(`  Verified: ${result.verified.articles.length} articles`);
    console.log(`  Unverified: ${result.unverified.articles.length} articles`);
    console.log(`  Rumour: ${result.rumour.articles.length} articles`);
    console.log(`  Roundup article: ${result.roundupArticleId || 'not generated'}`);

    return NextResponse.json({
      success: true,
      date: result.date,
      verified: {
        count: result.verified.articles.length,
        hasSummary: !!result.verified.summary,
      },
      unverified: {
        count: result.unverified.articles.length,
        hasSummary: !!result.unverified.summary,
      },
      rumour: {
        count: result.rumour.articles.length,
        hasSummary: !!result.rumour.summary,
      },
      roundupArticleId: result.roundupArticleId || null,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Daily roundup generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
