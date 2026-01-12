import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChatStatus } from '../src/hooks/useChatStatus';

describe('useChatStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    test('starts with isAvailable false', () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      expect(result.current.isAvailable).toBe(false);
    });

    test('starts with isLoading true', () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      expect(result.current.isLoading).toBe(true);
    });

    test('starts with no error', () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      expect(result.current.error).toBeNull();
    });
  });

  describe('On Mount', () => {
    test('fetches from /api/status endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://test.api/api/status');
      });
    });

    test('parses response.available property', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });
    });

    test('sets isLoading to false after fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('handles available true', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });
    });

    test('handles available false', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: false }),
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('sets error on fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    test('sets isAvailable to false on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });
    });

    test('sets isLoading to false on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('handles non-JSON response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useChatStatus('http://test.api'));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Dependencies', () => {
    test('refetches when apiUrl changes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

      const { rerender } = renderHook(
        ({ apiUrl }: { apiUrl: string }) => useChatStatus(apiUrl),
        {
          initialProps: { apiUrl: 'http://test1.api' },
        },
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://test1.api/api/status');
      });

      rerender({ apiUrl: 'http://test2.api' });

      await waitFor(() => {
        const calls = (global.fetch as any).mock.calls as Array<Array<unknown>>;
        expect(calls.some((call: Array<unknown>) => call[0] === 'http://test2.api/api/status')).toBe(true);
      });
    });
  });
});
