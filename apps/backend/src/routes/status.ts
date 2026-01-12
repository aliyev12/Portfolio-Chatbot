import { Hono } from 'hono';
import { usageService } from '../services/usage';
import { cacheService } from '../services/cache';
import { config } from '../config';

export const statusRoutes = new Hono();

/**
 * Helper to create a timeout promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
}

/**
 * Public endpoint - check if chatbot is available
 * GET /api/status
 */
statusRoutes.get('/', async (c) => {
  try {
    // Add 3 second timeout to prevent hanging on slow/invalid Redis connections
    const isAvailable = await withTimeout(usageService.isWithinLimit(), 3000);
    return c.json({ available: isAvailable });
  } catch {
    // In case of Redis error (e.g., invalid credentials, offline, timeout),
    // assume chatbot is available in development/test, or unavailable in production
    const isProduction = process.env.NODE_ENV === 'production';
    return c.json({ available: !isProduction });
  }
});

/**
 * Protected endpoint - get detailed usage stats
 * GET /api/status/usage
 * Requires: Authorization: Bearer {ADMIN_SECRET}
 */
statusRoutes.get('/usage', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader !== `Bearer ${config.ADMIN_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const usage = await usageService.getUsage();
  return c.json(usage);
});

/**
 * Protected endpoint - clear cache
 * POST /api/status/clear-cache
 * Requires: Authorization: Bearer {ADMIN_SECRET}
 */
statusRoutes.post('/clear-cache', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader !== `Bearer ${config.ADMIN_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await cacheService.clear();
  return c.json({ success: true });
});
