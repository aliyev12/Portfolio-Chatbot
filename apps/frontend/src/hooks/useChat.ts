import { useState, useCallback } from 'react';
import type { Message } from '../types';

interface UseChatParams {
  apiUrl: string;
  apiToken: string;
  turnstileToken: string;
}

interface UseChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChat({ apiUrl, apiToken, turnstileToken }: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Token': apiToken,
            'X-Turnstile-Token': turnstileToken,
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          if (response.status === 503 || response.status === 429) {
            throw new Error('Chatbot is currently unavailable. Please try again later.');
          }
          throw new Error('Failed to send message');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let assistantContent = '';

        // Add empty assistant message that will be updated
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              assistantContent += data;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Remove the empty assistant message if there was an error
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.content !== '');
          return filtered;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, apiToken, turnstileToken]
  );

  return { messages, input, setInput, sendMessage, isLoading, error };
}
