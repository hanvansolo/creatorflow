'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { runEzoic } from '@/lib/ezoic';

/**
 * Handles Ezoic ad refresh on Next.js client-side navigation.
 * Destroys old placeholders and shows new ads on each route change.
 */
export default function EzoicRouteHandler() {
  const pathname = usePathname();

  useEffect(() => {
    runEzoic(() => {
      window.ezstandalone?.destroyPlaceholders();
      requestAnimationFrame(() => {
        window.ezstandalone?.showAds();
      });
    });
  }, [pathname]);

  return null;
}
