import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/reset.css';
import './styles/variables.css';
import './styles/utilities.css';

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

  // Get configuration from window global or default to localhost for development
  const apiUrl = window.CHATBOT_API_URL || (() => {
    // Default to localhost for development
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
