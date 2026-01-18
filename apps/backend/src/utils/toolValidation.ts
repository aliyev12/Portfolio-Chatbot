/**
 * Tool Call Validation Utilities
 *
 * Validates and sanitizes tool call parameters from OpenAI responses
 * to prevent injection attacks and ensure data integrity.
 */

import { z } from 'zod';
import type { ToolCall } from '@portfolio-chatbot/shared';

// Zod schemas for tool parameters
const ContactMeParamsSchema = z.object({
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason too long')
    .refine((val) => val.trim().length > 0, 'Reason cannot be empty'),
});

const VisitLinkedInParamsSchema = z.object({
  intent: z
    .string()
    .min(1, 'Intent is required')
    .max(500, 'Intent too long')
    .refine((val) => val.trim().length > 0, 'Intent cannot be empty'),
});

const DownloadResumeParamsSchema = z.object({
  format: z.enum(['pdf']).optional().default('pdf'),
});

/**
 * Sanitize tool call parameter string values
 */
function sanitizeParamValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove null bytes
    let sanitized = value.replace(/\u0000/g, '').replace(/\x00/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Remove script tags first
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove HTML tags (improved regex)
    sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeParamValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Validate and sanitize tool call parameters
 */
export function validateToolCall(
  toolCall: ToolCall,
): { isValid: boolean; sanitized?: ToolCall; error?: string } {
  // Validate tool name
  const validToolNames: Array<ToolCall['name']> = [
    'contact_me',
    'visit_linkedin',
    'download_resume',
  ];

  if (!validToolNames.includes(toolCall.name)) {
    return {
      isValid: false,
      error: `Invalid tool name: ${toolCall.name}`,
    };
  }

  // Sanitize arguments first
  const sanitizedArgs = sanitizeParamValue(toolCall.arguments) as Record<string, unknown>;

  // Validate based on tool name
  try {
    let validatedArgs: Record<string, unknown>;

    switch (toolCall.name) {
      case 'contact_me': {
        const result = ContactMeParamsSchema.safeParse(sanitizedArgs);
        if (!result.success) {
          return {
            isValid: false,
            error: `Invalid contact_me parameters: ${result.error.issues.map((i) => i.message).join(', ')}`,
          };
        }
        validatedArgs = result.data;
        break;
      }

      case 'visit_linkedin': {
        const result = VisitLinkedInParamsSchema.safeParse(sanitizedArgs);
        if (!result.success) {
          return {
            isValid: false,
            error: `Invalid visit_linkedin parameters: ${result.error.issues.map((i) => i.message).join(', ')}`,
          };
        }
        validatedArgs = result.data;
        break;
      }

      case 'download_resume': {
        const result = DownloadResumeParamsSchema.safeParse(sanitizedArgs);
        if (!result.success) {
          return {
            isValid: false,
            error: `Invalid download_resume parameters: ${result.error.issues.map((i) => i.message).join(', ')}`,
          };
        }
        validatedArgs = result.data;
        break;
      }

      default:
        return {
          isValid: false,
          error: 'Unknown tool',
        };
    }

    // Return sanitized and validated tool call
    return {
      isValid: true,
      sanitized: {
        ...toolCall,
        arguments: validatedArgs,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Tool validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
