// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Initiates the Twitter OAuth 2.0 PKCE flow.
 * Visit this URL to authorize the app: /api/auth/twitter
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.TWITTER_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'TWITTER_CLIENT_ID not set' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com'}/api/auth/twitter/callback`;
  const scope = 'tweet.read tweet.write users.read offline.access media.write';
  const state = Math.random().toString(36).substring(2);

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', 'challenge');
  authUrl.searchParams.set('code_challenge_method', 'plain');

  return NextResponse.redirect(authUrl.toString());
}
