import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
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

  const handleToolCallClick = async (toolName: string) => {
    if (toolName === 'contact_me') {
      window.open(contactUrl, '_blank');
    } else if (toolName === 'visit_linkedin') {
      window.open('https://www.linkedin.com/in/aliyevabdul/', '_blank');
    } else if (toolName === 'download_resume') {
      // Trigger file download instead of opening in new tab
      try {
        const response = await fetch('https://resume.aaliyev.com/resumeAbdulAliyev.pdf');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resumeAbdulAliyev.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download resume:', error);
        // Fallback to opening in new tab if download fails
        window.open('https://resume.aaliyev.com/resumeAbdulAliyev.pdf', '_blank');
      }
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
            <div className="text-sm whitespace-pre-wrap break-words">
              <ReactMarkdown
                rehypePlugins={[rehypeSanitize]}
                components={{
                  // Open links in new tab with security attributes
                  a: ({ node: _node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    />
                  ),
                  // Preserve paragraph styling
                  p: ({ node: _node, ...props }) => <p {...props} className="mb-0" />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

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
                {toolCall.name === 'contact_me'
                  ? 'Get in touch'
                  : toolCall.name === 'visit_linkedin'
                    ? 'Visit LinkedIn'
                    : 'Download Resume'}
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
