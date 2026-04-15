import Image from 'next/image';
import Link from 'next/link';
import { Twitter } from 'lucide-react';
import { NewsletterCTA } from '@/components/newsletter/NewsletterCTA';

const footerLinks = {
  navigation: [
    { href: '/news', label: 'News' },
    { href: '/live', label: 'Live Scores' },
    { href: '/fixtures', label: 'Fixtures' },
    { href: '/tables', label: 'Tables' },
  ],
  resources: [
    { href: '/match-reports', label: 'Match Reports' },
    { href: '/transfers', label: 'Transfers' },
    { href: '/predictions', label: 'Predictions' },
    { href: '/videos', label: 'Videos' },
    { href: '/what-if', label: 'What If' },
    { href: '/rules', label: 'Rules' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-zinc-700 bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <span className="text-lg font-bold text-white">FF</span>
              </div>
              <span className="text-xl font-bold text-white">Footy Feed</span>
            </Link>
            <p className="mt-4 text-sm text-zinc-300">
              Your one-stop destination for football news, fixtures, league tables, and match predictions.
            </p>
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

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white">Navigation</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/about" className="text-sm text-zinc-300 hover:text-white">About</Link></li>
              <li><Link href="/contact" className="text-sm text-zinc-300 hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-zinc-300 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-zinc-300 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="mt-8 border-t border-zinc-700 pt-8 pb-4">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-sm font-semibold text-white mb-1">Football News Without the Waffle</h3>
            <p className="text-xs text-zinc-400 mb-3">Weekly roundup straight to your inbox.</p>
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
                  src="/safer-gambling/gambleaware.png"
                  alt="GambleAware"
                  width={140}
                  height={28}
                  className="h-7 w-auto"
                />
              </a>
              <Image
                src="/safer-gambling/18plus.png"
                alt="18+ only"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </div>
            <p className="text-center text-xs font-medium text-zinc-300">
              Please Gamble Responsibly. For help and advice visit{' '}
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
            &copy; {new Date().getFullYear()} Footy Feed. Not affiliated with FIFA, UEFA, or any football league.
            <br />
            All football-related content and trademarks are property of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
