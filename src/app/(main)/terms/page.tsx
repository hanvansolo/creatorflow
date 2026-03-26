import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'Terms of Service - Footy Feed',
  'Terms of Service for Footy Feed. Read the terms and conditions governing your use of our football news and analysis platform.',
  '/terms',
  ['terms of service', 'terms and conditions', 'Footy Feed terms']
);

export default function TermsPage() {
  const lastUpdated = 'March 26, 2026';

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">1. Acceptance of Terms</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              By accessing and using Footy Feed (&quot;the Service&quot;), you accept and agree to be bound by these
              Terms of Service. If you do not agree with any part of these terms, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">2. Use of the Service</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Footy Feed is a football news aggregation and data display platform. The Service provides:
            </p>
            <ul className="text-zinc-600 dark:text-zinc-300 list-disc pl-6 space-y-1">
              <li>Aggregated football news from third-party sources.</li>
              <li>Live scores, fixtures, league tables, and match statistics.</li>
              <li>Match predictions and analytical content.</li>
              <li>User-generated comments and community features.</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-300 mt-3">
              You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights
              of, or restrict or inhibit the use and enjoyment of the Service by, any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">3. Intellectual Property</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              News articles, images, and other third-party content displayed on Footy Feed remain the property of
              their respective owners and original publishers. Footy Feed aggregates and links to this content under
              fair use principles and does not claim ownership of third-party materials.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 mt-3">
              The Footy Feed name, logo, design, and original content (including but not limited to predictions,
              analysis, and editorial commentary) are the property of Footy Feed and may not be reproduced without
              prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">4. Disclaimer</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Footy Feed is <strong>not affiliated with, endorsed by, or connected to</strong> FIFA, UEFA, the
              Premier League, La Liga, Serie A, Bundesliga, Ligue 1, or any other football governing body, league,
              club, or player. All football-related trademarks, logos, and names are the property of their respective
              owners.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 mt-3">
              Match predictions and statistical analyses are provided for informational and entertainment purposes
              only. We do not guarantee the accuracy of any predictions and they should not be used for betting or
              gambling purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">5. Limitation of Liability</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Footy Feed makes no
              warranties, express or implied, regarding the accuracy, completeness, or reliability of any content
              displayed on the platform.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 mt-3">
              To the maximum extent permitted by law, Footy Feed shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">6. Third-Party Content and Links</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              The Service may contain links to third-party websites and content that is not owned or controlled by
              Footy Feed. We have no control over, and assume no responsibility for, the content, privacy policies,
              or practices of any third-party sites or services.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 mt-3">
              We display advertisements through Google AdSense and other advertising partners. These third parties may
              use cookies and similar technologies to serve ads based on your browsing activity. Please refer to our{' '}
              <a href="/privacy" className="text-emerald-500 hover:text-emerald-400 underline">Privacy Policy</a>{' '}
              for more information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">7. User Conduct</h2>
            <p className="text-zinc-600 dark:text-zinc-300">When using the Service, you agree not to:</p>
            <ul className="text-zinc-600 dark:text-zinc-300 list-disc pl-6 space-y-1">
              <li>Post abusive, offensive, or discriminatory comments.</li>
              <li>Attempt to gain unauthorised access to any part of the Service.</li>
              <li>Use automated tools to scrape or collect data from the Service without permission.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">8. Changes to Terms</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately
              upon posting to this page. Your continued use of the Service after any changes constitutes acceptance of
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">9. Contact Information</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              If you have any questions about these Terms of Service, please contact us via our{' '}
              <a href="/contact" className="text-emerald-500 hover:text-emerald-400 underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
