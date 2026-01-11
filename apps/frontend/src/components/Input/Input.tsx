import type { ChangeEvent } from 'react';
import './Input.css';

interface InputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Input({ value, onChange, placeholder, disabled }: InputProps) {
  return (
    <input
      type="text"
      className="chatbot-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      data-testid="chat-input"
    />
  );
}
