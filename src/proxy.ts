import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Validates the Auth.js session JWT (signature + expiry), not just cookie presence.
// The login page is always reachable and itself clears any old session, so opening
// "Admin" always asks for credentials.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  if (!req.auth || (req.auth.user as any)?.role !== 'ADMIN') {
    const url = new URL('/admin/login', req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
