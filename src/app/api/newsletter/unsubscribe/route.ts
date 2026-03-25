import { NextRequest, NextResponse } from 'next/server';
import { db, newsletterSubscribers } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse('Missing email', { status: 400 });
  }

  const decoded = decodeURIComponent(email).toLowerCase();

  await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.email, decoded));

  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Unsubscribed - Footy Feed</title></head>
    <body style="background:#18181b; color:#d4d4d8; font-family:sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0;">
      <div style="text-align:center; padding:40px;">
        <h1 style="color:#fff; font-size:24px;">Unsubscribed</h1>
        <p style="color:#a1a1aa;">You've been removed from the Footy Feed newsletter.</p>
        <p style="color:#71717a; font-size:14px; margin-top:16px;">Changed your mind? <a href="https://footy-feed.com" style="color:#ef4444;">Visit Footy Feed</a> to resubscribe.</p>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  });
}
