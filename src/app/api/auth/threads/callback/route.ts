// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, siteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Threads auth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_PASS;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com'}/api/auth/threads/callback`;

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'THREADS_APP_ID or THREADS_APP_PASS not set' }, { status: 500 });
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json({ error: 'Token exchange failed', details: tokenData }, { status: 400 });
    }

    // Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();

    const finalToken = longLivedData.access_token || tokenData.access_token;
    const userId = tokenData.user_id;

    // Store in DB
    await db.insert(siteSettings).values({
      key: 'threads_access_token',
      value: finalToken,
      description: `Threads access token (long-lived, expires in ${longLivedData.expires_in || 'unknown'}s)`,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: finalToken, updatedAt: new Date() },
    });

    if (userId) {
      await db.insert(siteSettings).values({
        key: 'threads_user_id',
        value: String(userId),
        description: 'Threads User ID',
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: String(userId), updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Threads connected! Auto-posting is now active.',
      userId,
      tokenType: longLivedData.access_token ? 'long-lived' : 'short-lived',
    });
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to exchange token',
      details: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
