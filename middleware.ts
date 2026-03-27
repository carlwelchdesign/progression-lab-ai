import { NextResponse } from 'next/server';

/**
 * Security headers middleware for Next.js
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

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Disable client-side caching for sensitive responses
  response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');

  // Enable XSS protection in older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - restrict access to sensitive browser APIs
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  );

  // Content Security Policy - restrictive by default
  // In development: allow unsafe-eval for React Fast Refresh and unsafe-inline for next.js hot module replacement
  // In production: strict policy to prevent XSS attacks
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" // Dev: needed for React Fast Refresh
    : "script-src 'self' 'unsafe-inline'"; // Prod: allow Next inline bootstrap scripts

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // MUI requires unsafe-inline for styles
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${sentryConnectSources.join(' ')}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // HSTS - tell browsers to use HTTPS only (enable after confirming HTTPS works)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
