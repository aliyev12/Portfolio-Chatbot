import { MiddlewareHandler } from 'hono';
import { config } from '../config';

/**
 * Security headers middleware for Hono
 * Implements OWASP recommended security headers
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  // X-Content-Type-Options: Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: Prevent clickjacking attacks
  // DENY prevents the page from being embedded in any iframe
  c.header('X-Frame-Options', 'DENY');

  // X-XSS-Protection: Enable browser XSS protection (legacy browsers)
  // Modern browsers use CSP instead, but this provides defense in depth
  c.header('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: Control referrer information
  // strict-origin-when-cross-origin: Send full URL for same-origin, origin only for cross-origin HTTPS
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content-Security-Policy: Define approved content sources
  // For API responses, we use a restrictive policy
  const isApiRoute = c.req.path.startsWith('/api/');

  if (isApiRoute) {
    // Strict CSP for API endpoints - no inline scripts, only same-origin
    c.header(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  } else {
    // More permissive CSP for widget.js and demo pages
    // Allow inline scripts for widget initialization
    const allowedOrigins = config.ALLOWED_ORIGINS.join(' ');

    c.header(
      'Content-Security-Policy',
      `default-src 'self'; ` +
        `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; ` +
        `style-src 'self' 'unsafe-inline'; ` +
        `img-src 'self' data:; ` +
        `font-src 'self'; ` +
        `connect-src 'self' ${allowedOrigins} https://challenges.cloudflare.com; ` +
        `frame-src https://challenges.cloudflare.com; ` +
        `frame-ancestors ${allowedOrigins}; ` +
        `base-uri 'self'; ` +
        `form-action 'self'`,
    );
  }

  // Strict-Transport-Security: Force HTTPS (only in production)
  // max-age=31536000: 1 year
  // includeSubDomains: Apply to all subdomains
  // preload: Allow inclusion in browser HSTS preload lists
  console.warn('[INFO] process.env.NODE_ENV = ', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Permissions-Policy: Restrict browser features
  // Disable unnecessary features to reduce attack surface
  c.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  );
};
