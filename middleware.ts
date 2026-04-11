import { NextResponse, type NextRequest } from 'next/server';

/**
 * Lightweight admin gate.
 *
 * Protects:
 *   - /admin/*    (the UI)
 *   - /api/clients/*  (the management API)
 *
 * Mechanism:
 *   1. Check for an `instaflow_admin` cookie matching ADMIN_PASSWORD env.
 *   2. If missing, fall through to HTTP Basic Auth so curl/scripts work too.
 *   3. On successful Basic Auth, set the cookie so the browser stops prompting.
 *
 * Set ADMIN_PASSWORD in .env.local. If unset, the gate is OPEN (dev mode).
 */
export function middleware(req: NextRequest) {
  // Trim to defend against accidental trailing whitespace/newlines in the
  // stored secret — we hit this once because the GitHub secret had a \n,
  // and user-typed passwords never include one.
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) return NextResponse.next(); // dev mode — no gate

  const { pathname } = req.nextUrl;
  const needsAuth =
    pathname.startsWith('/admin') || pathname.startsWith('/api/clients');
  if (!needsAuth) return NextResponse.next();

  // 1. Cookie check
  const cookie = req.cookies.get('instaflow_admin')?.value;
  if (cookie === password) return NextResponse.next();

  // 2. Basic Auth fallback
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      const supplied = (idx === -1 ? decoded : decoded.slice(idx + 1)).trim();
      if (supplied === password) {
        const res = NextResponse.next();
        res.cookies.set('instaflow_admin', password, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return res;
      }
    } catch {
      /* fall through */
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Instaflow Admin"' },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/clients/:path*'],
};
