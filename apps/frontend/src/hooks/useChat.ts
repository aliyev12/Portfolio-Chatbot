import { useState, useCallback, useRef } from 'react';
import type { Message, ToolCall } from '../types';
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

/**
 * Generate a simple session ID using current timestamp and random values
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create session ID from localStorage
 */
function getOrCreateSessionId(): string {
  const storageKey = 'portfolio_chatbot_session_id';
  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

export function useChat({ apiUrl, apiToken }: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

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
            body: JSON.stringify({ message: content, sessionId: sessionIdRef.current }),
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
          let currentToolCall: ToolCall | undefined;
          let isSessionLimit = false;

          // Add empty assistant message that will be updated
          setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                const eventType = line.slice(7).trim();

                // Find the data line that follows
                const dataLineIndex = lines.indexOf(line) + 1;
                if (dataLineIndex < lines.length) {
                  const dataLine = lines[dataLineIndex];
                  if (dataLine && dataLine.startsWith('data: ')) {
                    const data = dataLine.slice(6);

                    if (eventType === 'tool_call') {
                      try {
                        currentToolCall = JSON.parse(data) as ToolCall;
                      } catch (e) {
                        console.error('Failed to parse tool call:', e);
                      }
                    } else if (eventType === 'session_limit') {
                      try {
                        const limitData = JSON.parse(data);
                        assistantContent = limitData.message || assistantContent;
                        isSessionLimit = true;
                      } catch (e) {
                        console.error('Failed to parse session limit:', e);
                      }
                    }
                  }
                }
              } else if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                // Only accumulate content if not a JSON object (regular message event)
                if (!data.startsWith('{')) {
                  assistantContent += data;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      content: assistantContent,
                      toolCall: currentToolCall,
                      isSessionLimit,
                    };
                    return updated;
                  });
                }
              }
            }
          }

          // Final update with complete message
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: assistantContent,
              toolCall: currentToolCall,
              isSessionLimit,
            };
            return updated;
          });

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
