/**
 * Shared types for Portfolio Chatbot
 * Used by both frontend and backend
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: ToolCall[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

export interface ToolCall {
  id: string;
  name: 'contact_me' | 'visit_linkedin' | 'download_resume';
  arguments: Record<string, unknown>;
}

export interface SessionInfo {
  sessionId: string;
  messageCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ChatStatusResponse {
  available: boolean;
}

export interface UsageResponse {
  count: number;
  limit: number;
  resetAt: string;
}

export interface SessionMetadata {
  sessionId: string;
  createdAt: number; // Unix timestamp
  messageCount: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

export type SessionErrorCode =
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_TOO_OLD';
