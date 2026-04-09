import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'footyfeed_session';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_KEY;
  if (!secret) throw new Error('AUTH_KEY environment variable is not set');
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Redirect bare domain to www (preserves path and query)
  // CRITICAL: build URL from explicit string — don't use request.url which
  // contains Railway's internal port :8080. That broke AdSense verification
  // because the redirect target was https://www.footy-feed.com:8080/
  if (host === 'footy-feed.com') {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`https://www.footy-feed.com${pathname}${search}`, 301);
  }

  // Only protect /admin routes (not /api/admin which uses its own secret-based auth)
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
