import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesisArticles } from '@/lib/api/analysis-synthesis';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  const cronKey = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

  if (secret !== cronKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await generateSynthesisArticles();

  return NextResponse.json({
    message: result.generated > 0
      ? `Generated ${result.generated} analysis piece(s)`
      : 'No new analysis pieces generated',
    ...result,
  });
}
