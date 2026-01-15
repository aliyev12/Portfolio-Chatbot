import type { ChangeEvent } from 'react';

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
      className="text-field flex-1"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      data-testid="chat-input"
    />
  );
}
