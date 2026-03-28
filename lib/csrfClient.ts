const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function readCookieValue(cookieName: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    if (!cookie.startsWith(`${cookieName}=`)) {
      continue;
    }

    return decodeURIComponent(cookie.slice(cookieName.length + 1));
  }

  return null;
}

/**
 * Ensures the csrf-token cookie is present by probing /api/auth/me when it is
 * missing (e.g. after cookie expiry or when the AuthProvider restored state from
 * sessionStorage without hitting the server).  No-ops if the cookie is already
 * there, and swallows errors so the actual request can still run and return a
 * meaningful status (403 CSRF or 401 Unauth) to the caller.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (typeof document === 'undefined' || readCookieValue(CSRF_COOKIE_NAME)) {
    return;
  }
  try {
    await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
  } catch {
    // best-effort; the mutation will return a meaningful 403 / 401 if still missing
  }
}

export function createCsrfHeaders(headers?: HeadersInit): Headers {
  const resolvedHeaders = new Headers(headers);
  const token = readCookieValue(CSRF_COOKIE_NAME);

  if (token && !resolvedHeaders.has(CSRF_HEADER_NAME)) {
    resolvedHeaders.set(CSRF_HEADER_NAME, token);
  }

  return resolvedHeaders;
}
