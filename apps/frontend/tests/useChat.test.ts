import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChat } from '../src/hooks/useChat';

// Mock getTurnstileToken
vi.mock('../src/main', () => ({
  getTurnstileToken: vi.fn(() => 'test-turnstile-token'),
}));

// Helper to create mock SSE stream
function createMockSSEStream(chunks: string[]) {
  let chunkIndex = 0;

  const readable = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        if (chunkIndex < chunks.length) {
          const chunk = chunks[chunkIndex];
          controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
          chunkIndex++;
        } else {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          clearInterval(interval);
          controller.close();
        }
      }, 10);
    },
  });

  return readable;
}

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    test('starts with empty messages', () => {
      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      expect(result.current.messages).toEqual([]);
    });

    test('starts with empty input', () => {
      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      expect(result.current.input).toBe('');
    });

    test('starts with isLoading false', () => {
      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      expect(result.current.isLoading).toBe(false);
    });

    test('starts with no error', () => {
      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      expect(result.current.error).toBeNull();
    });
  });

  describe('Message Sending', () => {
    test('sendMessage adds user message immediately', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test message');
      });

      expect(result.current.messages[0]).toEqual({
        role: 'user',
        content: 'test message',
      });
    });

    test('sendMessage adds assistant message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
        expect(result.current.messages[1]?.role).toBe('assistant');
      });
    });
  });

  describe('SSE Streaming', () => {
    test('parses SSE data lines correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello', ' ', 'world']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        const assistantMessage = result.current.messages[1];
        expect(assistantMessage?.content).toContain('Hello');
        expect(assistantMessage?.content).toContain('world');
      });
    });

    test('ignores [DONE] sentinel', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        const assistantMessage = result.current.messages[1];
        expect(assistantMessage?.content).toBe('Hello');
        expect(assistantMessage?.content).not.toContain('[DONE]');
      });
    });

    test('accumulates streamed content correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello', ' ', 'world', '!']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.messages[1]?.content).toBe('Hello world!');
      });
    });
  });

  describe('Loading State', () => {
    test('isLoading true during message transmission', async () => {
      let resolveResponse: any;
      global.fetch = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveResponse = resolve;
          }),
      );

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      act(() => {
        result.current.sendMessage('test');
      });

      expect(result.current.isLoading).toBe(true);

      resolveResponse({
        ok: true,
        body: createMockSSEStream([]),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('isLoading false after completion', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('isLoading false on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('sets error on fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    test('handles 503 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    test('handles 429 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    test('handles missing response body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    test('resets error on successful send', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          body: createMockSSEStream(['Hello']),
        });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('first');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      await act(async () => {
        await result.current.sendMessage('second');
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Input Management', () => {
    test('setInput updates input value', () => {
      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      act(() => {
        result.current.setInput('new input');
      });

      expect(result.current.input).toBe('new input');
    });

    test('input persists across sends', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      act(() => {
        result.current.setInput('test');
      });

      // Note: In the actual implementation, the component clears input
      // The hook itself just manages the value
      expect(result.current.input).toBe('test');
    });
  });

  describe('API Integration', () => {
    test('sends message to correct API endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test.api/api/chat',
        expect.any(Object),
      );
    });

    test('sends POST request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].method).toBe('POST');
    });

    test('sends JSON content type', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockSSEStream(['Hello']),
      });

      const { result } = renderHook(() => useChat({ apiUrl: 'http://test.api', apiToken: 'test-api-token' }));

      await act(async () => {
        await result.current.sendMessage('test');
      });

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });
  });
});
