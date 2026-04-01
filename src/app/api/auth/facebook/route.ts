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

  // Use only the scopes available for your app's use cases
  // "Manage everything on your Page" gives: pages_show_list, pages_read_engagement, pages_manage_posts
  // "Manage messaging & content on Instagram" gives: instagram_basic, instagram_content_publish
  // These must match what's enabled in the app's Use Cases
  const scope = [
    'public_profile',
    'pages_show_list',
    'pages_manage_posts',
  ].join(',');

  const state = Math.random().toString(36).substring(2);

  const authUrl = new URL('https://www.facebook.com/v25.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(authUrl.toString());
}
