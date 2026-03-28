// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Initiates the Facebook OAuth flow.
 * Visit /api/auth/facebook to start authorization.
 * Requests permissions for Page management and Instagram publishing.
 */
export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID;

  if (!appId) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID not set' }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';
  const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

  // Scopes needed for Page posting and Instagram publishing
  const scope = [
    'pages_manage_posts',     // Post to Facebook Pages
    'pages_read_engagement',  // Read Page data
    'instagram_basic',        // Instagram account info
    'instagram_content_publish', // Post to Instagram
  ].join(',');

  const state = Math.random().toString(36).substring(2);

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(authUrl.toString());
}
