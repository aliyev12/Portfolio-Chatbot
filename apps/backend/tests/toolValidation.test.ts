import { describe, test, expect } from 'bun:test';
import { validateToolCall } from '../src/utils/toolValidation';
import type { ToolCall } from '@portfolio-chatbot/shared';

describe('validateToolCall', () => {
  describe('contact_me tool', () => {
    test('should validate correct contact_me parameters', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: 'I want to discuss a job opportunity',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized?.arguments.reason).toBe('I want to discuss a job opportunity');
    });

    test('should reject contact_me with missing reason', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid contact_me parameters');
    });

    test('should reject contact_me with empty reason', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: '   ',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('should reject contact_me with reason too long', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: 'a'.repeat(501),
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should sanitize contact_me reason', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: '  I want to <script>alert("XSS")</script> discuss something  ',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.arguments.reason).toBe('I want to discuss something');
    });
  });

  describe('visit_linkedin tool', () => {
    test('should validate correct visit_linkedin parameters', () => {
      const toolCall: ToolCall = {
        id: 'call_456',
        name: 'visit_linkedin',
        arguments: {
          intent: 'View professional experience',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized?.arguments.intent).toBe('View professional experience');
    });

    test('should reject visit_linkedin with missing intent', () => {
      const toolCall: ToolCall = {
        id: 'call_456',
        name: 'visit_linkedin',
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid visit_linkedin parameters');
    });

    test('should reject visit_linkedin with empty intent', () => {
      const toolCall: ToolCall = {
        id: 'call_456',
        name: 'visit_linkedin',
        arguments: {
          intent: '',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Intent is required');
    });

    test('should sanitize visit_linkedin intent', () => {
      const toolCall: ToolCall = {
        id: 'call_456',
        name: 'visit_linkedin',
        arguments: {
          intent: '  Connect   on    LinkedIn  ',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.arguments.intent).toBe('Connect on LinkedIn');
    });
  });

  describe('download_resume tool', () => {
    test('should validate correct download_resume parameters', () => {
      const toolCall: ToolCall = {
        id: 'call_789',
        name: 'download_resume',
        arguments: {
          format: 'pdf',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized?.arguments.format).toBe('pdf');
    });

    test('should accept download_resume with no arguments (format is optional)', () => {
      const toolCall: ToolCall = {
        id: 'call_789',
        name: 'download_resume',
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.arguments.format).toBe('pdf'); // Default value
    });

    test('should reject download_resume with invalid format', () => {
      const toolCall: ToolCall = {
        id: 'call_789',
        name: 'download_resume',
        arguments: {
          format: 'docx',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('invalid tool names', () => {
    test('should reject unknown tool names', () => {
      const toolCall: ToolCall = {
        id: 'call_999',
        name: 'unknown_tool' as any,
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid tool name');
    });
  });

  describe('sanitization across all tools', () => {
    test('should remove control characters from all string parameters', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: 'Test\x00\x01\x02message',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.arguments.reason).toBe('Testmessage');
    });

    test('should strip HTML tags from all string parameters', () => {
      const toolCall: ToolCall = {
        id: 'call_456',
        name: 'visit_linkedin',
        arguments: {
          intent: '<b>Connect</b> with <i>me</i>',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.arguments.intent).toBe('Connect with me');
    });

    test('should normalize whitespace in all string parameters', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: 'Multiple    spaces   and\n\nnewlines',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.arguments.reason).toBe('Multiple spaces and newlines');
    });
  });

  describe('edge cases', () => {
    test('should handle nested objects in arguments', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        name: 'contact_me',
        arguments: {
          reason: 'Job inquiry',
          metadata: {
            source: '<script>test</script>',
          },
        },
      };

      const result = validateToolCall(toolCall);
      // Should still validate, but additional fields are ignored by schema
      expect(result.isValid).toBe(true);
    });

    test('should preserve valid tool call ID', () => {
      const toolCall: ToolCall = {
        id: 'call_abc123',
        name: 'contact_me',
        arguments: {
          reason: 'Test',
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.id).toBe('call_abc123');
    });
  });
});
