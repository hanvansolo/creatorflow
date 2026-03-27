// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, siteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Twitter auth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_PASS;

  if (!clientId) {
    return NextResponse.json({ error: 'TWITTER_CLIENT_ID not configured' }, { status: 500 });
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com'}/api/auth/twitter/callback`;

    // Build auth header — Basic Auth with client_id:client_secret
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: 'challenge',
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json({
        error: 'Token exchange failed',
        details: tokenData,
      }, { status: 400 });
    }

    // Store refresh token in DB
    if (tokenData.refresh_token) {
      await db.insert(siteSettings).values({
        key: 'twitter_refresh_token',
        value: tokenData.refresh_token,
        description: 'Twitter OAuth 2.0 refresh token (auto-rotated)',
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: tokenData.refresh_token, updatedAt: new Date() },
      });
    }

    // Store access token
    if (tokenData.access_token) {
      await db.insert(siteSettings).values({
        key: 'twitter_access_token',
        value: tokenData.access_token,
        description: `Twitter access token (expires in ${tokenData.expires_in}s)`,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: tokenData.access_token, updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Twitter/X connected! Auto-posting is now active.',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to exchange token',
      details: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
