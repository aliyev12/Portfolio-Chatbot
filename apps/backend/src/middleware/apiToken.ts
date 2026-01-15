import type { Context, Next } from 'hono';
import { config } from '../config';

/**
 * API Token Authentication Middleware
 *
 * Validates that requests include the correct API token in the X-API-Token header.
 * This prevents casual API abuse from curl/Postman users.
 *
 * Note: Since the token is included in client-side JavaScript, it's not truly secret.
 * This is defense-in-depth combined with CAPTCHA, CORS, and rate limiting.
 */
export async function apiTokenMiddleware(c: Context, next: Next) {
  const apiToken = c.req.header('X-API-Token');

  if (!apiToken) {
    return c.json(
      {
        error: 'Missing API token',
        code: 'MISSING_API_TOKEN',
      },
      401,
    );
  }

  if (apiToken !== config.API_TOKEN) {
    return c.json(
      {
        error: 'Invalid API token',
        code: 'INVALID_API_TOKEN',
      },
      401,
    );
  }

  await next();
}
