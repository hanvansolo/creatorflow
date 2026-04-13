import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';

import { Geist, Geist_Mono } from 'next/font/google';
import { LocationProvider } from '@/context/LocationContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeadScripts, BodyStartScripts, BodyEndScripts } from '@/components/layout/InjectedScripts';
import {
  SITE_CONFIG,
  DEFAULT_METADATA,
  generateWebSiteStructuredData,
  jsonLd,
  JsonLdScript,
} from '@/lib/seo';
import { NewsletterPopup } from '@/components/newsletter/NewsletterPopup';
import { CookieConsent } from '@/components/layout/CookieConsent';
import EzoicRouteHandler from '@/components/ads/EzoicRouteHandler';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  ...DEFAULT_METADATA,
  title: {
    default: `${SITE_CONFIG.name} - Football News Without the Waffle`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
};

export const viewport: Viewport = {
  themeColor: SITE_CONFIG.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const websiteStructuredData = jsonLd(generateWebSiteStructuredData());

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <JsonLdScript data={websiteStructuredData} />
        <meta name="impact-site-verification" content="cfef735d-47e2-4c0b-8630-84ff2dc0ea39" />
        <meta name="google-adsense-account" content="ca-pub-8717247095472771" />
        {/* Ezoic privacy/consent scripts — must load first */}
        <Script
          id="ezoic-cmp"
          src="https://cmp.gatekeeperconsent.com/min.js"
          strategy="beforeInteractive"
          data-cfasync="false"
        />
        <Script
          id="ezoic-cmp-2"
          src="https://the.gatekeeperconsent.com/cmp.min.js"
          strategy="beforeInteractive"
          data-cfasync="false"
        />
        {/* Ezoic standalone ad script */}
        <Script
          id="ezoic-sa"
          src="//www.ezojs.com/ezoic/sa.min.js"
          strategy="afterInteractive"
        />
        <Script id="ezoic-init" strategy="afterInteractive">
          {`
            window.ezstandalone = window.ezstandalone || {};
            window.ezstandalone.cmd = window.ezstandalone.cmd || [];
          `}
        </Script>
        <Script
          id="ezoic-analytics"
          src="//ezoicanalytics.com/analytics.js"
          strategy="afterInteractive"
        />
        {/* HeadScripts injects scripts from admin/scripts (AdSense, GA, etc.)
            directly into <head> as raw <script> tags so SSR crawlers see them */}
        <Suspense fallback={null}>
          <HeadScripts />
        </Suspense>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 antialiased`}
      >
        <EzoicRouteHandler />
        <Suspense fallback={null}>
          <BodyStartScripts />
        </Suspense>
        <LocationProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <NewsletterPopup />
            <Suspense fallback={null}>
              <CookieConsent />
            </Suspense>
          </div>
        </LocationProvider>
        <Suspense fallback={null}>
          <BodyEndScripts />
        </Suspense>
        {/* HilltopAds PopUnder — zone #6952125 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(mkaf){
            var d = document,
                s = d.createElement('script'),
                l = d.scripts[d.scripts.length - 1];
            s.settings = mkaf || {};
            s.src = "\\/\\/plasticdamage.com\\/cxDi9.6_bI2Q5BlJSbWFQj9-N\\/jbk\\/1IM\\/jpEZyBN\\/SB0x2VOhTsUEyUM\\/TwI\\/5y";
            s.async = true;
            s.referrerPolicy = 'no-referrer-when-downgrade';
            l.parentNode.insertBefore(s, l);
          })({})
        `}} />
        {/* HilltopAds In-Page Push — zone #6952185 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(mkaf){
            var d = document,
                s = d.createElement('script'),
                l = d.scripts[d.scripts.length - 1];
            s.settings = mkaf || {};
            s.src = "\\/\\/untimely-hello.com\\/b-XGV.sWdHGClo0HYHWWcx\\/Xe\\/mh9ZuBZRUnlGk\\/PBTiYR5JN\\/TpIUxaOIDbUStVNFjZkB1_MzjNEZ4nOxQq";
            s.async = true;
            s.referrerPolicy = 'no-referrer-when-downgrade';
            l.parentNode.insertBefore(s, l);
          })({})
        `}} />
      </body>
    </html>
  );
}
