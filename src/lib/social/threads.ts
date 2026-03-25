const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://footy-feed.com';

/**
 * Post to Threads using Meta's Threads API.
 * Supports text posts and image posts.
 */
export async function postToThreads(title: string, slug: string, imageUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const userId = process.env.THREADS_USER_ID;
  const accessToken = process.env.THREADS_ACCESS_TOKEN;

  if (!userId || !accessToken) {
    return { success: false, error: 'Threads credentials not configured' };
  }

  const url = `${SITE_URL}/news/${slug}`;
  const text = `${title}\n\n${url}\n\n#Football #Soccer`;
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
      return { success: false, error: createData.error?.message || JSON.stringify(createData) };
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
