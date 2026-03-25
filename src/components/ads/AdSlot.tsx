'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface AdSlotProps {
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle' | 'fluid';
  className?: string;
}

function tryPushAd(retries = 0) {
  if (retries > 10) return; // Give up after ~5 seconds

  if (typeof window !== 'undefined' && window.adsbygoogle) {
    try {
      window.adsbygoogle.push({});
    } catch (e) {
      // Already pushed or blocked
    }
  } else {
    // Script not loaded yet, retry
    setTimeout(() => tryPushAd(retries + 1), 500);
  }
}

export function AdSlot({ format = 'auto', className = '' }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;

    // Wait for adsbygoogle script to be ready
    setTimeout(() => tryPushAd(), 500);
  }, []);

  return (
    <div className={`ad-container overflow-hidden min-h-[90px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8717247095472771"
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function InArticleAd({ className = '' }: { className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;

    setTimeout(() => tryPushAd(), 500);
  }, []);

  return (
    <div className={`ad-container my-8 min-h-[250px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client="ca-pub-8717247095472771"
        data-ad-layout="in-article"
        data-ad-format="fluid"
      />
    </div>
  );
}
