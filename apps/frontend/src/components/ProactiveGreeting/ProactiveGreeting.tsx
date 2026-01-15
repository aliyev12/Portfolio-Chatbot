import React from 'react';
import { X } from 'react-feather';
import './ProactiveGreeting.css';

interface ProactiveGreetingProps {
  onDismiss: () => void;
  onOpen: () => void;
}

export function ProactiveGreeting({ onDismiss, onOpen }: ProactiveGreetingProps) {
  const handleDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDismiss();
  };

  return (
    <div
      className="proactive-greeting"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        } else if (e.key === 'Escape') {
          onDismiss();
        }
      }}
      aria-label="Chat greeting message"
      data-testid="proactive-greeting"
    >
      <div className="proactive-greeting-content">
        <span className="proactive-greeting-emoji">👋</span>
        <div className="proactive-greeting-text">
          <strong>Questions about me?</strong>
          <p>I&apos;m here to chat!</p>
        </div>
        <button
          className="proactive-greeting-close"
          onClick={handleDismiss}
          aria-label="Dismiss greeting"
          data-testid="dismiss-greeting"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
