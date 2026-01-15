import type { Context, Next } from 'hono';
import { redis } from '../services/redis';
import { config } from '../config';

/**
 * Rate Limiting Middleware
 *
 * Uses Redis to track request counts per IP address within a sliding window.
 * Prevents abuse even if API token is compromised.
 *
 * Default: 10 requests per minute per IP
 */

/**
 * Get client IP address from request
 */
function getClientIp(c: Context): string {
  // Try common headers in order of preference
  const cfConnectingIp = c.req.header('CF-Connecting-IP');
  const xForwardedFor = c.req.header('X-Forwarded-For');
  const xRealIp = c.req.header('X-Real-IP');

  if (cfConnectingIp) return cfConnectingIp;
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }
  if (xRealIp) return xRealIp;

  // Fallback to a default if no IP headers are present
  return 'unknown';
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  const clientIp = getClientIp(c);
  const key = `chatbot:ratelimit:${clientIp}`;

  try {
    // Get current count
    const currentCount = await redis.get<number>(key);
    const count = currentCount || 0;

    // Check if limit exceeded
    if (count >= config.RATE_LIMIT_REQUESTS) {
      return c.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        429,
      );
    }

    // Increment counter
    const newCount = await redis.incr(key);

    // Set expiry on first request (TTL in seconds)
    if (newCount === 1) {
      await redis.expire(key, Math.floor(config.RATE_LIMIT_WINDOW_MS / 1000));
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.RATE_LIMIT_REQUESTS.toString());
    c.header('X-RateLimit-Remaining', (config.RATE_LIMIT_REQUESTS - newCount).toString());

    await next();
  } catch (error) {
    console.error('Error in rate limiting middleware:', error);
    // Allow request to proceed if Redis fails (fail open for better UX)
    await next();
  }
}
