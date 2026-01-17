import { redis } from './redis';
import type { SessionInfo } from '@portfolio-chatbot/shared';

const SESSION_KEY_PREFIX = 'chatbot:session:';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
const MAX_MESSAGES_PER_SESSION = 30;

export const sessionService = {
  /**
   * Get session information from Redis
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    const key = `${SESSION_KEY_PREFIX}${sessionId}`;
    const session = await redis.get<SessionInfo>(key);
    return session;
  },

  /**
   * Create a new session
   */
  async createSession(sessionId: string): Promise<SessionInfo> {
    const now = new Date().toISOString();
    const session: SessionInfo = {
      sessionId,
      messageCount: 0,
      createdAt: now,
      lastActivityAt: now,
    };

    const key = `${SESSION_KEY_PREFIX}${sessionId}`;
    await redis.set(key, session, { ex: SESSION_TTL });
    return session;
  },

  /**
   * Increment message count for a session
   */
  async incrementMessageCount(sessionId: string): Promise<number> {
    let session = await this.getSession(sessionId);

    if (!session) {
      session = await this.createSession(sessionId);
    }

    session.messageCount += 1;
    session.lastActivityAt = new Date().toISOString();

    const key = `${SESSION_KEY_PREFIX}${sessionId}`;
    await redis.set(key, session, { ex: SESSION_TTL });

    return session.messageCount;
  },

  /**
   * Check if session has exceeded message limit
   */
  async hasExceededLimit(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }
    return session.messageCount >= MAX_MESSAGES_PER_SESSION;
  },

  /**
   * Get remaining messages for a session
   */
  async getRemainingMessages(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return MAX_MESSAGES_PER_SESSION;
    }
    return Math.max(0, MAX_MESSAGES_PER_SESSION - session.messageCount);
  },
};
