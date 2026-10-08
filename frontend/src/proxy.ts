import { type NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE, sessionFromToken } from '@/lib/auth';

/**
 * Optimistic gate only: a missing or expired token never reaches the app.
 * The API still authorizes every request.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = sessionFromToken(request.cookies.get(TOKEN_COOKIE)?.value);

  if (pathname === '/login') {
    if (session)
      return NextResponse.redirect(new URL('/patients', request.url));
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL('/login', request.url);
    if (request.cookies.has(TOKEN_COOKIE))
      login.searchParams.set('reason', 'expired');
    const response = NextResponse.redirect(login);
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)',
  ],
};
