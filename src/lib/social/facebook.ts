const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

/**
 * Post to a Facebook Page using Graph API.
 * Posts with link (which auto-generates preview with image from OG tags)
 * and can also attach a photo directly.
 */
export async function postToFacebook(title: string, slug: string, summary?: string, imageUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_TOKEN;

  if (!pageId || !pageToken) {
    return { success: false, error: 'Facebook credentials not configured' };
  }

  const url = `${SITE_URL}/news/${slug}`;
  const message = summary ? `${title}\n\n${summary}` : title;

  try {
    // If we have an image, post as photo with link in message
    if (imageUrl) {
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${message}\n\n${url}`,
          url: fullImageUrl,
          access_token: pageToken,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        return { success: true, id: data.id };
      }
      // Fall through to link post if photo fails
      console.error('[Facebook] Photo post failed, trying link post:', data.error?.message);
    }

    // Link post (Facebook auto-generates image preview from OG tags)
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        link: url,
        access_token: pageToken,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return { success: true, id: data.id };
    }
    return { success: false, error: data.error?.message || JSON.stringify(data) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
