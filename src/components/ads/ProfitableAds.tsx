/**
 * Backward-compat shims. The site has many call sites that import
 * HorizontalAd / NativeAd / SidebarAd from this file (it used to be a
 * legacy ad-network module that returned `null` everywhere). Rather
 * than rewrite every page, this file now forwards to the real AdSense
 * components in AdSlot.tsx.
 *
 * New code should import directly from `@/components/ads/AdSlot`:
 *   - DisplayAd  → header / sidebar / between sections
 *   - InArticleAd → inside article body
 *   - InFeedAd   → between cards in a list
 *   - MultiplexAd → end of article (matched content)
 */

export { DisplayAd as HorizontalAd } from './AdSlot';
export { DisplayAd as LeaderboardAd } from './AdSlot';
export { DisplayAd as MediumBannerAd } from './AdSlot';
export { DisplayAd as CompactBannerAd } from './AdSlot';
export { DisplayAd as SidebarAd } from './AdSlot';
export { MultiplexAd as NativeAd } from './AdSlot';

// Genuinely no equivalent for these (in-page push / video slider were
// popunder-style formats AdSense doesn't offer). Keep as null so any
// remaining call sites stay quiet.
export function VideoSliderAd({ className: _className = '' }: { className?: string }) {
  return null;
}

export function InPagePushAd({ className: _className = '' }: { className?: string }) {
  return null;
}
