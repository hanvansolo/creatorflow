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

/**
 * Floating Video Ad Player — VAST 3.0 via Google IMA SDK
 * Zone #6952217 — sticky bottom-right video player with close button
 * Auto-plays muted, expands on interaction
 */
export function FloatingVideoAd({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || typeof window === 'undefined') return;
    loaded.current = true;

    const VAST_URL = 'https://plasticdamage.com/dpmOF.zCdwG/NcvrZmGYUt/VemmX9Qu_ZiUnl/kIP_TzYE5aNmTHIRypMOTiCUt/NVjokB1KMljOI/ysM/SNZZsaaFwN1tpbdxDl0exm';

    // Load Google IMA SDK
    const imaScript = document.createElement('script');
    imaScript.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
    imaScript.async = true;
    imaScript.onload = () => initPlayer();
    document.head.appendChild(imaScript);

    function initPlayer() {
      if (!containerRef.current || !window.google?.ima) return;

      const wrapper = containerRef.current;

      // Create video element
      const video = document.createElement('video');
      video.id = 'vast-video-player';
      video.style.cssText = 'width:100%;height:100%;background:#000;';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');

      // Create ad container overlay
      const adContainer = document.createElement('div');
      adContainer.id = 'vast-ad-container';
      adContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = 'position:absolute;top:4px;right:4px;z-index:100;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;';
      closeBtn.onclick = () => {
        wrapper.style.display = 'none';
      };

      wrapper.appendChild(video);
      wrapper.appendChild(adContainer);
      wrapper.appendChild(closeBtn);

      // Init IMA
      try {
        const adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, video);
        adDisplayContainer.initialize();

        const adsLoader = new google.ima.AdsLoader(adDisplayContainer);

        adsLoader.addEventListener(
          google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          (event: any) => {
            const adsManager = event.getAdsManager(video, {
              autoAlign: false,
            });

            adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
              wrapper.style.display = 'none';
            });

            adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, () => {
              wrapper.style.display = 'none';
            });

            try {
              adsManager.init(300, 169, google.ima.ViewMode.NORMAL);
              adsManager.start();
            } catch {
              wrapper.style.display = 'none';
            }
          }
        );

        adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, () => {
          wrapper.style.display = 'none';
        });

        const adsRequest = new google.ima.AdsRequest();
        adsRequest.adTagUrl = VAST_URL;
        adsRequest.linearAdSlotWidth = 300;
        adsRequest.linearAdSlotHeight = 169;

        adsLoader.requestAds(adsRequest);
      } catch {
        wrapper.style.display = 'none';
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '300px',
        height: '169px',
        zIndex: 50,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    />
  );
}
