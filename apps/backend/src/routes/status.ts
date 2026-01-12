import { Hono } from 'hono';
import { usageService } from '../services/usage';
import { cacheService } from '../services/cache';
import { config } from '../config';

export const statusRoutes = new Hono();

/**
 * Public endpoint - check if chatbot is available
 * GET /api/status
 */
statusRoutes.get('/', async (c) => {
  try {
    const isAvailable = await usageService.isWithinLimit();
    return c.json({ available: isAvailable });
  } catch {
    // In case of Redis error (e.g., invalid credentials, offline),
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
