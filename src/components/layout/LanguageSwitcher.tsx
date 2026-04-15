'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/config';

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function switchTo(locale: Locale) {
    document.cookie = `footyfeed_locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    // Strip existing locale prefix if present
    const segs = pathname.split('/').filter(Boolean);
    if (segs.length > 0 && isLocale(segs[0])) segs.shift();
    const rest = '/' + segs.join('/');

    const target = locale === DEFAULT_LOCALE ? rest : `/${locale}${rest === '/' ? '' : rest}`;
    setOpen(false);
    router.push(target || '/');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{current}</span>
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
          {LOCALES.map(loc => (
            <li key={loc}>
              <button
                type="button"
                onClick={() => switchTo(loc)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 ${
                  loc === current ? 'text-emerald-400' : 'text-zinc-200'
                }`}
              >
                {LOCALE_NAMES[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
