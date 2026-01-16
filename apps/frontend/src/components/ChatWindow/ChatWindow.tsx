import React, { useRef, useEffect } from 'react';
import { X, Send } from 'react-feather';
import { useChat } from '../../hooks/useChat';
import { Message } from '../Message/Message';
import { Input } from '../Input/Input';
import type { AppConfig } from '../../types';

interface ChatWindowProps {
  onClose: () => void;
  config: AppConfig;
}

export function ChatWindow({ onClose, config }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, sendMessage, isLoading, error } = useChat({
    apiUrl: config.apiUrl,
    apiToken: config.apiToken,
  });

  useEffect(() => {
    // Scroll messages container to bottom
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle iOS viewport resize and prevent scroll (mobile only)
  useEffect(() => {
    // Only apply iOS fixes on mobile devices
    const isMobile = window.innerWidth <= 640;
    if (!isMobile) return;

    // Use Visual Viewport API to handle keyboard appearance on iOS
    const visualViewport = window.visualViewport;

    const handleViewportResize = () => {
      if (chatWindowRef.current && visualViewport) {
        // Update chat window height to match visual viewport
        const height = visualViewport.height;
        chatWindowRef.current.style.height = `${height}px`;

        // Keep window at top
        window.scrollTo(0, 0);
      }
    };

    const handleScroll = () => {
      // Always reset scroll to prevent iOS from scrolling the page
      window.scrollTo(0, 0);
    };

    const handleFocus = () => {
      // Prevent any scroll on focus
      setTimeout(() => {
        window.scrollTo(0, 0);
        if (chatWindowRef.current) {
          chatWindowRef.current.style.top = '0';
        }
      }, 100);
    };

    // Listen for viewport changes (keyboard open/close)
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleViewportResize);
      visualViewport.addEventListener('scroll', handleScroll);
    }

    // Listen for input focus
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('scroll', handleScroll, { passive: false });

    // Initial setup
    handleViewportResize();

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleViewportResize);
        visualViewport.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('scroll', handleScroll);

      // Reset height
      if (chatWindowRef.current) {
        chatWindowRef.current.style.height = '';
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div
      ref={chatWindowRef}
      className="chatbot-window fixed bottom-4 right-4 w-[380px] min-h-[230px] max-h-[520px] h-[calc(100vh-3rem)] bg-card rounded-lg shadow-lg flex flex-col border border-border z-50 max-sm:inset-0 max-sm:w-full max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
      data-testid="chat-window"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 max-sm:px-3 max-sm:py-2 border-b border-border bg-card rounded-t-lg">
        <h2 className="text-lg font-semibold text-card-foreground">Let&apos;s chat</h2>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
          data-testid="close-button"
        >
          <X size={20} />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 max-sm:px-2 max-sm:py-2 bg-background"
      >
        <Message
          role="assistant"
          content="Hi! Ask me anything about his professional background, skills, or experience!"
        />
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <Message role="assistant" content="" isLoading />}
        {error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 dark:bg-gray-800 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800">
            {error} Please try again or{' '}
            <a
              href={config.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline underline-offset-2"
            >
              contact me directly
            </a>
            .
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-2 max-sm:p-2 max-sm:gap-1 border-t border-border bg-card max-sm:rounded-none flex-shrink-0"
        data-testid="chat-form"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="button flex items-center gap-2 flex-shrink-0 max-sm:p-2"
          data-testid="send-button"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
