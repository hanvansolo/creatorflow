/**
 * /ads.txt — fetches Ezoic's managed list (still the source of truth for
 * reseller entries) and appends the AdSense publisher line that Google
 * requires. AdsTxtManager won't include our own pub ID so we splice it
 * in here. Cached for 1h.
 *
 * Failure mode: if Ezoic's endpoint is unreachable, we still serve the
 * AdSense line on its own so AdSense crawlers don't see a 5xx.
 */

const EZOIC_URL = 'https://srv.adstxtmanager.com/19390/footy-feed.com';
const ADSENSE_PUB_ID = 'pub-8717247095472771';
const ADSENSE_LINE = `google.com, ${ADSENSE_PUB_ID}, DIRECT, f08c47fec0942fa0`;

export const revalidate = 3600;

export async function GET() {
  let body = '';
  try {
    const res = await fetch(EZOIC_URL, { next: { revalidate: 3600 } });
    if (res.ok) body = await res.text();
  } catch (err) {
    console.error('[ads.txt] Ezoic fetch failed:', err);
  }

  if (!body.includes(ADSENSE_PUB_ID)) {
    body = (body.trimEnd() + '\n' + ADSENSE_LINE + '\n').trimStart();
  }

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
