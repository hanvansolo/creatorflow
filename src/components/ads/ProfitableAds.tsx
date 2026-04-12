'use client';

import { useEffect, useRef } from 'react';

const AD_SCRIPT_BASE = 'https://www.profitablecpmratenetwork.com/';

/**
 * Banner ad — loads atOptions-style iframe banners.
 * Sizes: 728x90, 468x60, 300x250, 160x300, 160x600, 320x50
 */
function BannerAd({ adKey, width, height, className = '' }: {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;
    containerRef.current.appendChild(script);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `${AD_SCRIPT_BASE}${adKey}/invoke.js`;
    containerRef.current.appendChild(invokeScript);
  }, [adKey, width, height]);

  return (
    <div
      ref={containerRef}
      className={`ad-container flex items-center justify-center overflow-hidden ${className}`}
      style={{ minHeight: height, maxWidth: width }}
    />
  );
}

/**
 * Native Banner — in-feed native ad widget
 */
function NativeBannerAd({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28987045.profitablecpmratenetwork.com/adc737216288170d580d122cabe0d9e0/invoke.js';
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <div ref={containerRef}>
        <div id="container-adc737216288170d580d122cabe0d9e0" />
      </div>
    </div>
  );
}

// ===== EXPORTED AD COMPONENTS =====

/** 728x90 leaderboard — desktop horizontal banner */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:flex justify-center my-4 ${className}`}>
      <BannerAd adKey="38844fcb8c5acaf7e4994fc5c541ebd7" width={728} height={90} />
    </div>
  );
}

/** 468x60 banner — tablet/smaller screens */
export function MediumBannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex md:hidden justify-center my-4 ${className}`}>
      <BannerAd adKey="d16b2a5da73c90baa6c87eeacdd2bed7" width={468} height={60} />
    </div>
  );
}

/** 300x250 rectangle — sidebar */
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <BannerAd adKey="8762b6eb72eae196e2da91517990c456" width={300} height={250} />
    </div>
  );
}

/** Responsive horizontal ad — 728x90 on desktop, 468x60 on mobile */
export function HorizontalAd({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <LeaderboardAd />
      <MediumBannerAd />
    </div>
  );
}

/** Native banner — blends into content feed */
export function NativeAd({ className = '' }: { className?: string }) {
  return <NativeBannerAd className={className} />;
}

/** Smartlink URL — for wrapping outbound buttons/links */
export const SMARTLINK_URL = 'https://www.profitablecpmratenetwork.com/hnqyx01jwx?key=59cdee15ce34a70a2d8575378e32351d';
