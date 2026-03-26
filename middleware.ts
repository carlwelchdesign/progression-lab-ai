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

  // Enable XSS protection in older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (formerly Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()',
  );

  // Content Security Policy - restrictive by default
  // Adjust based on your actual resource sources
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for your needs
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${sentryConnectSources.join(' ')}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
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
