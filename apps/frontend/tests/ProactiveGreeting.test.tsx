import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProactiveGreeting } from '../src/components/ProactiveGreeting/ProactiveGreeting';

describe('ProactiveGreeting', () => {
  it('should render greeting message', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    expect(screen.getByText('Questions about me?')).toBeInTheDocument();
    expect(screen.getByText("I'm here to chat!")).toBeInTheDocument();
  });

  it('should call onOpen when clicked on greeting content', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    const greeting = screen.getByTestId('proactive-greeting');
    fireEvent.click(greeting);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    const dismissButton = screen.getByTestId('dismiss-greeting');
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should call onOpen when Enter key is pressed', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    const greeting = screen.getByTestId('proactive-greeting');
    fireEvent.keyDown(greeting, { key: 'Enter' });

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onOpen when Space key is pressed', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    const greeting = screen.getByTestId('proactive-greeting');
    fireEvent.keyDown(greeting, { key: ' ' });

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    const greeting = screen.getByTestId('proactive-greeting');
    fireEvent.keyDown(greeting, { key: 'Escape' });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();

    render(<ProactiveGreeting onDismiss={onDismiss} onOpen={onOpen} />);

    const greeting = screen.getByTestId('proactive-greeting');
    expect(greeting).toHaveAttribute('role', 'button');
    expect(greeting).toHaveAttribute('tabIndex', '0');
    expect(greeting).toHaveAttribute('aria-label', 'Chat greeting message');
  });
});
