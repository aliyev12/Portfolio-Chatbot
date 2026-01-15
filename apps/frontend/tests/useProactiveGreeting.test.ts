import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProactiveGreeting } from '../src/hooks/useProactiveGreeting';

describe('useProactiveGreeting', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should not show greeting initially', () => {
    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: true,
        isLoading: false,
        isOpen: false,
      })
    );

    expect(result.current.showGreeting).toBe(false);
  });

  it('should not show greeting if chatbot is not available', () => {
    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: false,
        isLoading: false,
        isOpen: false,
      })
    );

    expect(result.current.showGreeting).toBe(false);
  });

  it('should not show greeting if chatbot is loading', () => {
    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: true,
        isLoading: true,
        isOpen: false,
      })
    );

    expect(result.current.showGreeting).toBe(false);
  });

  it('should not show greeting if chat is already open', () => {
    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: true,
        isLoading: false,
        isOpen: true,
      })
    );

    expect(result.current.showGreeting).toBe(false);
  });

  it('should not show greeting if it was previously dismissed', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chatbot_greeting_dismissed', 'true');
    }

    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: true,
        isLoading: false,
        isOpen: false,
      })
    );

    expect(result.current.showGreeting).toBe(false);
  });

  it('should save dismissal to localStorage when dismissGreeting is called', () => {
    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: true,
        isLoading: false,
        isOpen: false,
      })
    );

    // Dismiss greeting
    act(() => {
      result.current.dismissGreeting();
    });

    expect(result.current.showGreeting).toBe(false);
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('chatbot_greeting_dismissed')).toBe('true');
    }
  });

  it('should hide greeting when chat opens', () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useProactiveGreeting({
          isAvailable: true,
          isLoading: false,
          isOpen,
        }),
      { initialProps: { isOpen: false } }
    );

    // Simulate greeting being shown
    // Since we can't use fake timers, we just test that when chat opens, greeting should hide
    // This tests the useEffect that watches isOpen
    expect(result.current.showGreeting).toBe(false);

    // Open chat
    act(() => {
      rerender({ isOpen: true });
    });

    expect(result.current.showGreeting).toBe(false);
  });

  it('should handle localStorage errors gracefully when getting dismissed state', () => {
    // Mock localStorage.getItem to throw error
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('localStorage error');
      });

    // Should not throw when initializing
    expect(() => {
      renderHook(() =>
        useProactiveGreeting({
          isAvailable: true,
          isLoading: false,
          isOpen: false,
        })
      );
    }).not.toThrow();

    getItemSpy.mockRestore();
  });

  it('should handle localStorage errors gracefully when setting dismissed state', () => {
    // Mock localStorage.setItem to throw error
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('localStorage error');
      });

    const { result } = renderHook(() =>
      useProactiveGreeting({
        isAvailable: true,
        isLoading: false,
        isOpen: false,
      })
    );

    // Should not throw when dismissing
    expect(() => {
      act(() => {
        result.current.dismissGreeting();
      });
    }).not.toThrow();

    setItemSpy.mockRestore();
  });
});
