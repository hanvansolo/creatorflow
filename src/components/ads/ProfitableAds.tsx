'use client';

import { useEffect, useRef } from 'react';

/**
 * HilltopAds zones for footy-feed.com (site #889366)
 *
 * Zones:
 *   #6952169 - MultiTag Banner 300x250 → sidebar
 *   #6952157 - MultiTag Banner 300x100 → between content
 *   #6952201 - MultiTag Video Slider → in-feed / article pages
 *   #6952185 - MultiTag In-Page Push → global (layout.tsx)
 */

function HilltopAd({ scriptSrc, className = '' }: { scriptSrc: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const s = document.createElement('script');
    (s as any).settings = {};
    s.src = scriptSrc;
    s.async = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';
    containerRef.current.appendChild(s);
  }, [scriptSrc]);

  return <div ref={containerRef} className={className} />;
}

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
