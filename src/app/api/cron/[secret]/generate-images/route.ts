import { NextRequest, NextResponse } from 'next/server';
import { generateMissingImages, regenerateAiImages, fixBrokenImages } from '@/lib/api/image-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

interface RouteParams {
  params: Promise<{ secret: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { secret } = await params;

  // Verify cron secret
  if (secret !== process.env.CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'generate';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    if (mode === 'regenerate') {
      // Replace AI images with scraped real images where possible
      console.log(`[Cron] Starting AI image replacement job (limit: ${limit})...`);

      const result = await regenerateAiImages(limit);

      console.log(`[Cron] Replacement complete: ${result.scraped} scraped, ${result.skipped} kept, ${result.failed} failed`);

      return NextResponse.json({
        success: true,
        mode: 'regenerate',
        replaced: result.success,
        scraped: result.scraped,
        skipped: result.skipped,
        failed: result.failed,
      });
    }

    if (mode === 'fix-broken') {
      // Fix broken external image URLs
      console.log(`[Cron] Starting broken image fix job (limit: ${limit})...`);

      const result = await fixBrokenImages(limit);

      console.log(`[Cron] Fix complete: ${result.success} fixed, ${result.failed} still broken`);

      return NextResponse.json({
        success: true,
        mode: 'fix-broken',
        checked: result.checked,
        fixed: result.success,
        stillBroken: result.failed,
      });
    }

    // Default: find missing images (scrape first, AI as last resort)
    console.log(`[Cron] Starting image job (limit: ${limit})...`);

    const result = await generateMissingImages(limit);

    console.log(`[Cron] Image job complete: ${result.scraped} scraped, ${result.aiGenerated} AI-generated, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      mode: 'generate',
      total: result.success,
      scraped: result.scraped,
      aiGenerated: result.aiGenerated,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[Cron] Image job failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
