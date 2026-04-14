import type { NextRequest } from 'next/server';

/**
 * Reusable admin authorization check for API routes.
 *
 * The middleware gates `/admin/*`, `/api/clients/*`, and `/api/admin/*` with
 * Basic Auth + cookie. For routes that need different behavior per HTTP
 * method (e.g. /api/conversations: POST is public so the widget can save
 * calls, GET must be admin-only), import this from inside the handler.
 *
 * Returns true if no ADMIN_PASSWORD is set (dev mode — gate is open).
 */
export function isAdminAuthorized(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) return true;
  const cookie = req.cookies.get('instaflow_admin')?.value?.trim();
  if (cookie === password) return true;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      const supplied = (idx === -1 ? decoded : decoded.slice(idx + 1)).trim();
      if (supplied === password) return true;
    } catch {
      /* fall through to 401 */
    }
  }
  return false;
}
