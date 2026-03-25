import { NextRequest, NextResponse } from 'next/server';
import { getScenarioBySlug } from '@/lib/api/what-if';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const scenario = await getScenarioBySlug(slug);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scenario,
    });
  } catch (error) {
    console.error('Failed to fetch What If scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
