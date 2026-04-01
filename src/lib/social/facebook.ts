// @ts-nocheck
import { buildHashtags } from './twitter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

/**
 * Post to a Facebook Page using Graph API.
 * Posts a link with message (title + summary + hashtags).
 * Facebook auto-generates a preview card from OG tags.
 */
async function getPageToken(): Promise<string | null> {
  // Try DB first (stored by OAuth flow), then env vars
  try {
    const { db, siteSettings } = await import('@/lib/db');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, 'facebook_page_token')).limit(1);
    if (row?.value) return row.value;
  } catch { /* DB read failed */ }
  return process.env.FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_TOKEN || null;
}

export async function postToFacebook(
  title: string,
  slug: string,
  summary?: string,
  tags?: string[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = await getPageToken();

  if (!pageId || !pageToken) {
    return { success: false, error: 'Facebook credentials not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN.' };
  }

  const articleUrl = `${SITE_URL}/news/${slug}`;
  const hashtags = buildHashtags(title, tags || []);

  // Build message: title + summary snippet + URL + hashtags
  const summarySnippet = summary ? summary.slice(0, 200).replace(/\s+\S*$/, '...') : '';
  let message: string;
  if (summarySnippet) {
    message = `${title}\n\n${summarySnippet}\n\n${hashtags}`;
  } else {
    message = `${title}\n\n${hashtags}`;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        link: articleUrl,
        access_token: pageToken,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      console.log(`[Facebook] Posted ${data.id}`);
      return { success: true, id: data.id };
    }
    return { success: false, error: data.error?.message || JSON.stringify(data).slice(0, 300) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Post a custom message to Facebook Page (no rate limiting).
 * Used for kickoff alerts, goal alerts, etc.
 */
export async function postCustomFacebook(
  message: string,
  link?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = await getPageToken();

  if (!pageId || !pageToken) {
    return { success: false, error: 'Facebook not configured' };
  }

  try {
    const body: Record<string, string> = { message, access_token: pageToken };
    if (link) body.link = link;

    const res = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      console.log(`[Facebook] Custom post ${data.id}`);
      return { success: true, id: data.id };
    }
    return { success: false, error: data.error?.message || JSON.stringify(data).slice(0, 300) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Post to Instagram via the Meta Graph API (Instagram Content Publishing API).
 * Two-step process:
 *   1. Create a media container with image_url + caption
 *   2. Publish the container
 *
 * Requirements:
 *   - Image must be a publicly accessible URL (JPEG recommended)
 *   - Instagram Business Account connected to a Facebook Page
 *   - INSTAGRAM_ACCOUNT_ID env var set
 *   - FACEBOOK_ACCESS_TOKEN with instagram_basic + instagram_content_publish scopes
 */
export async function postToInstagram(
  title: string,
  slug: string,
  imageUrl: string,
  tags?: string[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  const igUserId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_TOKEN;

  if (!igUserId || !accessToken) {
    return { success: false, error: 'Instagram credentials not configured. Set INSTAGRAM_ACCOUNT_ID and FACEBOOK_ACCESS_TOKEN.' };
  }

  if (!imageUrl) {
    return { success: false, error: 'Instagram requires an image URL' };
  }

  const articleUrl = `${SITE_URL}/news/${slug}`;
  const hashtags = buildHashtags(title, tags || []);

  // Build caption: title + hashtags + link
  // Instagram doesn't make links clickable in captions, but include for reference
  const caption = `${title}\n\n${hashtags}\n\n${articleUrl}`;

  // Ensure image URL is absolute
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;

  try {
    // Step 1: Create media container
    const createRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: fullImageUrl,
        caption,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const createData = await createRes.json();

    if (!createRes.ok || !createData.id) {
      return {
        success: false,
        error: `Container creation failed: ${createData.error?.message || JSON.stringify(createData).slice(0, 300)}`,
      };
    }

    const containerId = createData.id;
    console.log(`[Instagram] Media container created: ${containerId}`);

    // Step 2: Wait briefly for container to be ready, then publish
    // The container may take a moment to process the image
    await new Promise(resolve => setTimeout(resolve, 3000));

    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const publishData = await publishRes.json();

    if (publishRes.ok && publishData.id) {
      console.log(`[Instagram] Published post ${publishData.id}`);
      return { success: true, id: publishData.id };
    }

    return {
      success: false,
      error: `Publish failed: ${publishData.error?.message || JSON.stringify(publishData).slice(0, 300)}`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
