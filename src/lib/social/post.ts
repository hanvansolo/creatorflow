import { postToTwitter } from './twitter';
import { postToFacebook, postToInstagram } from './facebook';
import { postToBluesky } from './bluesky';
import { postToThreads } from './threads';

export interface SocialPostResult {
  twitter: { success: boolean; id?: string; error?: string } | null;
  facebook: { success: boolean; id?: string; error?: string } | null;
  instagram: { success: boolean; id?: string; error?: string } | null;
  bluesky: { success: boolean; uri?: string; error?: string } | null;
  threads: { success: boolean; id?: string; error?: string } | null;
}

/**
 * Post an article to all configured social platforms.
 * Skips platforms that don't have credentials configured.
 * Runs all posts in parallel for speed.
 */
export async function postToAllPlatforms(
  title: string,
  slug: string,
  summary?: string,
  tags?: string[],
  imageUrl?: string
): Promise<SocialPostResult> {
  const results = await Promise.allSettled([
    (process.env.TWITTER_CLIENT_ID || process.env.TWITTER_OAUTH2_TOKEN) ? postToTwitter(title, slug, tags, imageUrl, summary) : null,
    process.env.FACEBOOK_PAGE_ID ? postToFacebook(title, slug, summary, tags) : null,
    (process.env.INSTAGRAM_ACCOUNT_ID && imageUrl) ? postToInstagram(title, slug, imageUrl, tags) : null,
    process.env.BLUESKY_HANDLE ? postToBluesky(title, slug, tags, imageUrl) : null,
    process.env.THREADS_USER_ID ? postToThreads(title, slug, imageUrl) : null,
  ]);

  const get = (i: number) => {
    const r = results[i];
    if (r.status === 'fulfilled') return r.value;
    return { success: false, error: r.reason?.message || 'Unknown error' };
  };

  const result: SocialPostResult = {
    twitter: get(0),
    facebook: get(1),
    instagram: get(2),
    bluesky: get(3),
    threads: get(4),
  };

  for (const [platform, res] of Object.entries(result)) {
    if (res === null) continue;
    if (res.success) {
      console.log(`[SOCIAL] ${platform}: posted successfully`);
    } else {
      console.error(`[SOCIAL] ${platform}: failed - ${res.error}`);
    }
  }

  return result;
}
