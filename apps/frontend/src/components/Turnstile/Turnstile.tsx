import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

/**
 * Cloudflare Turnstile Component
 *
 * Renders an invisible CAPTCHA widget that automatically verifies users.
 * The widget must be rendered in the main document (not Shadow DOM) to work properly.
 */
export function Turnstile({ siteKey, onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !siteKey) return;

    // Wait for Turnstile to be loaded
    const initTurnstile = () => {
      if (!window.turnstile || !containerRef.current) {
        // Retry after a short delay if not loaded yet
        setTimeout(initTurnstile, 100);
        return;
      }

      // Render the Turnstile widget
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme: 'light',
          size: 'invisible', // Invisible widget - no UI
        });
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        onError?.();
      }
    };

    initTurnstile();

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  return <div ref={containerRef} />;
}

// Extend Window interface for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'invisible' | 'compact';
      }) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}
