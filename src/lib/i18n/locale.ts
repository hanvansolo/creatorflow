import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * Read the current request's locale from the `x-locale` header set by middleware.
 * Falls back to the default locale if the header is missing.
 * Server Component only.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const raw = h.get('x-locale');
  return raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
}
