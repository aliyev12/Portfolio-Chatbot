import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { aiService } from '../services/ai';
import { usageService } from '../services/usage';
import { cacheService } from '../services/cache';
import { sessionService } from '../services/session';
import { apiTokenMiddleware } from '../middleware/apiToken';
import { turnstileMiddleware } from '../middleware/turnstile';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import type { ChatMessage } from '@portfolio-chatbot/shared';

export const chatRoutes = new Hono();

// Apply security middleware to all chat routes
chatRoutes.use('*', rateLimitMiddleware);
chatRoutes.use('*', apiTokenMiddleware);
chatRoutes.use('*', turnstileMiddleware);

// Zod schema for request validation
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  sessionId: z.string().optional(),
});

/**
 * POST /api/chat
 *
 * Main chat endpoint with Server-Sent Events (SSE) streaming.
 *
 * Flow:
 * 1. Validate request body
 * 2. Normalize the question
 * 3. Check Redis cache
 * 4. If cached: stream cached response
 * 5. If not cached:
 *    a. Check usage limit
 *    b. If under limit: call AI, stream response, cache it, increment usage
 *    c. If over limit: return 429
 */
chatRoutes.post('/', async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        400,
      );
    }

    const { message, sessionId } = validation.data;

    // Check session limit if sessionId is provided
    if (sessionId) {
      const hasExceeded = await sessionService.hasExceededLimit(sessionId);
      if (hasExceeded) {
        return streamSSE(c, async (stream) => {
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'limit_reached',
              message:
                "We've reached the conversation limit for this session. If you'd like to continue our discussion or have any questions, feel free to reach out!",
            }),
            event: 'session_limit',
          });

          await stream.writeSSE({
            data: '[DONE]',
            event: 'done',
          });
        });
      }
    }

    // Check cache first
    const cachedResponse = await cacheService.get(message);

    if (cachedResponse) {
      // Increment session message count even for cached responses
      if (sessionId) {
        await sessionService.incrementMessageCount(sessionId);
      }

      // Stream cached response
      return streamSSE(c, async (stream) => {
        // Split cached response into chunks for a more natural streaming effect
        const words = cachedResponse.split(' ');
        for (const word of words) {
          await stream.writeSSE({
            data: word + ' ',
            event: 'message',
          });
          // Small delay to simulate streaming (optional)
          await new Promise((resolve) => setTimeout(resolve, 20));
        }

        await stream.writeSSE({
          data: '[DONE]',
          event: 'done',
        });
      });
    }

    // Check usage limit
    const isWithinLimit = await usageService.isWithinLimit();

    if (!isWithinLimit) {
      return c.json(
        {
          error: 'Chatbot is currently unavailable due to usage limits',
          code: 'LIMIT_EXCEEDED',
        },
        429,
      );
    }

    // Stream response from AI
    return streamSSE(c, async (stream) => {
      let fullResponse = '';

      try {
        // Create a simple message array (stateless - only current message)
        const messages: ChatMessage[] = [{ role: 'user', content: message }];

        const aiStream = aiService.chat(messages, sessionId);

        // Stream chunks to client and collect full response
        for await (const chunk of aiStream) {
          if (chunk.type === 'content' && chunk.content) {
            fullResponse += chunk.content;
            await stream.writeSSE({
              data: chunk.content,
              event: 'message',
            });
          } else if (chunk.type === 'tool_call' && chunk.toolCall) {
            // Send tool call to frontend
            await stream.writeSSE({
              data: JSON.stringify(chunk.toolCall),
              event: 'tool_call',
            });
          }
        }

        // Cache the complete response (only text content, not tool calls)
        if (fullResponse) {
          await cacheService.set(message, fullResponse);
        }

        // Increment usage counter
        await usageService.increment();

        // Increment session message count
        if (sessionId) {
          await sessionService.incrementMessageCount(sessionId);
        }

        // Send done event
        await stream.writeSSE({
          data: '[DONE]',
          event: 'done',
        });
      } catch (error) {
        console.error('Error in chat stream:', error);
        await stream.writeSSE({
          data: JSON.stringify({
            error: 'An error occurred while processing your request',
          }),
          event: 'error',
        });
      }
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return c.json(
      {
        error: 'Internal server error',
      },
      500,
    );
  }
});
