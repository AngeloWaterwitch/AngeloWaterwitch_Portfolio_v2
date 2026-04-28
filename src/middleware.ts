import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin') && !isLoginPage;
  const isApiAuth = pathname.startsWith('/api/auth');

  if (isApiAuth) return NextResponse.next();
  if (isAdminPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};