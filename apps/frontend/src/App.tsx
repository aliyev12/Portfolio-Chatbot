import { useState, useEffect } from 'react';
import { ChatBubble } from './components/ChatBubble/ChatBubble';
import { ChatWindow } from './components/ChatWindow/ChatWindow';
import { ProactiveGreeting } from './components/ProactiveGreeting/ProactiveGreeting';
import { useChatStatus } from './hooks/useChatStatus';
import { useProactiveGreeting } from './hooks/useProactiveGreeting';
import type { AppConfig } from './types';

interface AppProps {
  config: AppConfig;
}

export default function App({ config }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAvailable, isLoading } = useChatStatus(config.apiUrl);
  const { showGreeting, dismissGreeting } = useProactiveGreeting({
    isAvailable,
    isLoading,
    isOpen,
  });

  // Prevent body scroll when chat is open (mobile only)
  useEffect(() => {
    // Only apply scroll prevention on mobile devices
    const isMobile = window.innerWidth <= 640;

    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Don't render anything if chatbot is not available or still loading
  if (isLoading) return null;
  if (!isAvailable) return null;

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  return (
    <>
      {showGreeting && (
        <ProactiveGreeting onDismiss={dismissGreeting} onOpen={handleOpenChat} />
      )}
      <ChatBubble
        onClick={handleOpenChat}
        isOpen={isOpen}
        shouldBounce={showGreeting}
      />
      {isOpen && (
        <ChatWindow
          onClose={() => setIsOpen(false)}
          config={config}
        />
      )}
    </>
  );
}
