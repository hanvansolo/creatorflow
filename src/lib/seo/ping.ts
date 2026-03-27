const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

/**
 * Ping search engines to notify them of new/updated content.
 * Google deprecated the old ping endpoint but IndexNow (used by Bing/Yandex)
 * is the modern replacement. We also submit to Google via the sitemap ping.
 */
export async function pingSearchEngines(): Promise<{
  google: boolean;
  bing: boolean;
  indexNow: boolean;
}> {
  const results = { google: false, bing: false, indexNow: false };

  // Google: ping sitemap (still works, though Google says they discover sitemaps automatically)
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    results.google = res.ok;
    console.log(`Google ping: ${res.ok ? 'OK' : res.status}`);
  } catch (e) {
    console.error('Google ping failed:', (e as Error).message);
  }

  // Bing: ping sitemap
  try {
    const res = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    results.bing = res.ok;
    console.log(`Bing ping: ${res.ok ? 'OK' : res.status}`);
  } catch (e) {
    console.error('Bing ping failed:', (e as Error).message);
  }

  // IndexNow: modern protocol supported by Bing, Yandex, Seznam, Naver
  const indexNowKey = process.env.INDEXNOW_KEY;
  if (indexNowKey) {
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(SITE_URL).hostname,
          key: indexNowKey,
          keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
          urlList: [
            SITE_URL,
            `${SITE_URL}/news`,
            `${SITE_URL}/sitemap.xml`,
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });
      results.indexNow = res.ok || res.status === 202;
      console.log(`IndexNow ping: ${res.status}`);
    } catch (e) {
      console.error('IndexNow ping failed:', (e as Error).message);
    }
  }

  return results;
}

/**
 * Ping search engines with specific new URLs (for IndexNow).
 * Call this when new articles are published.
 */
export async function pingNewUrls(urls: string[]): Promise<boolean> {
  const indexNowKey = process.env.INDEXNOW_KEY;
  if (!indexNowKey || urls.length === 0) {
    // Fall back to basic sitemap ping
    await pingSearchEngines();
    return true;
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(SITE_URL).hostname,
        key: indexNowKey,
        keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
        urlList: urls.slice(0, 10000), // IndexNow max 10k URLs per request
      }),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`IndexNow submitted ${urls.length} URLs: ${res.status}`);
    return res.ok || res.status === 202;
  } catch (e) {
    console.error('IndexNow submit failed:', (e as Error).message);
    return false;
  }
}
