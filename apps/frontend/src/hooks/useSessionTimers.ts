import { useEffect, useRef } from 'react';

const INACTIVITY_WARNING_MS = 3 * 60 * 1000; // 3 minutes
const INACTIVITY_CLOSE_MS = 5 * 60 * 1000; // 5 minutes
const ABSOLUTE_SESSION_MS = 20 * 60 * 1000; // 20 minutes

interface UseSessionTimersParams {
  /**
   * Timestamp of the last user message (null if no messages sent yet)
   */
  lastUserMessageTime: number | null;
  /**
   * Called when user has been inactive for 3 minutes
   */
  onInactivityWarning: () => void;
  /**
   * Called when user has been inactive for 5 minutes total
   */
  onInactivityTimeout: () => void;
  /**
   * Called when session has been active for 20 minutes (absolute max)
   */
  onSessionExpired: () => void;
}

/**
 * Hook to manage session timeout timers
 *
 * Timers:
 * - Inactivity warning: After 3 minutes of no user messages
 * - Inactivity timeout: After 5 minutes of no user messages
 * - Absolute session timeout: After 20 minutes since chat opened
 */
export function useSessionTimers({
  lastUserMessageTime,
  onInactivityWarning,
  onInactivityTimeout,
  onSessionExpired,
}: UseSessionTimersParams) {
  const inactivityWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const absoluteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownWarningRef = useRef<boolean>(false);

  // Absolute session timer (20 minutes from session start)
  useEffect(() => {
    absoluteTimerRef.current = setTimeout(() => {
      onSessionExpired();
    }, ABSOLUTE_SESSION_MS);

    return () => {
      if (absoluteTimerRef.current) {
        clearTimeout(absoluteTimerRef.current);
      }
    };
  }, []); // Only run once on mount

  // Inactivity timers (reset when user sends a message)
  useEffect(() => {
    // Clear existing timers
    if (inactivityWarningTimerRef.current) {
      clearTimeout(inactivityWarningTimerRef.current);
    }
    if (inactivityCloseTimerRef.current) {
      clearTimeout(inactivityCloseTimerRef.current);
    }

    // Only start inactivity timers if user has sent at least one message
    if (lastUserMessageTime === null) {
      return;
    }

    // Reset warning flag when user sends a new message
    hasShownWarningRef.current = false;

    // Set inactivity warning timer (3 minutes)
    inactivityWarningTimerRef.current = setTimeout(() => {
      if (!hasShownWarningRef.current) {
        hasShownWarningRef.current = true;
        onInactivityWarning();
      }
    }, INACTIVITY_WARNING_MS);

    // Set inactivity close timer (5 minutes)
    inactivityCloseTimerRef.current = setTimeout(() => {
      onInactivityTimeout();
    }, INACTIVITY_CLOSE_MS);

    return () => {
      if (inactivityWarningTimerRef.current) {
        clearTimeout(inactivityWarningTimerRef.current);
      }
      if (inactivityCloseTimerRef.current) {
        clearTimeout(inactivityCloseTimerRef.current);
      }
    };
  }, [lastUserMessageTime, onInactivityWarning, onInactivityTimeout]);
}
