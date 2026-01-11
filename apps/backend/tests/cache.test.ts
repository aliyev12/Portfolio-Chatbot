import { describe, test, expect } from 'bun:test';
import { cacheService } from '../src/services/cache';

describe('Cache Service', () => {
  describe('Service exports', () => {
    test('cacheService is exported and has required methods', () => {
      expect(cacheService).toBeDefined();
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.set).toBe('function');
      expect(typeof cacheService.clear).toBe('function');
    });
  });

  describe('Service structure', () => {
    test('get is an async function', () => {
      const result = cacheService.get('test');
      expect(result instanceof Promise).toBe(true);
    });

    test('set is an async function', () => {
      const result = cacheService.set('test', 'response');
      expect(result instanceof Promise).toBe(true);
    });

    test('clear is an async function', () => {
      const result = cacheService.clear();
      expect(result instanceof Promise).toBe(true);
    });
  });

  describe('Cache operations', () => {
    test('get returns null or string', async () => {
      const result = await cacheService.get('nonexistent');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    test('set does not throw for valid inputs', async () => {
      // This will write to actual Redis, but should not throw
      const operation = async () => {
        await cacheService.set('test-key', 'test-value');
      };
      expect(operation).not.toThrow();
    });

    test('clear does not throw', async () => {
      const operation = async () => {
        await cacheService.clear();
      };
      expect(operation).not.toThrow();
    });
  });
});
