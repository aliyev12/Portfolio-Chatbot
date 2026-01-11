import { Redis } from '@upstash/redis';
import { config } from '../config';

const redis = new Redis({
  url: config.UPSTASH_REDIS_URL,
  token: config.UPSTASH_REDIS_TOKEN,
});

const CACHE_PREFIX = 'chatbot:cache:';
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Normalizes a question by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Removing punctuation
 * - Collapsing multiple spaces into one
 */
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Hashes a question using Bun's built-in hash function
 */
function hashQuestion(question: string): string {
  const normalized = normalizeQuestion(question);
  // Bun.hash returns a number, convert to hex string for Redis key
  return Bun.hash(normalized).toString(16);
}

export const cacheService = {
  async get(question: string): Promise<string | null> {
    const hash = hashQuestion(question);
    return redis.get<string>(`${CACHE_PREFIX}${hash}`);
  },

  async set(question: string, response: string): Promise<void> {
    const hash = hashQuestion(question);
    await redis.set(`${CACHE_PREFIX}${hash}`, response, { ex: CACHE_TTL });
  },

  async clear(): Promise<void> {
    // Get all cache keys matching the prefix
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
