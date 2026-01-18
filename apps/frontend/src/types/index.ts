export interface ToolCall {
  id: string;
  name: 'contact_me' | 'visit_linkedin' | 'download_resume';
  arguments: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCall?: ToolCall;
  isSessionLimit?: boolean;
}

export interface AppConfig {
  apiUrl: string;
  contactUrl: string;
  apiToken: string;
  turnstileSiteKey: string;
}
