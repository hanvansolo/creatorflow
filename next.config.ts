import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com https://app.nitopulse.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; media-src 'self' https:; connect-src 'self' https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://ep2.adtrafficquality.google https://www.google.com; object-src 'none'; base-uri 'self';"
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Football news sources
      { protocol: 'https', hostname: '*.bbci.co.uk' },
      { protocol: 'https', hostname: 'ichef.bbci.co.uk' },
      { protocol: 'https', hostname: '*.skysports.com' },
      { protocol: 'https', hostname: '*.theguardian.com' },
      { protocol: 'https', hostname: 'i.guim.co.uk' },
      { protocol: 'https', hostname: '*.espn.com' },
      { protocol: 'https', hostname: '*.espncdn.com' },
      { protocol: 'https', hostname: '*.goal.com' },
      { protocol: 'https', hostname: '*.fourfourtwo.com' },
      { protocol: 'https', hostname: '*.football365.com' },
      { protocol: 'https', hostname: '*.teamtalk.com' },
      { protocol: 'https', hostname: '*.mirror.co.uk' },
      { protocol: 'https', hostname: '*.90min.com' },
      { protocol: 'https', hostname: '*.football.london' },
      { protocol: 'https', hostname: '*.tribalfootball.com' },
      // API-Football media
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'media-*.api-sports.io' },
      // Self-hosted images
      { protocol: 'https', hostname: 'www.footy-feed.com' },
      { protocol: 'https', hostname: 'footy-feed.com' },
      // Placeholder and generic
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      // Country flags
      { protocol: 'https', hostname: 'flagcdn.com' },
      // YouTube thumbnails
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '*.ytimg.com' },
      // Favicons
      { protocol: 'https', hostname: 'www.google.com' },
      // WordPress-hosted images
      { protocol: 'https', hostname: '*.wp.com' },
      { protocol: 'https', hostname: '*.wordpress.com' },
    ],
  },
};

export default nextConfig;
