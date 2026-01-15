import { Redis } from '@upstash/redis';
import { config } from '../config';

/**
 * Shared Redis instance
 *
 * Used by multiple services:
 * - Cache service
 * - Usage tracking service
 * - Rate limiting middleware
 */
export const redis = new Redis({
  url: config.UPSTASH_REDIS_URL,
  token: config.UPSTASH_REDIS_TOKEN,
});
