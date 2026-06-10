import { NextRequest, NextResponse } from 'next/server';
import { db, pushSubscriptions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Save (or refresh) a Web Push subscription. Idempotent — re-posting the
 * same subscription updates last_seen_at and re-activates if it was
 * previously marked dead.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const ua = request.headers.get('user-agent') || null;
    const now = new Date();

    await db
      .insert(pushSubscriptions)
      .values({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: ua,
        active: true,
        createdAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: ua,
          active: true,
          lastSeenAt: now,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[push/subscribe] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
