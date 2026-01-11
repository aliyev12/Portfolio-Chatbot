import { describe, test, expect } from 'bun:test';
import { usageService } from '../src/services/usage';

describe('Usage Service', () => {
  describe('Service exports', () => {
    test('usageService is exported and has required methods', () => {
      expect(usageService).toBeDefined();
      expect(typeof usageService.isWithinLimit).toBe('function');
      expect(typeof usageService.increment).toBe('function');
      expect(typeof usageService.getUsage).toBe('function');
      expect(typeof usageService.checkAndResetMonthly).toBe('function');
    });
  });

  describe('Service structure', () => {
    test('isWithinLimit is an async function', async () => {
      const result = usageService.isWithinLimit();
      expect(result instanceof Promise).toBe(true);
    });

    test('increment is an async function', () => {
      const result = usageService.increment();
      expect(result instanceof Promise).toBe(true);
    });

    test('getUsage returns promise with proper structure', async () => {
      const result = usageService.getUsage();
      expect(result instanceof Promise).toBe(true);
      const usage = await result;
      expect(typeof usage.count).toBe('number');
      expect(typeof usage.limit).toBe('number');
      expect(typeof usage.resetAt).toBe('string');
    });

    test('checkAndResetMonthly is an async function', () => {
      const result = usageService.checkAndResetMonthly();
      expect(result instanceof Promise).toBe(true);
    });
  });

  describe('Configuration validation', () => {
    test('max monthly conversations is properly configured', async () => {
      const usage = await usageService.getUsage();
      expect(usage.limit).toBeGreaterThan(0);
    });
  });
});
