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

// Widget initialization with Shadow DOM for complete style isolation
async function initChatWidget() {
  // Load Turnstile script first
  try {
    await loadTurnstileScript();
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
