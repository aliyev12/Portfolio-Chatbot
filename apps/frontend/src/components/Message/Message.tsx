import type { ToolCall } from '../../types';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  toolCall?: ToolCall;
  isSessionLimit?: boolean;
  contactUrl?: string;
}

export function Message({
  role,
  content,
  isLoading = false,
  toolCall,
  isSessionLimit,
  contactUrl = 'https://www.aaliyev.com/contact',
}: MessageProps) {
  const isUser = role === 'user';

  const handleToolCallClick = (toolName: string) => {
    if (toolName === 'contact_me') {
      window.open(contactUrl, '_blank');
    } else if (toolName === 'visit_linkedin') {
      window.open('https://www.linkedin.com/in/abdul-aliyev/', '_blank');
    }
  };

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${role}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></span>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>

            {/* Render tool call button */}
            {toolCall && (
              <button
                onClick={() => handleToolCallClick(toolCall.name)}
                className="button mt-3 block mx-auto"
                style={{
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {toolCall.name === 'contact_me' ? 'Get in touch' : 'Visit LinkedIn'}
              </button>
            )}

            {/* Render contact button for session limit */}
            {isSessionLimit && (
              <button
                onClick={() => handleToolCallClick('contact_me')}
                className="button mt-3 block mx-auto"
                style={{
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                Get in touch
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
