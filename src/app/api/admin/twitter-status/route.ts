// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, siteSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const adminKey = process.env.CRON_KEY || 'dev-key';
  if (key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status: Record<string, any> = {
    env: {
      TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
      TWITTER_CLIENT_PASS: !!process.env.TWITTER_CLIENT_PASS,
      TWITTER_OAUTH2_TOKEN: !!process.env.TWITTER_OAUTH2_TOKEN,
      TWITTER_REFRESH_TOKEN: !!process.env.TWITTER_REFRESH_TOKEN,
    },
    db: {},
    tokenTest: null,
  };

  // Check DB tokens
  try {
    const [refreshRow] = await db.select({ value: siteSettings.value, updatedAt: siteSettings.updatedAt })
      .from(siteSettings).where(eq(siteSettings.key, 'twitter_refresh_token')).limit(1);
    status.db.refresh_token = refreshRow ? {
      exists: true,
      length: refreshRow.value?.length,
      prefix: refreshRow.value?.slice(0, 10) + '...',
      updatedAt: refreshRow.updatedAt,
    } : { exists: false };

    const [accessRow] = await db.select({ value: siteSettings.value, updatedAt: siteSettings.updatedAt })
      .from(siteSettings).where(eq(siteSettings.key, 'twitter_access_token')).limit(1);
    status.db.access_token = accessRow ? {
      exists: true,
      length: accessRow.value?.length,
      prefix: accessRow.value?.slice(0, 10) + '...',
      updatedAt: accessRow.updatedAt,
    } : { exists: false };
  } catch (e) {
    status.db.error = (e as Error).message;
  }

  // Try to refresh the token
  try {
    const refreshToken = status.db.refresh_token?.exists
      ? (await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, 'twitter_refresh_token')).limit(1))[0]?.value
      : process.env.TWITTER_REFRESH_TOKEN;

    if (refreshToken && process.env.TWITTER_CLIENT_ID) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (process.env.TWITTER_CLIENT_PASS) {
        headers['Authorization'] = `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_PASS}`).toString('base64')}`;
      }

      const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers,
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.TWITTER_CLIENT_ID,
        }).toString(),
        signal: AbortSignal.timeout(10000),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (res.ok && data.access_token) {
        status.tokenTest = {
          success: true,
          expires_in: data.expires_in,
          scope: data.scope,
          new_refresh_token: !!data.refresh_token,
        };

        // Store the new tokens since we just consumed the old refresh token
        if (data.refresh_token) {
          await db.insert(siteSettings).values({
            key: 'twitter_refresh_token',
            value: data.refresh_token,
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: siteSettings.key,
            set: { value: data.refresh_token, updatedAt: new Date() },
          });
        }
        if (data.access_token) {
          await db.insert(siteSettings).values({
            key: 'twitter_access_token',
            value: data.access_token,
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: siteSettings.key,
            set: { value: data.access_token, updatedAt: new Date() },
          });
        }
        status.tokenTest.stored = true;
      } else {
        status.tokenTest = {
          success: false,
          status: res.status,
          error: data.error || data.error_description || text.slice(0, 300),
          action: 'Re-authorize at /api/auth/twitter',
        };
      }
    } else {
      status.tokenTest = { skipped: true, reason: !refreshToken ? 'No refresh token' : 'No client ID' };
    }
  } catch (e) {
    status.tokenTest = { error: (e as Error).message };
  }

  return NextResponse.json(status);
}
