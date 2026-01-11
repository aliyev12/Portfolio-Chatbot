import OpenAI from 'openai';
import { config } from '../config';
import { SYSTEM_PROMPT } from '../config/prompt';
import type { ChatMessage } from '@portfolio-chatbot/shared';

/**
 * AI Service
 *
 * Handles interactions with OpenAI API.
 * Supports streaming responses for real-time user experience.
 */

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export const aiService = {
  /**
   * Generate a streaming chat response
   *
   * @param messages - Conversation history including the new user message
   * @returns An async generator yielding text chunks
   */
  async *chat(messages: ChatMessage[]) {
    // Inject system prompt as the first message
    const messagesWithSystem = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      max_tokens: 500, // Limit response length to control costs
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  },
};
