/**
 * IndexNow push-notify helper.
 * Tells Bing, Yandex, and Seznam about new/changed URLs instantly
 * — skipping the wait for the next crawl. Google does not participate.
 *
 * Setup: put INDEXNOW_KEY in Railway env vars (any 8-128 char hex string).
 * Also host the key file at /{key}.txt on the site — handled by a Next.js
 * route at src/app/[key]/route.ts that echoes the key.
 *
 * Docs: https://www.indexnow.org/documentation
 */

const SITE = 'https://www.footy-feed.com';

export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;

  try {
    const body = {
      host: 'www.footy-feed.com',
      key,
      keyLocation: `${SITE}/${key}.txt`,
      urlList: urls.map(u => (u.startsWith('http') ? u : `${SITE}${u}`)),
    };

    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] Pinged ${urls.length} URL(s)`);
    } else {
      console.error(`[IndexNow] ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
  } catch (e) {
    console.error('[IndexNow] ping failed:', (e as Error).message);
  }
}
