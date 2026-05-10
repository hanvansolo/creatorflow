import { NextRequest, NextResponse } from 'next/server';
import { db, requestSamples } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authToken(): string | null {
  return process.env.WAF_TOKEN || process.env.CRON_KEY || null;
}

export async function POST(request: NextRequest) {
  const expected = authToken();
  if (!expected) {
    return NextResponse.json({ error: 'WAF_TOKEN/CRON_KEY not configured' }, { status: 500 });
  }
  if (request.headers.get('x-waf-token') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await db.insert(requestSamples).values({
      country: body.country?.slice(0, 4) ?? null,
      ipHash: body.ipHash?.slice(0, 16) ?? null,
      ua: body.ua?.slice(0, 4000) ?? null,
      path: body.path?.slice(0, 500) ?? null,
      method: body.method?.slice(0, 8) ?? null,
      referer: body.referer?.slice(0, 4000) ?? null,
      acceptLanguage: body.acceptLanguage?.slice(0, 200) ?? null,
      cfRay: body.cfRay?.slice(0, 50) ?? null,
      blocked: !!body.blocked,
      reason: body.reason?.slice(0, 50) ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
