import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { aiService } from '../services/ai';
import { usageService } from '../services/usage';
import { cacheService } from '../services/cache';
import type { ChatMessage } from '@portfolio-chatbot/shared';

export const chatRoutes = new Hono();

// Zod schema for request validation
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
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
          details: validation.error.errors,
        },
        400
      );
    }

    const { message } = validation.data;

    // Check cache first
    const cachedResponse = await cacheService.get(message);

    if (cachedResponse) {
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
          await new Promise(resolve => setTimeout(resolve, 20));
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
        429
      );
    }

    // Stream response from AI
    return streamSSE(c, async (stream) => {
      let fullResponse = '';

      try {
        // Create a simple message array (stateless - only current message)
        const messages: ChatMessage[] = [
          { role: 'user', content: message },
        ];

        const aiStream = await aiService.chat(messages);

        // Stream chunks to client and collect full response
        for await (const chunk of aiStream) {
          fullResponse += chunk;
          await stream.writeSSE({
            data: chunk,
            event: 'message',
          });
        }

        // Cache the complete response
        await cacheService.set(message, fullResponse);

        // Increment usage counter
        await usageService.increment();

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
      500
    );
  }
});
