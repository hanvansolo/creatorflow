import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { LOCALES, DEFAULT_LOCALE, localeForCountry, isLocale, type Locale } from '@/lib/i18n/config';

const COOKIE_NAME = 'footyfeed_session';
const LOCALE_COOKIE = 'footyfeed_locale';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_KEY;
  if (!secret) throw new Error('AUTH_KEY environment variable is not set');
  return new TextEncoder().encode(secret);
}

function detectCountry(request: NextRequest): string | null {
  return (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country') ||
    null
  );
}

function pickLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const langs = header.split(',').map(s => s.split(';')[0].trim().toLowerCase().slice(0, 2));
  for (const lang of langs) {
    if (isLocale(lang)) return lang;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Bare domain → www redirect (preserves path + query)
  if (host === 'footy-feed.com') {
    return NextResponse.redirect(`https://www.footy-feed.com${pathname}${search}`, 301);
  }

  // Skip i18n for API, Next internals, and static assets — matcher already
  // filters most but double-guard here for safety.
  const isBypass = pathname.startsWith('/api') || pathname.startsWith('/_next');

  // --- Locale handling ---
  // Pathname may or may not begin with a locale prefix like `/es` or `/ar`.
  const firstSeg = pathname.split('/')[1] || '';
  const hasLocalePrefix = isLocale(firstSeg);

  if (!isBypass) {
    // Admin routes stay unlocalized — fall through to auth logic below.
    const isAdmin = pathname.startsWith('/admin');

    if (!isAdmin) {
      const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
      const validCookieLocale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : null;

      if (hasLocalePrefix) {
        // URL already carries a locale — rewrite it away so the existing route
        // tree serves the page, but stamp the locale on a header so pages can
        // read it via headers().
        const locale = firstSeg as Locale;
        const rewrittenPath = pathname.slice(locale.length + 1) || '/';
        const url = request.nextUrl.clone();
        url.pathname = rewrittenPath;

        const response = locale === DEFAULT_LOCALE
          // Redirect /en/foo → /foo (default locale is unprefixed, cleaner SEO)
          ? NextResponse.redirect(url, 301)
          : NextResponse.rewrite(url, {
              request: {
                headers: (() => {
                  const h = new Headers(request.headers);
                  h.set('x-locale', locale);
                  return h;
                })(),
              },
            });

        if (locale !== DEFAULT_LOCALE) {
          response.cookies.set(LOCALE_COOKIE, locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
          });
          response.headers.set('x-locale', locale);
        }
        // Still need to run admin/auth logic below — but locale URLs don't hit admin
        return response;
      }

      // No locale prefix in URL — this is the default (English) route.
      // If a cookie says otherwise, respect it. Otherwise detect from geo.
      if (!validCookieLocale) {
        const country = detectCountry(request);
        const geoLocale = localeForCountry(country);
        const headerLocale = pickLocaleFromAcceptLanguage(request.headers.get('accept-language'));
        const detected = geoLocale !== DEFAULT_LOCALE ? geoLocale : (headerLocale || DEFAULT_LOCALE);

        if (detected !== DEFAULT_LOCALE) {
          // First-time visitor from a non-English country: redirect to localized URL.
          const url = request.nextUrl.clone();
          url.pathname = `/${detected}${pathname === '/' ? '' : pathname}`;
          const redirect = NextResponse.redirect(url, 302);
          redirect.cookies.set(LOCALE_COOKIE, detected, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
          });
          return redirect;
        }

        // Set cookie to remember this is an English visitor — stops re-checking.
        const response = NextResponse.next();
        response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        });
        response.headers.set('x-locale', DEFAULT_LOCALE);
        return response;
      }

      // Returning visitor with a locale cookie.
      if (validCookieLocale !== DEFAULT_LOCALE) {
        // Their preferred locale isn't the default — redirect to localized URL.
        const url = request.nextUrl.clone();
        url.pathname = `/${validCookieLocale}${pathname === '/' ? '' : pathname}`;
        return NextResponse.redirect(url, 302);
      }

      // Cookie confirms English, proceed normally.
      const response = NextResponse.next();
      response.headers.set('x-locale', DEFAULT_LOCALE);
      // Fall through to admin check only if pathname starts with /admin.
      if (!pathname.startsWith('/admin')) return response;
    }
  }

  // --- Admin auth (unchanged) ---
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as string;

    if (role !== 'admin' && role !== 'superadmin') {
      const url = new URL('/not-found', request.url);
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api|robots.txt|sitemap.xml).*)'],
};
