/**
 * API-Football returns a default "no image" placeholder when they don't have
 * a logo for a given team or player. The placeholder is served from the same
 * URL pattern (media.api-sports.io/football/teams/{id}.png) so we can't tell
 * from the URL alone — but the file is always exactly this many bytes.
 *
 * Any image at that host whose content size matches this constant is the
 * placeholder and should be treated as "no logo" (render initials instead).
 */
export const API_FOOTBALL_PLACEHOLDER_SIZE = 90381;

const API_FOOTBALL_HOST = 'media.api-sports.io';

export function isApiFootballUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes(API_FOOTBALL_HOST);
}

/**
 * Fetch the total byte length of an image without downloading the whole file.
 * Uses a Range: bytes=0-0 request — the server responds with 206 Partial
 * Content and a Content-Range header of the form "bytes 0-0/TOTAL".
 *
 * Returns null on any network/parse failure so callers can fail open.
 */
export async function getLogoSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        // Some CDNs (incl. api-sports) reject requests without a browser UA.
        'User-Agent': 'Mozilla/5.0 (compatible; FootyFeedBot/1.0)',
        'Range': 'bytes=0-0',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status !== 206 && res.status !== 200) return null;
    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      // "bytes 0-0/90381" → 90381
      const match = contentRange.match(/\/(\d+)\s*$/);
      if (match) return Number(match[1]);
    }
    // Fallback for servers that ignore Range
    const contentLength = res.headers.get('content-length');
    if (contentLength) return Number(contentLength);
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns `false` for known API-Football placeholder images so callers can
 * skip storing or rendering them. Fails open (returns `true`) on network
 * errors — it's better to keep a URL that might work than to blank something
 * for a transient hiccup.
 */
export async function isValidApiFootballLogo(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  if (!isApiFootballUrl(url)) return true; // Only gate api-sports URLs here.
  const size = await getLogoSize(url);
  if (size == null) return true; // Network failure — fail open.
  return size !== API_FOOTBALL_PLACEHOLDER_SIZE;
}
