'use client';

import { useEffect, useRef } from 'react';

/**
 * HilltopAds zones for footy-feed.com (site #889366)
 *
 * Zone mapping:
 *   #6952201 - MultiTag Video Slider → article pages, homepage
 *   #6952185 - MultiTag In-Page Push → global notification-style ads
 *   #6952169 - MultiTag Banner 300x250 → sidebar
 *   #6952157 - MultiTag Banner 300x100 → between content sections
 *   #6952125 - PopUnder → global (layout.tsx before </body>)
 */

/** Direct script loader — creates an external <script> tag and appends to container */
function HilltopScript({ src, className = '' }: { src: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    containerRef.current.appendChild(script);
  }, [src]);

  return <div ref={containerRef} className={className} />;
}

// ===== EXPORTED AD COMPONENTS =====

/**
 * 300x250 MultiTag Banner — sidebar rectangle
 * Zone #6952169
 */
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <HilltopScript src="//untimely-hello.com/b.XLVsswdbGd1G0VYBlwkcp/Ne/mt9PurZkU-1/k/PCTTYy5MN-T/I/xsNjjJ/kqt/Nmj/k/1fMejkEf3ZMOwa" />
    </div>
  );
}

/**
 * 300x100 MultiTag Banner — compact horizontal, between content
 * Zone #6952157
 */
export function CompactBannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-3 ${className}`}>
      <HilltopScript src="//untimely-hello.com/bvXcVqs.d/GZl/0IY/WXcP/seZmv9jueZUUHl/k/POTXY-5zNETkIXxvNaThic/tGNFjmkw1eM/j/Ey2bM_Qz" />
    </div>
  );
}

/**
 * MultiTag Video Slider — auto-play video overlay
 * Zone #6952201
 */
export function VideoSliderAd({ className = '' }: { className?: string }) {
  return (
    <HilltopScript src="//untimely-hello.com/bnX.VuscdtGs1K0DY/WBcH/jeimr9BubZGUNldk/PbTtY_5PNKTMIny/MpDLEAt/tyjgkf1bMOJkIGwnNuQI" className={className} />
  );
}

/**
 * MultiTag In-Page Push — notification-style ads
 * Zone #6952185
 */
export function InPagePushAd({ className = '' }: { className?: string }) {
  return (
    <HilltopScript src="//untimely-hello.com/bkKZV/s.doGelc0zYXwucP/GejmY9fumZTUh1lwk/PDTkYQ5wNXTUIuxmOxDtU/t/MtjNkR1mHLfOE_4gOpQa" className={className} />
  );
}

/** Responsive horizontal ad — compact banner on all screens */
export function HorizontalAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}

/** Native ad — video slider in-feed */
export function NativeAd({ className = '' }: { className?: string }) {
  return <VideoSliderAd className={className} />;
}

/** Leaderboard — alias for HorizontalAd */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return <HorizontalAd className={className} />;
}

/** Medium banner — alias for CompactBannerAd */
export function MediumBannerAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}
