// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, siteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Facebook OAuth callback handler.
 * Exchanges the authorization code for a short-lived token,
 * then exchanges that for a long-lived Page Access Token.
 *
 * Flow:
 *   1. User visits /api/auth/facebook → redirects to Facebook Login
 *   2. Facebook redirects back here with ?code=...
 *   3. Exchange code → short-lived user token
 *   4. Exchange short-lived → long-lived user token
 *   5. Get Page Access Token from the long-lived user token
 *   6. Store Page Access Token + Instagram Account ID in DB
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.json({
      error: `Facebook auth error: ${error}`,
      description: request.nextUrl.searchParams.get('error_description'),
    }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID and FACEBOOK_APP_SECRET not configured' }, { status: 500 });
  }

  try {
    const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

    // Step 1: Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }).toString()
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json({
        error: 'Token exchange failed',
        details: tokenData,
      }, { status: 400 });
    }

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: tokenData.access_token,
      }).toString()
    );

    const longLivedData = await longLivedRes.json();

    if (!longLivedRes.ok || !longLivedData.access_token) {
      return NextResponse.json({
        error: 'Long-lived token exchange failed',
        details: longLivedData,
      }, { status: 400 });
    }

    const longLivedUserToken = longLivedData.access_token;

    // Step 3: Get user's Facebook Pages (we need the Page Access Token)
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !pagesData.data?.length) {
      return NextResponse.json({
        error: 'No Facebook Pages found. Make sure the user manages at least one Page.',
        details: pagesData,
      }, { status: 400 });
    }

    // Use the first page (or the one matching FACEBOOK_PAGE_ID if set)
    const targetPageId = process.env.FACEBOOK_PAGE_ID;
    const page = targetPageId
      ? pagesData.data.find((p: any) => p.id === targetPageId) || pagesData.data[0]
      : pagesData.data[0];

    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    // Store Page Access Token in DB
    await db.insert(siteSettings).values({
      key: 'facebook_access_token',
      value: pageAccessToken,
      description: `Facebook Page Access Token for "${pageName}" (long-lived, ~60 days)`,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: pageAccessToken, updatedAt: new Date() },
    });

    // Store Page ID in DB
    await db.insert(siteSettings).values({
      key: 'facebook_page_id',
      value: pageId,
      description: `Facebook Page ID for "${pageName}"`,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: pageId, updatedAt: new Date() },
    });

    // Step 4: Try to get Instagram Business Account connected to this Page
    let instagramAccountId: string | null = null;
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        instagramAccountId = igData.instagram_business_account.id;
        await db.insert(siteSettings).values({
          key: 'instagram_account_id',
          value: instagramAccountId,
          description: `Instagram Business Account ID connected to "${pageName}"`,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: instagramAccountId, updatedAt: new Date() },
        });
      }
    } catch (igErr) {
      console.error('[Facebook OAuth] Failed to fetch Instagram account:', igErr);
    }

    return NextResponse.json({
      success: true,
      message: `Facebook Page "${pageName}" connected! Auto-posting is now active.`,
      pageId,
      pageName,
      instagramAccountId,
      availablePages: pagesData.data.map((p: any) => ({ id: p.id, name: p.name })),
    });
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to exchange token',
      details: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
