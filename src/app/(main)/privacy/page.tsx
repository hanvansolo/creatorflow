import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'Privacy Policy - Footy Feed',
  'Footy Feed privacy policy. Learn how we collect, use, and protect your data when you use our football news and analysis platform.',
  '/privacy',
  ['privacy policy', 'data protection', 'Footy Feed privacy']
);

export default function PrivacyPage() {
  const lastUpdated = 'March 20, 2026';

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">1. Introduction</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Footy Feed (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website footy-feed.com. This Privacy Policy explains how we
              collect, use, and protect information when you visit our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">2. Information We Collect</h2>
            <p className="text-zinc-600 dark:text-zinc-300">We may collect the following information:</p>
            <ul className="text-zinc-600 dark:text-zinc-300 list-disc pl-6 space-y-1">
              <li><strong>Contact form submissions:</strong> Name, email address, and message content when you use our contact form.</li>
              <li><strong>Account information:</strong> Email address and display name if you create an account.</li>
              <li><strong>Usage data:</strong> Pages visited, time on site, and browser type, collected via analytics tools.</li>
              <li><strong>Cookies:</strong> We use essential cookies for authentication and third-party cookies for analytics and advertising.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">3. How We Use Your Information</h2>
            <ul className="text-zinc-600 dark:text-zinc-300 list-disc pl-6 space-y-1">
              <li>To respond to your enquiries via the contact form.</li>
              <li>To provide and improve our services.</li>
              <li>To analyse site usage and improve user experience.</li>
              <li>To display relevant advertising via Google AdSense.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">4. Third-Party Services</h2>
            <p className="text-zinc-600 dark:text-zinc-300">We use the following third-party services:</p>
            <ul className="text-zinc-600 dark:text-zinc-300 list-disc pl-6 space-y-1">
              <li><strong>Google Analytics:</strong> For website traffic analysis.</li>
              <li><strong>Google AdSense:</strong> For displaying advertisements.</li>
              <li><strong>YouTube:</strong> For embedding video content.</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-300">
              These services may set their own cookies and collect data according to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">5. Data Retention</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Contact form submissions are retained until they are no longer needed for communication purposes.
              Analytics data is retained according to Google Analytics default settings. You can request deletion
              of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">6. Your Rights</h2>
            <p className="text-zinc-600 dark:text-zinc-300">You have the right to:</p>
            <ul className="text-zinc-600 dark:text-zinc-300 list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of analytics tracking via your browser settings.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">7. Contact Us</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              If you have any questions about this Privacy Policy, please contact us via
              our <a href="/contact" className="text-emerald-500 hover:text-emerald-400 underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
