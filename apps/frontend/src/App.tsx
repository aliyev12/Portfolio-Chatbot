import { useState } from 'react';
import { ChatBubble } from './components/ChatBubble/ChatBubble';
import { ChatWindow } from './components/ChatWindow/ChatWindow';
import { useChatStatus } from './hooks/useChatStatus';
import type { AppConfig } from './types';

interface AppProps {
  config: AppConfig;
}

export default function App({ config }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAvailable, isLoading } = useChatStatus(config.apiUrl);

  // Don't render anything if chatbot is not available or still loading
  if (isLoading) return null;
  if (!isAvailable) return null;

  return (
    <>
      <ChatBubble onClick={() => setIsOpen(true)} isOpen={isOpen} />
      {isOpen && (
        <ChatWindow
          onClose={() => setIsOpen(false)}
          apiUrl={config.apiUrl}
          contactUrl={config.contactUrl}
        />
      )}
    </>
  );
}
