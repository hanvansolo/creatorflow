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

  // Get page token and page ID from DB
  let pageToken: string | null = null;
  let pageId: string | null = null;

  try {
    let [row] = await db.select({ value: siteSettings.value }).from(siteSettings)
      .where(eq(siteSettings.key, 'facebook_page_token')).limit(1);
    if (!row) {
      [row] = await db.select({ value: siteSettings.value }).from(siteSettings)
        .where(eq(siteSettings.key, 'facebook_access_token')).limit(1);
    }
    pageToken = row?.value || process.env.FACEBOOK_ACCESS_TOKEN || null;

    const [pidRow] = await db.select({ value: siteSettings.value }).from(siteSettings)
      .where(eq(siteSettings.key, 'facebook_page_id')).limit(1);
    pageId = pidRow?.value || process.env.FACEBOOK_PAGE_ID || null;
  } catch (e) {
    return NextResponse.json({ error: 'DB error', details: (e as Error).message }, { status: 500 });
  }

  if (!pageToken || !pageId) {
    return NextResponse.json({ error: 'Missing page token or page ID', pageToken: !!pageToken, pageId: !!pageId }, { status: 400 });
  }

  // Query Graph API for Instagram Business Account linked to this page
  try {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();

    if (data.instagram_business_account?.id) {
      return NextResponse.json({
        instagram_account_id: data.instagram_business_account.id,
        instruction: 'Add this as INSTAGRAM_ACCOUNT_ID in Railway environment variables',
      });
    }

    return NextResponse.json({
      error: 'No Instagram Business Account linked to this page',
      raw: data,
      hint: 'Make sure the Instagram account is a Business/Creator account and linked to this Facebook Page',
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
