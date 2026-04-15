const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

/**
 * Post to Threads using Meta's Threads API.
 * Supports text posts and image posts.
 */
export async function postToThreads(title: string, slug: string, imageUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  // Env vars take priority, then DB (env is freshest source of truth)
  let userId = process.env.THREADS_USER_ID;
  let accessToken = process.env.THREADS_ACCESS_TOKEN;

  if (!userId || !accessToken) {
    try {
      const { db, siteSettings } = await import('@/lib/db');
      const { eq } = await import('drizzle-orm');
      if (!accessToken) {
        const [tokenRow] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, 'threads_access_token')).limit(1);
        if (tokenRow?.value) accessToken = tokenRow.value;
      }
      if (!userId) {
        const [userRow] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, 'threads_user_id')).limit(1);
        if (userRow?.value) userId = userRow.value;
      }
    } catch { /* DB read failed */ }
  }

  console.log(`[Threads] userId: ${userId?.slice(0, 8)}..., token: ${accessToken ? accessToken.slice(0, 10) + '...' : 'MISSING'}`);

  if (!userId || !accessToken) {
    return { success: false, error: 'Threads credentials not configured' };
  }

  // If title already contains hashtags (from social-pulse), use as-is
  // Otherwise build standard format with URL and smart hashtags
  const hasHashtags = title.includes('#');
  let text: string;
  if (hasHashtags) {
    text = title;
  } else {
    const { buildHashtags } = await import('./twitter');
    const hashtags = buildHashtags(title, []);
    const url = slug.startsWith('http') ? slug : `${SITE_URL}/news/${slug}`;
    text = `${title}\n\n${url}\n\n${hashtags}`;
  }
  const truncated = text.length > 500 ? text.slice(0, 497) + '...' : text;

  try {
    // Build container - with image if available
    const containerPayload: Record<string, string> = {
      text: truncated,
      access_token: accessToken,
    };

    if (imageUrl) {
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
      containerPayload.media_type = 'IMAGE';
      containerPayload.image_url = fullImageUrl;
    } else {
      containerPayload.media_type = 'TEXT';
    }

    // Step 1: Create media container
    const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerPayload),
      signal: AbortSignal.timeout(15000),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      const detail = JSON.stringify({ status: createRes.status, error: createData.error, body: createData }).slice(0, 500);
      console.error(`[Threads] Create container failed: ${detail}`);
      return { success: false, error: `create: ${detail}` };
    }

    // Wait for media processing (Threads requires a short delay for images)
    if (imageUrl) {
      await new Promise(r => setTimeout(r, 3000));
    }

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const publishData = await publishRes.json();
    if (publishRes.ok && publishData.id) {
      console.log(`[Threads] Posted${imageUrl ? ' with image' : ''}`);
      return { success: true, id: publishData.id };
    }
    return { success: false, error: publishData.error?.message || JSON.stringify(publishData) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
