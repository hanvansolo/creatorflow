import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { ContactForm } from '@/components/contact/ContactForm';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';

export const metadata: Metadata = createPageMetadata(
  'Contact Us - Footy Feed',
  'Get in touch with the Footy Feed team. Send us your feedback, report issues, or ask questions about our football news and analysis platform.',
  '/contact',
  ['contact Footy Feed', 'Footy Feed feedback', 'contact us', 'get in touch']
);

export default async function ContactPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{t.contact.heading}</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-8">{t.contact.intro}</p>

        <ContactForm />

        <div className="mt-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">{t.contact.otherWays}</h2>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>{t.contact.twitter}</li>
            <li>{t.contact.github}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
