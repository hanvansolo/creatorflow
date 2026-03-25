'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SourceFaviconProps {
  url?: string;
  name: string;
  size?: number;
}

function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

export function SourceFavicon({ url, name, size = 14 }: SourceFaviconProps) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return null;
  }

  const domain = getDomainFromUrl(url);
  // Use Google's favicon service
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`;

  return (
    <Image
      src={faviconUrl}
      alt={`${name} favicon`}
      width={size}
      height={size}
      className="rounded-sm"
      onError={() => setError(true)}
      unoptimized // Google's favicon service handles optimization
    />
  );
}
