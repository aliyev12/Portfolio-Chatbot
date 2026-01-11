import './Message.css';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export function Message({ role, content, isLoading = false }: MessageProps) {
  return (
    <div
      className={`message message--${role}`}
      data-testid={`message-${role}`}
    >
      <div className="message__content">
        {isLoading ? (
          <div className="message__loading">
            <span className="message__loading-dot"></span>
            <span className="message__loading-dot"></span>
            <span className="message__loading-dot"></span>
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
