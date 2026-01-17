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

/**
 * Get default message when AI calls a tool without providing text content
 */
function getDefaultToolMessage(toolCall?: ToolCall): string {
  if (!toolCall) return '';

  if (toolCall.name === 'contact_me') {
    return "I'd be happy to help you get in touch! Click the button below to contact Abdul.";
  } else if (toolCall.name === 'visit_linkedin') {
    return "You can view Abdul's professional profile on LinkedIn. Click the button below to visit.";
  }

  return '';
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

            // Parse SSE events more robustly by tracking current event type
            let currentEvent = 'message';
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (!line) continue;

              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  continue;
                }

                // Handle different event types
                if (currentEvent === 'tool_call') {
                  try {
                    currentToolCall = JSON.parse(data) as ToolCall;
                  } catch (e) {
                    console.error('Failed to parse tool call:', e);
                  }
                } else if (currentEvent === 'session_limit') {
                  try {
                    const limitData = JSON.parse(data);
                    assistantContent = limitData.message || assistantContent;
                    isSessionLimit = true;
                  } catch (e) {
                    console.error('Failed to parse session limit:', e);
                  }
                } else if (currentEvent === 'message') {
                  // Regular message content - only accumulate if not JSON
                  if (!data.startsWith('{')) {
                    assistantContent += data;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const messageContent = assistantContent || getDefaultToolMessage(currentToolCall);
                      updated[updated.length - 1] = {
                        role: 'assistant',
                        content: messageContent,
                        toolCall: currentToolCall,
                        isSessionLimit,
                      };
                      return updated;
                    });
                  }
                }
              }
            }
          }

          // Final update with complete message
          setMessages((prev) => {
            const updated = [...prev];
            const finalContent = assistantContent || getDefaultToolMessage(currentToolCall);
            updated[updated.length - 1] = {
              role: 'assistant',
              content: finalContent,
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
