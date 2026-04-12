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
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; media-src 'self' https:; connect-src 'self' https: wss: http:; frame-src 'self' https: http:; frame-ancestors 'self' https:; object-src 'none'; base-uri 'self';"
  }
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Ezoic managed ads.txt — auto-updated with all demand partners
        source: '/ads.txt',
        destination: 'https://srv.adstxtmanager.com/19390/footy-feed.com',
        permanent: false, // 302 so Ezoic can update content
      },
    ];
  },
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
