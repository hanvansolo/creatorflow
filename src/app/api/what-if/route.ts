import { NextRequest, NextResponse } from 'next/server';
import { getPopularScenarios, getRecentScenarios, getOrGenerateWhatIf } from '@/lib/api/what-if';

export const dynamic = 'force-dynamic';

// Rate limiting for on-demand generation
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // 5 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'popular';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    let scenarios;
    if (type === 'recent') {
      scenarios = await getRecentScenarios(limit);
    } else {
      scenarios = await getPopularScenarios(limit);
    }

    return NextResponse.json({
      success: true,
      scenarios,
    });
  } catch (error) {
    console.error('Failed to fetch What If scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before submitting another question.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 500) {
      return NextResponse.json(
        { error: 'Question must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Validate it's football related (basic check)
    const f1Keywords = [
      // General terms
      'f1', 'formula 1', 'formula one', 'driver', 'team', 'race', 'championship', 'grand prix', 'gp',
      // Race terms
      'safety car', 'pit stop', 'pit lane', 'drs', 'podium', 'pole', 'qualifying', 'sprint', 'grid',
      'overtake', 'tyre', 'tire', 'pitstop', 'lap', 'sector', 'dnf', 'fastest lap',
      // Drivers
      'hamilton', 'verstappen', 'leclerc', 'norris', 'sainz', 'russell', 'perez', 'alonso', 'stroll',
      'ocon', 'gasly', 'ricciardo', 'tsunoda', 'bottas', 'zhou', 'magnussen', 'hulkenberg', 'albon',
      'sargeant', 'piastri', 'lawson', 'colapinto', 'bearman', 'antonelli', 'schumacher', 'vettel',
      // Teams
      'ferrari', 'red bull', 'redbull', 'mercedes', 'mclaren', 'aston martin', 'alpine', 'williams',
      'haas', 'sauber', 'alfa romeo', 'alphatauri', 'toro rosso', 'racing point', 'rb',
      // Circuits
      'monaco', 'silverstone', 'monza', 'spa', 'suzuka', 'interlagos', 'bahrain', 'jeddah', 'miami',
      'las vegas', 'abu dhabi', 'singapore', 'barcelona', 'imola', 'baku', 'melbourne', 'montreal',
      'zandvoort', 'hungaroring', 'austin', 'mexico', 'qatar', 'shanghai', 'spielberg',
      // Historical
      'senna', 'prost', 'lauda', 'piquet', 'mansell', 'hakkinen', 'raikkonen', 'button', 'rosberg',
    ];
    const hasF1Keyword = f1Keywords.some(keyword => trimmedQuestion.toLowerCase().includes(keyword));
    if (!hasF1Keyword) {
      return NextResponse.json(
        { error: 'Please ask an F1-related question' },
        { status: 400 }
      );
    }

    const result = await getOrGenerateWhatIf(trimmedQuestion);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate analysis. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scenario: result.scenario,
      isNew: result.isNew,
    });
  } catch (error) {
    console.error('Failed to process What If question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
