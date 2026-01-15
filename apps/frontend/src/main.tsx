import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    CHATBOT_API_URL?: string;
  }
}

// Widget initialization
function initChatWidget() {
  // Create container for the widget
  const container = document.createElement('div');
  container.id = 'portfolio-chatbot-root';
  document.body.appendChild(container);

  // Get configuration from:
  // 1. Window global (set by script tag on portfolio site)
  // 2. Environment variable (VITE_API_URL - Docker or build-time)
  // 3. Default to localhost:3000 (local development)
  const apiUrl = window.CHATBOT_API_URL ||
    import.meta.env.VITE_API_URL ||
    (() => {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:3000`;
    })();

  const config = {
    apiUrl,
    contactUrl: 'https://www.aaliyev.com/contact',
  };

  const root = createRoot(container);
  root.render(<App config={config} />);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatWidget);
} else {
  initChatWidget();
}
