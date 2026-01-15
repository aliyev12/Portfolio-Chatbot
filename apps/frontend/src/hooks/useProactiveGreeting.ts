import { useState, useEffect } from 'react';

interface UseProactiveGreetingProps {
  isAvailable: boolean;
  isLoading: boolean;
  isOpen: boolean;
}

interface UseProactiveGreetingReturn {
  showGreeting: boolean;
  dismissGreeting: () => void;
}

const GREETING_DISMISSED_KEY = 'chatbot_greeting_dismissed';
// const INITIAL_DELAY_MS = 10000; // 10 seconds
const INITIAL_DELAY_MS = 1; // 10 seconds
const AUTO_DISMISS_DELAY_MS = 8000000; // 8 seconds after showing
// const AUTO_DISMISS_DELAY_MS = 8000; // 8 seconds after showing

export function useProactiveGreeting({
  isAvailable,
  isLoading,
  isOpen,
}: UseProactiveGreetingProps): UseProactiveGreetingReturn {
  const [showGreeting, setShowGreeting] = useState(false);

  // Check if greeting was previously dismissed
  const wasDismissed = () => {
    try {
      return localStorage.getItem(GREETING_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  };

  // Dismiss greeting permanently
  const dismissGreeting = () => {
    setShowGreeting(false);
    try {
      localStorage.setItem(GREETING_DISMISSED_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    // Don't show if already dismissed, loading, not available, or chat is open
    if (wasDismissed() || isLoading || !isAvailable || isOpen) {
      return;
    }

    // Show greeting after initial delay
    const showTimer = setTimeout(() => {
      setShowGreeting(true);

      // Auto-dismiss after additional delay
      const autoDismissTimer = setTimeout(() => {
        setShowGreeting(false);
      }, AUTO_DISMISS_DELAY_MS);

      return () => clearTimeout(autoDismissTimer);
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(showTimer);
  }, [isAvailable, isLoading, isOpen]);

  // Hide greeting when chat opens
  useEffect(() => {
    if (isOpen && showGreeting) {
      setShowGreeting(false);
    }
  }, [isOpen, showGreeting]);

  return { showGreeting, dismissGreeting };
}
