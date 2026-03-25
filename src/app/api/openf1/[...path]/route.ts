import { NextRequest, NextResponse } from 'next/server';
import { getOpenF1AuthHeaders } from '@/lib/api/openf1/token';

export const dynamic = 'force-dynamic';

const OPENF1_BASE = 'https://api.openf1.org/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = `/${path.join('/')}`;

  // Forward query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${OPENF1_BASE}${endpoint}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const authHeaders = await getOpenF1AuthHeaders();

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...authHeaders,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenF1 API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`OpenF1 proxy error for ${endpoint}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch from OpenF1' },
      { status: 502 }
    );
  }
}
