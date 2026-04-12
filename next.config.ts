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
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.googleadservices.com https://*.adtrafficquality.google https://*.doubleclick.net https://fundingchoicesmessages.google.com https://app.nitopulse.com https://*.profitablecpmratenetwork.com https://*.untimely-hello.com https://*.plasticdamage.com https://*.hilltopads.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; media-src 'self' https:; connect-src 'self' https: wss:; frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.youtube.com https://www.youtube-nocookie.com https://fundingchoicesmessages.google.com https://*.untimely-hello.com https://*.plasticdamage.com https://*.hilltopads.net; frame-ancestors 'self' https://*.google.com https://*.googlesyndication.com; object-src 'none'; base-uri 'self';"
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Impact-Site-Verification',
            value: 'cfef735d-47e2-4c0b-8630-84ff2dc0ea39',
          },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Allow all HTTPS images — scraped og:image URLs come from many CDNs
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
