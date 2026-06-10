'use client';

import { useEffect, useRef } from 'react';
import {
  ADSENSE_PUBLISHER_ID,
  SLOT_DISPLAY,
  SLOT_IN_ARTICLE,
  SLOT_IN_FEED,
  SLOT_MULTIPLEX,
} from '@/lib/ads/slots';

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

function tryPushAd(retries = 0) {
  if (retries > 10) return; // give up after ~5s
  if (typeof window !== 'undefined' && window.adsbygoogle) {
    try {
      window.adsbygoogle.push({});
    } catch {
      // already pushed or blocked
    }
  } else {
    setTimeout(() => tryPushAd(retries + 1), 500);
  }
}

function useAdPush() {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    setTimeout(() => tryPushAd(), 500);
  }, []);
}

interface SlotProps {
  className?: string;
  /** Override the env-var slot (rare — most callers shouldn't pass this). */
  slot?: string;
}

/**
 * Generic responsive display ad. Drops in anywhere — header, sidebar,
 * between cards, end-of-page. Adapts to width.
 */
export function DisplayAd({ className = '', slot }: SlotProps) {
  const slotId = slot || SLOT_DISPLAY;
  useAdPush();
  if (!slotId) return null;
  return (
    <div className={`ad-container my-4 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * In-article ad — fluid layout, optimised for placement inside long-
 * form article body between paragraphs. Higher CTR than display.
 */
export function InArticleAd({ className = '', slot }: SlotProps) {
  const slotId = slot || SLOT_IN_ARTICLE;
  useAdPush();
  if (!slotId) return null;
  return (
    <div className={`ad-container my-8 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-layout="in-article"
        data-ad-format="fluid"
      />
    </div>
  );
}

/**
 * In-feed ad — native style, drops between cards in a list (news
 * index, live match groups). Same shape as your card so the page
 * doesn't look broken when an ad lands.
 */
export function InFeedAd({ className = '', slot }: SlotProps) {
  const slotId = slot || SLOT_IN_FEED;
  useAdPush();
  if (!slotId) return null;
  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
      />
    </div>
  );
}

/**
 * Multiplex (matched-content) ad — grid of related-style ad units.
 * Best at end of article, looks like a "more for you" recommendations
 * block. Requires being approved for matched content in AdSense.
 */
export function MultiplexAd({ className = '', slot }: SlotProps) {
  const slotId = slot || SLOT_MULTIPLEX;
  useAdPush();
  if (!slotId) return null;
  return (
    <div className={`ad-container my-8 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format="autorelaxed"
      />
    </div>
  );
}

// Backward-compat alias for any caller that still references AdSlot.
export const AdSlot = DisplayAd;
