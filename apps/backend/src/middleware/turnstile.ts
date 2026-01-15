import type { Context, Next } from 'hono';
import { config } from '../config';

/**
 * Cloudflare Turnstile Verification Middleware
 *
 * Validates that requests include a valid Turnstile token.
 * This ensures the request is from a real human, not a bot.
 *
 * Turnstile verification endpoint:
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function turnstileMiddleware(c: Context, next: Next) {
  const turnstileToken = c.req.header('X-Turnstile-Token');

  if (!turnstileToken) {
    return c.json(
      {
        error: 'Missing Turnstile token',
        code: 'MISSING_TURNSTILE_TOKEN',
      },
      401,
    );
  }

  // Skip verification in development if no secret key is configured
  if (process.env.NODE_ENV !== 'production' && !config.TURNSTILE_SECRET_KEY) {
    console.warn('⚠️  Turnstile verification skipped (development mode, no secret key)');
    await next();
    return;
  }

  try {
    // Verify the token with Cloudflare
    const verificationResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: config.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          // Optional: include user's IP for additional validation
          // remoteip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        }),
      },
    );

    const result = await verificationResponse.json() as TurnstileResponse;

    if (!result.success) {
      console.error('Turnstile verification failed:', result['error-codes']);
      return c.json(
        {
          error: 'Turnstile verification failed',
          code: 'TURNSTILE_VERIFICATION_FAILED',
          details: result['error-codes'],
        },
        403,
      );
    }

    // Verification successful
    await next();
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return c.json(
      {
        error: 'Failed to verify Turnstile token',
        code: 'TURNSTILE_VERIFICATION_ERROR',
      },
      500,
    );
  }
}
