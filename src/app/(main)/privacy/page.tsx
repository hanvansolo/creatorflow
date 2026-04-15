import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { translateField } from '@/lib/i18n/translate';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

export const metadata: Metadata = createPageMetadata(
  'Privacy Policy - Footy Feed',
  'Footy Feed privacy policy. Learn how we collect, use, and protect your data when you use our football news and analysis platform.',
  '/privacy',
  ['privacy policy', 'data protection', 'Footy Feed privacy']
);

const PRIVACY_BODY_EN = `1. Introduction. Footy Feed ("we", "our", "us") operates the website footy-feed.com. This Privacy Policy explains how we collect, use, and protect information when you visit our site.

2. Information We Collect. We may collect the following information: contact form submissions (name, email, message), account information (email, display name), usage data (pages visited, time on site, browser type), and cookies (essential for authentication, third-party for analytics/advertising).

3. How We Use Your Information. To respond to your enquiries, to provide and improve our services, to analyse site usage, and to display relevant advertising via Google AdSense.

4. Third-Party Services. We use Google Analytics for traffic analysis, Google AdSense for advertisements, and YouTube for embedded videos. These services set their own cookies and collect data per their own privacy policies.

5. Data Retention. Contact form submissions are retained until no longer needed. Analytics data is retained per Google Analytics defaults. You can request deletion of your data at any time by contacting us.

6. Your Rights. You have the right to access the data we hold, request correction or deletion, opt out of analytics tracking via your browser, and withdraw consent at any time.

7. Contact Us. If you have questions about this Privacy Policy, contact us via our contact page.`;

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const lastUpdated = 'March 20, 2026';

  const body = locale === DEFAULT_LOCALE
    ? PRIVACY_BODY_EN
    : await translateField('legal_page', 'privacy_v1', 'body', PRIVACY_BODY_EN, locale);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{t.legal.privacyHeading}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{t.legal.lastUpdated} {lastUpdated}</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}
