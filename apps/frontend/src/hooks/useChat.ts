import { useState, useCallback } from 'react';
import type { Message } from '../types';
import { waitForTurnstileToken, resetTurnstile } from '../main';

interface UseChatParams {
  apiUrl: string;
  apiToken: string;
}

interface UseChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useChat({ apiUrl, apiToken }: UseChatParams): UseChatReturn {
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

      // Helper function to attempt sending message with retry logic
      const attemptSend = async (isRetry = false): Promise<void> => {
        try {
          // Wait for fresh Turnstile token to be ready
          const turnstileToken = await waitForTurnstileToken();

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
            // Handle Turnstile verification failures with retry
            if ((response.status === 401 || response.status === 403) && !isRetry) {
              console.warn('Turnstile verification failed, resetting and retrying...');
              // Reset Turnstile to get a fresh token
              resetTurnstile();
              // Wait a bit for new token to be generated
              await new Promise(resolve => setTimeout(resolve, 500));
              // Retry once with fresh token
              return attemptSend(true);
            }

            if (response.status === 503 || response.status === 429) {
              throw new Error('Chatbot is currently unavailable. Please try again later.');
            }

            // Try to parse error details
            try {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to send message');
            } catch {
              throw new Error('Failed to send message');
            }
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

          // SUCCESS: Reset Turnstile to prepare for next message
          resetTurnstile();
        } catch (err) {
          throw err; // Re-throw to outer catch
        }
      };

      try {
        await attemptSend(false);
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
    [apiUrl, apiToken]
  );

  return { messages, input, setInput, sendMessage, isLoading, error };
}
