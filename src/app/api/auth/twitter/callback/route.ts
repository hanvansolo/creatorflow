// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, siteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Twitter OAuth 2.0 callback handler.
 * Exchanges the authorization code for access + refresh tokens.
 * Stores the refresh token in the database for persistent use.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Twitter auth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'TWITTER_CLIENT_ID not configured' }, { status: 500 });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com'}/api/auth/twitter/callback`,
        code_verifier: 'challenge', // PKCE — must match what was used in the auth URL
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
        set: {
          value: tokenData.refresh_token,
          updatedAt: new Date(),
        },
      });
    }

    // Store access token info
    if (tokenData.access_token) {
      await db.insert(siteSettings).values({
        key: 'twitter_access_token',
        value: tokenData.access_token,
        description: `Twitter access token (expires in ${tokenData.expires_in}s)`,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: tokenData.access_token,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Twitter connected! Auto-posting is now active.',
      token_type: tokenData.token_type,
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
