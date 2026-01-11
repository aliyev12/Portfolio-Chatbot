export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AppConfig {
  apiUrl: string;
  contactUrl: string;
}
