import { NextRequest, NextResponse } from 'next/server';
import { generateMissingImages } from '@/lib/api/image-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-key';

export async function POST(request: NextRequest) {
  // Check API key
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get optional limit from request body
    let limit = 10;
    try {
      const body = await request.json();
      if (body.limit && typeof body.limit === 'number') {
        limit = Math.min(body.limit, 50); // Cap at 50 to avoid long-running requests
      }
    } catch {
      // No body or invalid JSON, use default limit
    }

    console.log(`[Admin] Starting image generation for up to ${limit} articles...`);

    const result = await generateMissingImages(limit);

    console.log(`[Admin] Image generation complete: ${result.success} success, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      generated: result.success,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[Admin] Image generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with Authorization: Bearer <ADMIN_API_KEY> to generate images for articles without them',
    options: {
      limit: 'Number of articles to process (default: 10, max: 50)',
    },
  });
}
