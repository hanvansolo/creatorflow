import Image from 'next/image';
import Link from 'next/link';
import { Twitter } from 'lucide-react';
import { NewsletterCTA } from '@/components/newsletter/NewsletterCTA';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';

function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

export function Footer({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const p = localePrefix(locale);

  const footerLinks = {
    navigation: [
      { href: `${p}/news`, label: t.nav.news },
      { href: `${p}/live`, label: t.nav.live },
      { href: `${p}/fixtures`, label: t.nav.fixtures },
      { href: `${p}/tables`, label: t.nav.tables },
    ],
    resources: [
      { href: `${p}/match-reports`, label: t.nav.matchReports },
      { href: `${p}/transfers`, label: t.nav.transfers },
      { href: `${p}/predictions`, label: t.nav.predictions },
      { href: `${p}/videos`, label: t.nav.videos },
      { href: `${p}/what-if`, label: t.nav.whatIf },
      { href: `${p}/rules`, label: t.nav.rules },
    ],
  };

  return (
    <footer className="border-t border-zinc-700 bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href={p || '/'} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <span className="text-lg font-bold text-white">FF</span>
              </div>
              <span className="text-xl font-bold text-white">Footy Feed</span>
            </Link>
            <p className="mt-4 text-sm text-zinc-300">{t.footer.tagline}</p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://twitter.com/FootyFeed"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{t.footer.navigation}</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{t.footer.resources}</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{t.footer.company}</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href={`${p}/about`} className="text-sm text-zinc-300 hover:text-white">{t.nav.about}</Link></li>
              <li><Link href={`${p}/contact`} className="text-sm text-zinc-300 hover:text-white">{t.nav.contact}</Link></li>
              <li><Link href={`${p}/privacy`} className="text-sm text-zinc-300 hover:text-white">{t.nav.privacy}</Link></li>
              <li><Link href={`${p}/terms`} className="text-sm text-zinc-300 hover:text-white">{t.nav.terms}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-700 pt-8 pb-4">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-sm font-semibold text-white mb-1">{t.footer.newsletterTitle}</h3>
            <p className="text-xs text-zinc-400 mb-3">{t.footer.newsletterSubtitle}</p>
            <NewsletterCTA source="footer" variant="inline" />
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-700 pt-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 rounded bg-white px-4 py-2">
              <a
                href="https://www.gambleaware.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GambleAware"
              >
                <Image
                  src="/safer-gambling/gambleaware.svg"
                  alt="GambleAware"
                  width={140}
                  height={28}
                  className="h-7 w-auto"
                />
              </a>
              <Image
                src="/safer-gambling/18plus.svg"
                alt="18+ only"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </div>
            <p className="text-center text-xs font-medium text-zinc-300">
              {t.footer.gambleResponsibly}{' '}
              <a
                href="https://www.gambleaware.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                www.gambleaware.org
              </a>
              .
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Footy Feed. {t.footer.disclaimer}
            <br />
            {t.footer.trademarks}
          </p>
        </div>
      </div>
    </footer>
  );
}
