import { createRoot } from 'react-dom/client';
import App from './App';
// Import CSS normally - Vite will process through Tailwind and output to widget.css
import './styles/globals.css';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    CHATBOT_API_URL?: string;
    CHATBOT_API_TOKEN?: string;
    CHATBOT_TURNSTILE_SITE_KEY?: string;
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

// Load Cloudflare Turnstile script
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="turnstile"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });
}

// Global Turnstile token management
let turnstileToken = '';
let turnstileWidgetId = '';
let isTokenReady = false;
let tokenReadyResolvers: Array<() => void> = [];

// Initialize Turnstile in main document (outside Shadow DOM)
async function initTurnstile(siteKey: string): Promise<void> {
  if (!siteKey) {
    console.warn('Turnstile site key not provided');
    return;
  }

  // Create Turnstile container in main document (NOT in Shadow DOM)
  const turnstileContainer = document.createElement('div');
  turnstileContainer.id = 'portfolio-chatbot-turnstile';
  turnstileContainer.style.cssText = 'position: fixed; top: -9999px; left: -9999px;'; // Hidden
  document.body.appendChild(turnstileContainer);

  // Wait for Turnstile API to be ready
  const waitForTurnstile = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkTurnstile = () => {
        if (window.turnstile) {
          resolve();
        } else {
          setTimeout(checkTurnstile, 100);
        }
      };
      checkTurnstile();
    });
  };

  await waitForTurnstile();

  // Render invisible Turnstile widget
  try {
    turnstileWidgetId = window.turnstile!.render(turnstileContainer, {
      sitekey: siteKey,
      callback: (token: string) => {
        turnstileToken = token;
        isTokenReady = true;
        console.warn('✓ Turnstile token obtained');

        // Resolve any pending promises waiting for token
        tokenReadyResolvers.forEach(resolve => resolve());
        tokenReadyResolvers = [];
      },
      'error-callback': () => {
        console.error('Turnstile verification failed');
        turnstileToken = '';
        isTokenReady = false;
      },
      'expired-callback': () => {
        console.warn('Turnstile token expired, refreshing...');
        turnstileToken = '';
        isTokenReady = false;
        // Automatically reset to get new token
        resetTurnstile();
      },
      theme: 'light',
      size: 'invisible',
    });
  } catch (error) {
    console.error('Failed to initialize Turnstile:', error);
  }
}

// Export function to get current Turnstile token
export function getTurnstileToken(): string {
  return turnstileToken;
}

// Export function to reset Turnstile widget (generates new token)
export function resetTurnstile(): void {
  if (window.turnstile && turnstileWidgetId) {
    console.warn('Resetting Turnstile widget...');
    isTokenReady = false;
    turnstileToken = '';
    window.turnstile.reset(turnstileWidgetId);
  }
}

// Export function to wait for token to be ready
export function waitForTurnstileToken(timeoutMs = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    // If token is already ready, resolve immediately
    if (isTokenReady && turnstileToken) {
      resolve(turnstileToken);
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Turnstile token generation timeout'));
    }, timeoutMs);

    // Add resolver to queue
    tokenReadyResolvers.push(() => {
      clearTimeout(timeoutId);
      resolve(turnstileToken);
    });
  });
}

// Widget initialization with Shadow DOM for complete style isolation
async function initChatWidget() {
  // Load Turnstile script first
  const turnstileSiteKey = window.CHATBOT_TURNSTILE_SITE_KEY || import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  try {
    await loadTurnstileScript();
    // Initialize Turnstile in main document (outside Shadow DOM)
    await initTurnstile(turnstileSiteKey);
  } catch (error) {
    console.error('Failed to load Turnstile:', error);
    // Continue anyway - will show error in UI
  }

  // Create host container for Shadow DOM
  const hostContainer = document.createElement('div');
  hostContainer.id = 'portfolio-chatbot-host';
  // Position: relative allows fixed children to position relative to viewport
  // This is crucial for the fixed chat bubble and window
  hostContainer.style.cssText = 'position: relative; z-index: 9999;';
  document.body.appendChild(hostContainer);

  // Create Shadow DOM (open mode for debugging access if needed)
  const shadowRoot = hostContainer.attachShadow({ mode: 'open' });

  // Get API URL for fetching CSS
  const apiUrl = window.CHATBOT_API_URL ||
    import.meta.env.VITE_API_URL ||
    (() => {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:3000`;
    })();

  // Fetch and inject CSS into Shadow DOM
  try {
    const cssUrl = `${apiUrl}/widget.css`;
    const response = await fetch(cssUrl);
    const cssText = await response.text();

    const styleElement = document.createElement('style');
    styleElement.textContent = cssText;
    shadowRoot.appendChild(styleElement);
  } catch (error) {
    console.error('Failed to load chatbot styles:', error);
    // Continue anyway - some styling may still work
  }

  // Create container for React app inside Shadow DOM
  const appContainer = document.createElement('div');
  appContainer.id = 'portfolio-chatbot-root';
  shadowRoot.appendChild(appContainer);

  const config = {
    apiUrl,
    contactUrl: 'https://www.aaliyev.com/contact',
    // Runtime configuration takes precedence over build-time env vars
    apiToken: window.CHATBOT_API_TOKEN || import.meta.env.VITE_API_TOKEN || '',
    turnstileSiteKey: window.CHATBOT_TURNSTILE_SITE_KEY || import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  };

  // Render React app into Shadow DOM
  const root = createRoot(appContainer);
  root.render(<App config={config} />);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatWidget);
} else {
  initChatWidget();
}
