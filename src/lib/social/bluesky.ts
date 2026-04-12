const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

/**
 * Post to Bluesky with embedded link card (shows image + title + description).
 */
export async function postToBluesky(title: string, slug: string, tags?: string[], imageUrl?: string): Promise<{ success: boolean; uri?: string; error?: string }> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !password) {
    return { success: false, error: 'Bluesky credentials not configured' };
  }

  // If slug is already a full URL, use it directly; otherwise build /news/ URL
  const articleUrl = slug.startsWith('http') ? slug : `${SITE_URL}/news/${slug}`;

  try {
    // Login
    const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password }),
      signal: AbortSignal.timeout(10000),
    });

    if (!sessionRes.ok) {
      return { success: false, error: `Auth failed: ${sessionRes.status}` };
    }

    const session = await sessionRes.json();
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessJwt}`,
    };

    // Upload image as blob if available
    let thumbBlob = null;
    if (imageUrl) {
      try {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
        const imgRes = await fetch(fullUrl, { signal: AbortSignal.timeout(10000) });
        if (imgRes.ok) {
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

          const uploadRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.accessJwt}`,
              'Content-Type': mimeType,
            },
            body: imgBuffer,
            signal: AbortSignal.timeout(15000),
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            thumbBlob = uploadData.blob;
          }
        }
      } catch (e) {
        console.error('[Bluesky] Image upload failed:', (e as Error).message);
      }
    }

    // Build post text — use existing hashtags from social-pulse, or generate smart ones
    let postText: string;
    if (title.includes('#')) {
      postText = title;
    } else {
      const { buildHashtags } = await import('./twitter');
      const hashtags = buildHashtags(title, tags || []);
      postText = `${title}\n\n${hashtags}`;
    }
    const text = postText.length > 300 ? postText.slice(0, 297) + '...' : postText;

    // Build external embed (link card with image)
    const embed: Record<string, unknown> = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: articleUrl,
        title: title,
        description: `Read on Footy Feed`,
        ...(thumbBlob ? { thumb: thumbBlob } : {}),
      },
    };

    const record = {
      $type: 'app.bsky.feed.post',
      text,
      embed,
      createdAt: new Date().toISOString(),
    };

    // Create post
    const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const postData = await postRes.json();
    if (postRes.ok && postData.uri) {
      console.log(`[Bluesky] Posted${thumbBlob ? ' with image card' : ''}`);
      return { success: true, uri: postData.uri };
    }
    return { success: false, error: postData.message || JSON.stringify(postData) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
