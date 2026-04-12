'use client';

import { useEffect, useRef } from 'react';

/**
 * HilltopAds zones for footy-feed.com (site #889366)
 *
 * These scripts MUST use the original bootstrap pattern because the ad server
 * expects d.scripts[d.scripts.length-1] to find the insertion point.
 * We inject the full <script> block via innerHTML to preserve this behavior.
 */

function HilltopAd({ scriptSrc, className = '' }: { scriptSrc: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    // Inject as raw HTML so the bootstrap pattern works correctly
    // The (function(mkaf){...}) wrapper needs d.scripts to reference itself
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<script>
(function(mkaf){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = mkaf || {};
s.src = "${scriptSrc}";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
<\/script>`;

    // innerHTML doesn't execute scripts, so we need to clone them
    const scripts = wrapper.querySelectorAll('script');
    scripts.forEach((origScript) => {
      const newScript = document.createElement('script');
      newScript.text = origScript.text;
      containerRef.current?.appendChild(newScript);
    });
  }, [scriptSrc]);

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
      <HilltopAd scriptSrc="\/\/untimely-hello.com\/bbXcV.sudxG_l\/0VYlWlcr\/fe\/mP9RubZ\/U\/lHkoP\/TNYv5CN-TPISxLNsjGkxt\/NLjokB1QMljnEJ3\/M\/wi" />
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
      <HilltopAd scriptSrc="\/\/untimely-hello.com\/b.XGV\/s\/dQGclA0yYZWMcJ\/CeLmb9muuZOUml\/kMPTTHY\/5gNbT_IUx\/NjT_cmtLNsj\/kA1\/MzjQEX2KMcQ-" />
    </div>
  );
}

/**
 * MultiTag Video Slider — auto-play video overlay
 * Zone #6952201
 */
export function VideoSliderAd({ className = '' }: { className?: string }) {
  return (
    <HilltopAd scriptSrc="\/\/untimely-hello.com\/b.XyVrs-dWG\/lU0aYGWGcY\/SefmW9\/uGZBUgl\/ksP\/TZY\/5\/NNTuIxyUMCDzEgtLNrj\/kc1GMij\/IVwPNbQW" className={className} />
  );
}

/**
 * MultiTag In-Page Push — notification-style ads
 * Zone #6952185
 */
export function InPagePushAd({ className = '' }: { className?: string }) {
  return (
    <HilltopAd scriptSrc="\/\/untimely-hello.com\/b-XGV.sWdHGClo0HYHWWcx\/Xe\/mh9ZuBZRUnlGk\/PBTiYR5JN\/TpIUxaOIDbUStVNFjZkB1_MzjNEZ4nOxQq" className={className} />
  );
}

/** Responsive horizontal ad */
export function HorizontalAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}

/** Native ad — video slider in-feed */
export function NativeAd({ className = '' }: { className?: string }) {
  return <VideoSliderAd className={className} />;
}

/** Leaderboard — alias */
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return <HorizontalAd className={className} />;
}

/** Medium banner — alias */
export function MediumBannerAd({ className = '' }: { className?: string }) {
  return <CompactBannerAd className={className} />;
}
