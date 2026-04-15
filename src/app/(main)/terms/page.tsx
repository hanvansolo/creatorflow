import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { translateField } from '@/lib/i18n/translate';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

export const metadata: Metadata = createPageMetadata(
  'Terms of Service - Footy Feed',
  'Terms of Service for Footy Feed. Read the terms and conditions governing your use of our football news and analysis platform.',
  '/terms',
  ['terms of service', 'terms and conditions', 'Footy Feed terms']
);

const TERMS_BODY_EN = `1. Acceptance of Terms. By accessing and using Footy Feed ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Service.

2. Use of the Service. Footy Feed is a football news aggregation and data display platform. The Service provides aggregated football news from third-party sources, live scores, fixtures, league tables, match statistics, match predictions, analytical content, and user-generated comments. You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights of, or restrict or inhibit the use and enjoyment of the Service by, any third party.

3. Intellectual Property. News articles, images, and other third-party content displayed on Footy Feed remain the property of their respective owners. Footy Feed aggregates and links to this content under fair use principles and does not claim ownership. The Footy Feed name, logo, design, and original content (predictions, analysis, editorial commentary) are the property of Footy Feed and may not be reproduced without prior written permission.

4. Disclaimer. Footy Feed is NOT affiliated with, endorsed by, or connected to FIFA, UEFA, the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, or any other football governing body, league, club, or player. All football-related trademarks, logos, and names are the property of their respective owners. Match predictions and statistical analyses are provided for informational and entertainment purposes only. We do not guarantee the accuracy of any predictions and they should not be used for betting or gambling purposes.

5. Limitation of Liability. The Service is provided on an "as is" and "as available" basis. Footy Feed makes no warranties, express or implied, regarding the accuracy, completeness, or reliability of any content displayed on the platform. To the maximum extent permitted by law, Footy Feed shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.

6. Third-Party Content and Links. The Service may contain links to third-party websites and content that is not owned or controlled by Footy Feed. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites or services. We display advertisements through Google AdSense and other advertising partners. These third parties may use cookies and similar technologies to serve ads based on your browsing activity.

7. User Conduct. When using the Service, you agree not to: post abusive, offensive, or discriminatory comments; attempt to gain unauthorised access to any part of the Service; use automated tools to scrape or collect data from the Service without permission; or impersonate any person or entity.

8. Changes to Terms. We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to this page. Your continued use of the Service after any changes constitutes acceptance of the updated terms.

9. Contact Information. If you have any questions about these Terms of Service, please contact us via our contact page.`;

export default async function TermsPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const lastUpdated = 'March 26, 2026';

  const body = locale === DEFAULT_LOCALE
    ? TERMS_BODY_EN
    : await translateField('legal_page', 'terms_v1', 'body', TERMS_BODY_EN, locale);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{t.legal.termsHeading}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{t.legal.lastUpdated} {lastUpdated}</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}
