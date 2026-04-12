'use client';

import { useEffect, useRef } from 'react';

/**
 * HilltopAds zones for footy-feed.com (site #889366)
 *
 * The bootstrap (function(mkaf){...}) pattern just creates a <script> with
 * the src URL and inserts it into the DOM. We skip the wrapper and load
 * the script directly — same end result.
 *
 * The s.settings = mkaf || {} line passes an empty config object.
 * We replicate this by setting a .settings property on the script element.
 */

function HilltopAd({ scriptSrc, className = '' }: { scriptSrc: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const s = document.createElement('script');
    // The escaped \/\/ in the original code is just // in actual JS
    // Convert the escaped src to a real URL
    const realSrc = scriptSrc.replace(/\\\//g, '/');
    (s as any).settings = {};
    s.src = realSrc;
    s.async = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';

    // Append to the container div or body
    if (containerRef.current) {
      containerRef.current.appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  }, [scriptSrc]);

  return <div ref={containerRef} className={className} />;
}

// ===== EXPORTED AD COMPONENTS =====

/** 300x250 MultiTag Banner — sidebar. Zone #6952169 */
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <HilltopAd scriptSrc="//untimely-hello.com/bbXcV.sudxG_l/0VYlWlcr/fe/mP9RubZ/U/lHkoP/TNYv5CN-TPISxLNsjGkxt/NLjokB1QMljnEJ3/M/wi" />
    </div>
  );
}

/** 300x100 MultiTag Banner — between content. Zone #6952157 */
export function CompactBannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-3 ${className}`}>
      <HilltopAd scriptSrc="//untimely-hello.com/b.XGV/s/dQGclA0yYZWMcJ/CeLmb9muuZOUml/kMPTTHY/5gNbT_IUx/NjT_cmtLNsj/kA1/MzjQEX2KMcQ-" />
    </div>
  );
}

/** MultiTag Video Slider. Zone #6952201 */
export function VideoSliderAd({ className = '' }: { className?: string }) {
  return <HilltopAd scriptSrc="//untimely-hello.com/b.XyVrs-dWG/lU0aYGWGcY/SefmW9/uGZBUgl/ksP/TZY/5/NNTuIxyUMCDzEgtLNrj/kc1GMij/IVwPNbQW" className={className} />;
}

/** MultiTag In-Page Push. Zone #6952185 */
export function InPagePushAd({ className = '' }: { className?: string }) {
  return <HilltopAd scriptSrc="//untimely-hello.com/b-XGV.sWdHGClo0HYHWWcx/Xe/mh9ZuBZRUnlGk/PBTiYR5JN/TpIUxaOIDbUStVNFjZkB1_MzjNEZ4nOxQq" className={className} />;
}

/** Responsive horizontal ad */
export function HorizontalAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}

/** Native ad — video slider */
export function NativeAd({ className = '' }: { className?: string }) {
  return <VideoSliderAd className={className} />;
}

/** Aliases */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return <HorizontalAd className={className} />;
}
export function MediumBannerAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}
