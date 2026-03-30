import { NextResponse } from 'next/server';

/**
 * Security headers middleware for admin dashboard
 * Applies essential security headers to all responses
 */
export function middleware() {
  const response = NextResponse.next();

  const sentryConnectSources = [
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
    'https://*.ingest.us.sentry.io',
  ];

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    try {
      const sentryOrigin = new URL(sentryDsn).origin;
      if (!sentryConnectSources.includes(sentryOrigin)) {
        sentryConnectSources.push(sentryOrigin);
      }
    } catch {
      // Ignore malformed DSN and keep default allowlist.
    }
  }

  // Prevent clickjacking attacks - admin can only be framed by itself
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Disable client-side caching for admin panel (sensitive data)
  response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');

  // Enable XSS protection in older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - restrictive for admin panel
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  );

  // Strict Content Security Policy for admin panel
  // In development: allow unsafe-eval and unsafe-inline for React Fast Refresh
  // In production: allow Next.js inline bootstrap scripts
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" // Dev: needed for React Fast Refresh
    : "script-src 'self' 'unsafe-inline'"; // Prod: allow Next inline bootstrap scripts

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // MUI requires unsafe-inline for styles
    "img-src 'self' data:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://tonejs.github.io ${sentryConnectSources.join(' ')}`,
    "frame-ancestors 'none'", // Prevent embedding in any frame
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // HSTS for admin dashboard (strongly encourage HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - will have their own security headers
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
