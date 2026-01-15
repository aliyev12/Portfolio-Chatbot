interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export function Message({ role, content, isLoading = false }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${role}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        )}
      </div>
    </div>
  );
}
