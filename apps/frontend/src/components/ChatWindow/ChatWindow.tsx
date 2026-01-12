import React, { useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { Message } from '../Message/Message';
import { Input } from '../Input/Input';
import './ChatWindow.css';

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
    <div className="chat-window" data-testid="chat-window">
      <header className="chat-window__header">
        <h2>Chat with Abdul</h2>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="chat-window__close"
          data-testid="close-button"
        >
          &times;
        </button>
      </header>

      <div className="chat-window__messages">
        <Message
          role="assistant"
          content="Hi! I'm Abdul's virtual assistant. Ask me anything about his professional background, skills, or experience!"
        />
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <Message role="assistant" content="" isLoading />}
        {error && (
          <div className="chat-window__error">
            {error} Please try again or{' '}
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              contact me directly
            </a>
            .
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-window__form" data-testid="chat-form">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="chat-window__send"
          data-testid="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}
