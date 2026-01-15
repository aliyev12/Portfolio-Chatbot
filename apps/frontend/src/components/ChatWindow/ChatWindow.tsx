import React, { useRef, useEffect } from 'react';
import { X, Send } from 'react-feather';
import { useChat } from '../../hooks/useChat';
import { Message } from '../Message/Message';
import { Input } from '../Input/Input';

interface ChatWindowProps {
  onClose: () => void;
  apiUrl: string;
  contactUrl: string;
}

export function ChatWindow({ onClose, apiUrl, contactUrl }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, sendMessage, isLoading, error } =
    useChat(apiUrl);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-card rounded-lg shadow-lg flex flex-col border border-border z-50"
      data-testid="chat-window"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card rounded-t-lg">
        <h2 className="text-lg font-semibold text-card-foreground">Chat with Abdul</h2>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
        <Message
          role="assistant"
          content="Hi! I'm Abdul's virtual assistant. Ask me anything about his professional background, skills, or experience!"
        />
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <Message role="assistant" content="" isLoading />}
        {error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 dark:bg-gray-800 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800">
            {error} Please try again or{' '}
            <a
              href={contactUrl}
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
        className="flex gap-2 p-4 border-t border-border bg-card rounded-b-lg"
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
          className="button flex items-center gap-2"
          data-testid="send-button"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
