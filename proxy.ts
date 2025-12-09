import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

// Edge auth guard for app routes
export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySession(sessionCookie.value);
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};
