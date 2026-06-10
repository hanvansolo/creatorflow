import { NextRequest, NextResponse } from 'next/server';
import { db, pushSubscriptions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Mark a subscription dead. Used by the client when the user revokes
 * permission or clicks "unsubscribe" in the prompt UI.
 */
export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }
    await db
      .update(pushSubscriptions)
      .set({ active: false })
      .where(eq(pushSubscriptions.endpoint, endpoint));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[push/unsubscribe] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
