import { NextRequest, NextResponse } from 'next/server';
import { db, newsletterSubscribers } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, source, timezone } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if already subscribed
    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Resubscribe
        await db
          .update(newsletterSubscribers)
          .set({ status: 'active', unsubscribedAt: null, source: source || 'popup', timezone: timezone || 'UTC' })
          .where(eq(newsletterSubscribers.id, existing.id));
        return NextResponse.json({ success: true, resubscribed: true });
      }
      return NextResponse.json({ success: true, already: true });
    }

    await db.insert(newsletterSubscribers).values({
      email: email.trim().toLowerCase(),
      source: source || 'popup',
      timezone: timezone || 'UTC',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
