'use client';

import { useEffect, useState } from 'react';
import { runEzoic } from '@/lib/ezoic';

/**
 * Ezoic ad placeholder component.
 * Place this where you want an ad to appear.
 * The `id` is the numeric placeholder ID from your Ezoic dashboard.
 */
export default function EzoicAd({ id, className = '' }: { id: number; className?: string }) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    setIsRendered(true);
    runEzoic(() => {
      window.ezstandalone?.showAds(id);
    });
    return () => {
      runEzoic(() => {
        window.ezstandalone?.destroyPlaceholders(id);
      });
    };
  }, [id]);

  return (
    <div className={`ezoic-ad-container ${className}`}>
      {isRendered && <div id={`ezoic-pub-ad-placeholder-${id}`} />}
    </div>
  );
}
