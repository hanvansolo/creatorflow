/**
 * AdSense slot configuration. Each slot ID is created in the AdSense
 * dashboard (Ads → By ad unit → Display / In-article / In-feed) and
 * pasted into Railway as the matching env var. The publisher ID is
 * shared across all slots.
 *
 * If a slot env var is unset, the corresponding ad component renders
 * `null` — safer than an empty `<ins>` (which can hurt CLS and look
 * like inventory loss in AdSense reports). Auto Ads still fills the
 * page from the loader script regardless.
 */

export const ADSENSE_PUBLISHER_ID = 'ca-pub-8717247095472771';

export const SLOT_DISPLAY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY || '';
export const SLOT_IN_ARTICLE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE || '';
export const SLOT_IN_FEED = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED || '';
export const SLOT_MULTIPLEX = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX || '';
