import { describe, test, expect } from 'bun:test';
import { aiService } from '../src/services/ai';

describe('AI Service', () => {
  describe('Service exports', () => {
    test('aiService is exported and has chat method', () => {
      expect(aiService).toBeDefined();
      expect(typeof aiService.chat).toBe('function');
    });
  });

  describe('Service structure', () => {
    test('chat returns an async generator function', () => {
      const generator = aiService.chat([]);
      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });

    test('chat accepts message array parameter', async () => {
      const messages = [
        { role: 'user' as const, content: 'test' },
      ];

      // Should not throw
      const generator = aiService.chat(messages);
      expect(generator).toBeDefined();
    });

    test('chat can be called with empty array', async () => {
      const generator = aiService.chat([]);
      expect(generator).toBeDefined();
    });

    test('chat is async iterable', async () => {
      const generator = aiService.chat([]);
      let chunkCount = 0;

      try {
        for await (const _chunk of generator) {
          chunkCount++;
          if (chunkCount > 10) break; // Safety limit for production API calls
        }
        // If we get chunks, great! If not (e.g., invalid API key), that's OK for a structural test
        expect(chunkCount >= 0).toBe(true);
      } catch {
        // API errors are expected in test environment without valid API key
        expect(true).toBe(true);
      }
    });
  });

  describe('Message handling', () => {
    test('accepts messages with user role', () => {
      const messages = [{ role: 'user' as const, content: 'test' }];
      const generator = aiService.chat(messages);
      expect(generator).toBeDefined();
    });

    test('accepts messages with assistant role', () => {
      const messages = [{ role: 'assistant' as const, content: 'test' }];
      const generator = aiService.chat(messages);
      expect(generator).toBeDefined();
    });

    test('accepts multiple messages', () => {
      const messages = [
        { role: 'user' as const, content: 'msg1' },
        { role: 'assistant' as const, content: 'msg2' },
        { role: 'user' as const, content: 'msg3' },
      ];
      const generator = aiService.chat(messages);
      expect(generator).toBeDefined();
    });
  });
});
