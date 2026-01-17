import OpenAI from 'openai';
import { config } from '../config';
import { SYSTEM_PROMPT } from '../config/prompt';
import type { ChatMessage, ToolCall } from '@portfolio-chatbot/shared';

/**
 * AI Service
 *
 * Handles interactions with OpenAI API.
 * Supports streaming responses for real-time user experience.
 * Includes tool calling for contact_me and visit_linkedin intents.
 */

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// Define available tools
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'contact_me',
      description: 'Triggers a contact form button when the user expresses intent to contact the portfolio owner, ask questions, request collaboration, or get in touch.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'The reason why the user wants to make contact',
          },
        },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'visit_linkedin',
      description: 'Triggers a LinkedIn profile button when the user expresses intent to view the LinkedIn profile, connect on LinkedIn, or learn more about professional background.',
      parameters: {
        type: 'object',
        properties: {
          intent: {
            type: 'string',
            description: 'The user\'s intent for visiting LinkedIn',
          },
        },
        required: ['intent'],
      },
    },
  },
];

export interface ChatStreamChunk {
  type: 'content' | 'tool_call';
  content?: string;
  toolCall?: ToolCall;
}

export const aiService = {
  /**
   * Generate a streaming chat response with tool support
   *
   * @param messages - Conversation history including the new user message
   * @param sessionId - Session ID for OpenAI tracking
   * @returns An async generator yielding text chunks and tool calls
   */
  async *chat(messages: ChatMessage[], sessionId?: string): AsyncGenerator<ChatStreamChunk> {
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
      tools: TOOLS,
      tool_choice: 'auto',
      stream: true,
      // Use 'user' parameter for OpenAI dashboard tracking (shows as "End User" in dashboard)
      user: sessionId,
    });

    // Track tool calls across chunks
    const toolCalls: Map<number, Partial<ToolCall & { function: { name: string; arguments: string } }>> = new Map();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle text content
      if (delta?.content) {
        yield { type: 'content', content: delta.content };
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const index = toolCall.index;

          if (!toolCalls.has(index)) {
            toolCalls.set(index, {
              id: toolCall.id || '',
              function: { name: '', arguments: '' },
            });
          }

          const existing = toolCalls.get(index)!;

          if (toolCall.id) {
            existing.id = toolCall.id;
          }

          if (toolCall.function?.name) {
            existing.function!.name = toolCall.function.name;
          }

          if (toolCall.function?.arguments) {
            existing.function!.arguments += toolCall.function.arguments;
          }
        }
      }
    }

    // Emit completed tool calls
    for (const toolCall of toolCalls.values()) {
      if (toolCall.id && toolCall.function?.name) {
        const parsedArgs = toolCall.function.arguments
          ? JSON.parse(toolCall.function.arguments)
          : {};

        yield {
          type: 'tool_call',
          toolCall: {
            id: toolCall.id,
            name: toolCall.function.name as 'contact_me' | 'visit_linkedin',
            arguments: parsedArgs,
          },
        };
      }
    }
  },
};
