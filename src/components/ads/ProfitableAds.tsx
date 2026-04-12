'use client';

import EzoicAd from './EzoicAd';

/**
 * Ad slot components using Ezoic.
 *
 * Placeholder IDs are assigned in the Ezoic dashboard.
 * Using temporary IDs (101-105) — update these once you create
 * the actual placeholders in your Ezoic dashboard.
 *
 * To set up in Ezoic:
 * 1. Go to Ezoic dashboard → Monetization → Ad Placeholders
 * 2. Create placeholders for each slot below
 * 3. Update the IDs here to match
 */

/** Sidebar 300x250 — Ezoic placeholder */
export function SidebarAd({ className = '' }: { className?: string }) {
  return <EzoicAd id={101} className={`my-4 ${className}`} />;
}

/** Horizontal banner between content sections */
export function CompactBannerAd({ className = '' }: { className?: string }) {
  return <EzoicAd id={102} className={`my-3 ${className}`} />;
}

/** In-article / native ad */
export function VideoSliderAd({ className = '' }: { className?: string }) {
  return <EzoicAd id={103} className={className} />;
}

/** In-page push style */
export function InPagePushAd({ className = '' }: { className?: string }) {
  return <EzoicAd id={104} className={className} />;
}

/** Responsive horizontal ad */
export function HorizontalAd({ className = '' }: { className?: string }) {
  return <EzoicAd id={102} className={`my-4 ${className}`} />;
}

/** Native ad — in-feed */
export function NativeAd({ className = '' }: { className?: string }) {
  return <EzoicAd id={103} className={className} />;
}

/** Aliases for backward compatibility */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return <HorizontalAd className={className} />;
}
export function MediumBannerAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}
