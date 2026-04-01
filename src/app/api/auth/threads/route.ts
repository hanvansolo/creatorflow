// @ts-nocheck
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appId = process.env.THREADS_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: 'THREADS_APP_ID not set' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com'}/api/auth/threads/callback`;
  const scope = 'threads_basic,threads_content_publish';

  const authUrl = `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
