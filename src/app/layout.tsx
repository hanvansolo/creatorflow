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
import { WidgetConfig } from '@/components/widgets/ApiFootballWidget';
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 antialiased`}
      >
        <Suspense fallback={null}>
          <HeadScripts />
        </Suspense>
        <Suspense fallback={null}>
          <BodyStartScripts />
        </Suspense>
        <LocationProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <NewsletterPopup />
            {process.env.API_FOOTBALL_KEY && (
              <WidgetConfig apiKey={process.env.API_FOOTBALL_KEY} theme="dark" />
            )}
          </div>
        </LocationProvider>
        <Suspense fallback={null}>
          <BodyEndScripts />
        </Suspense>
      </body>
    </html>
  );
}
