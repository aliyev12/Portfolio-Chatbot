import { Redis } from '@upstash/redis';
import { config } from '../config';

const redis = new Redis({
  url: config.UPSTASH_REDIS_URL,
  token: config.UPSTASH_REDIS_TOKEN,
});

const USAGE_KEY = 'chatbot:usage:count';
const USAGE_RESET_KEY = 'chatbot:usage:reset_at';

export const usageService = {
  async isWithinLimit(): Promise<boolean> {
    await this.checkAndResetMonthly();
    const count = await redis.get<number>(USAGE_KEY) || 0;
    return count < config.MAX_MONTHLY_CONVERSATIONS;
  },

  async increment(): Promise<void> {
    await redis.incr(USAGE_KEY);
  },

  async getUsage(): Promise<{ count: number; limit: number; resetAt: string }> {
    const count = await redis.get<number>(USAGE_KEY) || 0;
    const resetAt = await redis.get<string>(USAGE_RESET_KEY) || new Date().toISOString();
    return {
      count,
      limit: config.MAX_MONTHLY_CONVERSATIONS,
      resetAt,
    };
  },

  async checkAndResetMonthly(): Promise<void> {
    const resetAt = await redis.get<string>(USAGE_RESET_KEY);
    if (!resetAt || new Date(resetAt) < new Date()) {
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      nextReset.setDate(1);
      nextReset.setHours(0, 0, 0, 0);

      await redis.set(USAGE_KEY, 0);
      await redis.set(USAGE_RESET_KEY, nextReset.toISOString());
    }
  },
};
