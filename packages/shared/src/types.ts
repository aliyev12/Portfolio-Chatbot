/**
 * Shared types for Portfolio Chatbot
 * Used by both frontend and backend
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

export interface ToolCall {
  id: string;
  name: 'contact_me' | 'visit_linkedin';
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

export interface ErrorResponse {
  error: string;
  code?: string;
}
