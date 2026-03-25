import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = createPageMetadata(
  'Contact Us - Footy Feed',
  'Get in touch with the Footy Feed team. Send us your feedback, report issues, or ask questions about our football news and analysis platform.',
  '/contact',
  ['contact Footy Feed', 'Footy Feed feedback', 'contact us', 'get in touch']
);

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Contact Us</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-8">
          Have feedback, spotted an issue, or just want to say hello? We&apos;d love to hear from you.
        </p>

        <ContactForm />

        <div className="mt-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Other Ways to Reach Us</h2>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              Follow us on <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 underline">Twitter/X</a> for updates.
            </li>
            <li>
              Report bugs or feature requests on <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 underline">GitHub</a>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
