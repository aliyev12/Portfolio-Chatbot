import { redis } from './redis';
import type { SessionInfo } from '@portfolio-chatbot/shared';

const SESSION_KEY_PREFIX = 'chatbot:session:';
const SESSION_TTL = 60 * 20; // 20 minutes in seconds
const MAX_MESSAGES_PER_SESSION = 30;
const MAX_SESSION_AGE_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

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

  /**
   * Check if session is expired (older than 20 minutes)
   */
  async isSessionExpired(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return true; // Session not found = expired
    }

    const createdAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    const age = now - createdAt;

    return age > MAX_SESSION_AGE_MS;
  },

  /**
   * Get session age in milliseconds
   */
  async getSessionAge(sessionId: string): Promise<number | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const createdAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    return now - createdAt;
  },

  /**
   * Validate session is not expired (if it exists)
   * Allows new sessions to be created on first message
   * Throws error only if session exists but is expired
   */
  async validateSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    // If session doesn't exist yet, that's OK - it will be created on first use
    if (!session) {
      return;
    }

    // If session exists, check if it's expired
    const createdAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    const age = now - createdAt;

    if (age > MAX_SESSION_AGE_MS) {
      throw new Error('SESSION_EXPIRED');
    }
  },
};
