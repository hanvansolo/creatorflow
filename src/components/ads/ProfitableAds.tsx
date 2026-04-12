'use client';

import { useEffect, useRef } from 'react';

/**
 * HilltopAds zones for footy-feed.com (site #889366)
 *
 * Zone mapping:
 *   #6952201 - MultiTag Video Slider → article pages, homepage (auto-play video overlay)
 *   #6952185 - MultiTag In-Page Push → global notification-style ads
 *   #6952169 - MultiTag Banner 300x250 → sidebar
 *   #6952157 - MultiTag Banner 300x100 → between content sections
 *   #6952125 - PopUnder → global (before </body> in layout.tsx)
 *   #6952217 - Video VAST 3.0 → reserved for future video player integration
 */

/** Generic HilltopAds script injector — all zones use the same (function(dwg){...}) pattern */
function HilltopScript({ src, className = '' }: { src: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      (function(dwg){
        var d = document,
            s = d.createElement('script'),
            l = d.scripts[d.scripts.length - 1];
        s.settings = dwg || {};
        s.src = "${src}";
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        l.parentNode.insertBefore(s, l);
      })({})
    `;
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
      <HilltopScript
        src="\/\/untimely-hello.com\/b.XLVsswdbGd1G0VYBlwkcp\/Ne\/mt9PurZkU-1\/k\/PCTTYy5MN-T\/I\/xsNjjJ\/kqt\/Nmj\/k\/1fMejkEf3ZMOwa"
      />
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
      <HilltopScript
        src="\/\/untimely-hello.com\/bvXcVqs.d\/GZl\/0IY\/WXcP\/seZmv9jueZUUHl\/k\/POTXY-5zNETkIXxvNaThic\/tGNFjmkw1eM\/j\/Ey2bM_Qz"
      />
    </div>
  );
}

/**
 * MultiTag Video Slider — auto-play video overlay
 * Zone #6952201 — best on article pages and homepage
 */
export function VideoSliderAd({ className = '' }: { className?: string }) {
  return (
    <HilltopScript
      src="\/\/untimely-hello.com\/bnX.VuscdtGs1K0DY\/WBcH\/jeimr9BubZGUNldk\/PbTtY_5PNKTMIny\/MpDLEAt\/tyjgkf1bMOJkIGwnNuQI"
      className={className}
    />
  );
}

/**
 * MultiTag In-Page Push — notification-style ads
 * Zone #6952185 — works globally, non-intrusive
 */
export function InPagePushAd({ className = '' }: { className?: string }) {
  return (
    <HilltopScript
      src="\/\/untimely-hello.com\/bkKZV\/s.doGelc0zYXwucP\/GejmY9fumZTUh1lwk\/PDTkYQ5wNXTUIuxmOxDtU\/t\/MtjNkR1mHLfOE_4gOpQa"
      className={className}
    />
  );
}

/**
 * Responsive horizontal ad — 300x250 on all screens (HilltopAds MultiTag auto-sizes)
 * Replaces the old 728x90 / 468x60 split
 */
export function HorizontalAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <CompactBannerAd />
    </div>
  );
}

/**
 * Native ad — video slider works well in-feed
 */
export function NativeAd({ className = '' }: { className?: string }) {
  return <VideoSliderAd className={className} />;
}

/** Leaderboard — alias for HorizontalAd (keeps existing imports working) */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return <HorizontalAd className={className} />;
}

/** Medium banner — alias for CompactBannerAd */
export function MediumBannerAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}
