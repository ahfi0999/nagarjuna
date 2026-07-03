import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth0 } from '@/features/auth/server/auth0';

const AUTH_ROUTES_PREFIX = '/auth/';
const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';

export async function middleware(request: NextRequest) {
  const authResponse = await auth0.middleware(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(AUTH_ROUTES_PREFIX)) {
    return authResponse;
  }

  const session = await auth0.getSession(request);

  if (!session && pathname !== LOGIN_ROUTE) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
  }

  if (session && (pathname === LOGIN_ROUTE || pathname === '/')) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  return authResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
