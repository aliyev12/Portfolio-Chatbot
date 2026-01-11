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
