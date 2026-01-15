import { MessageCircle } from 'react-feather';
import './ChatBubble.css';

interface ChatBubbleProps {
  onClick: () => void;
  isOpen: boolean;
  shouldBounce?: boolean;
}

export function ChatBubble({ onClick, isOpen, shouldBounce = false }: ChatBubbleProps) {
  if (isOpen) return null;

  return (
    <button
      className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 z-50 ${shouldBounce ? 'chatbot-bubble--bouncing' : ''}`}
      onClick={onClick}
      aria-label="Open chat"
      data-testid="chat-bubble"
    >
      <MessageCircle size={24} />
    </button>
  );
}
