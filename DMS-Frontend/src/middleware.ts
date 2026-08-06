import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy / bookmarked paths → real routes
  if (pathname === '/settings') {
    return NextResponse.redirect(new URL('/administrator/system-settings', request.url));
  }
  if (pathname === '/profile') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];

  // Check if the current route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For now, just allow all routes (client-side protection handles auth)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
