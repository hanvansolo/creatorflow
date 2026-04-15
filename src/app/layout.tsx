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
import { getLocale } from '@/lib/i18n/locale';
import { LOCALES, LOCALE_BCP47, RTL_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { headers } from 'next/headers';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const h = await headers();
  const pathname = h.get('x-invoke-path') || h.get('x-pathname') || '/';
  const basePath = (() => {
    // Strip any existing locale prefix so we can build hreflang alternates.
    const segs = pathname.split('/').filter(Boolean);
    if (segs.length > 0 && (LOCALES as readonly string[]).includes(segs[0])) segs.shift();
    return '/' + segs.join('/');
  })();
  const isRTL = (RTL_LOCALES as readonly string[]).includes(locale);

  return (
    <html lang={LOCALE_BCP47[locale]} dir={isRTL ? 'rtl' : 'ltr'} className="dark">
      <head>
        <JsonLdScript data={websiteStructuredData} />
        <meta name="impact-site-verification" content="cfef735d-47e2-4c0b-8630-84ff2dc0ea39" />
        <meta name="google-site-verification" content="YwRng0DAkw2pSrZx-11wvohvBoRYFw9WBzp_JUGRlvU" />
        {/* hreflang alternates for every supported locale */}
        {LOCALES.map(loc => {
          const href = loc === DEFAULT_LOCALE
            ? `https://www.footy-feed.com${basePath === '/' ? '' : basePath}`
            : `https://www.footy-feed.com/${loc}${basePath === '/' ? '' : basePath}`;
          return <link key={loc} rel="alternate" hrefLang={LOCALE_BCP47[loc]} href={href} />;
        })}
        <link rel="alternate" hrefLang="x-default" href={`https://www.footy-feed.com${basePath === '/' ? '' : basePath}`} />
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
            <Header locale={locale} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
            <NewsletterPopup />
            <Suspense fallback={null}>
              <CookieConsent />
            </Suspense>
          </div>
        </LocationProvider>
        <Suspense fallback={null}>
          <BodyEndScripts />
        </Suspense>
      </body>
    </html>
  );
}
