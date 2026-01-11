import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Message } from '../src/components/Message/Message';

describe('Message Component', () => {
  describe('User Message', () => {
    test('renders user message with correct content', () => {
      render(<Message role="user" content="Hello there" />);

      expect(screen.getByText('Hello there')).toBeInTheDocument();
    });

    test('applies user message styling', () => {
      const { container } = render(<Message role="user" content="Hello" />);

      const messageElement = container.querySelector('.message--user');
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Assistant Message', () => {
    test('renders assistant message with correct content', () => {
      render(<Message role="assistant" content="Hi there" />);

      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    test('applies assistant message styling', () => {
      const { container } = render(<Message role="assistant" content="Hi" />);

      const messageElement = container.querySelector('.message--assistant');
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading animation when isLoading is true', () => {
      const { container } = render(<Message role="assistant" content="test" isLoading={true} />);

      const dots = container.querySelectorAll('.message__loading-dot');
      expect(dots.length).toBeGreaterThan(0);
    });

    test('hides content when loading', () => {
      const { container } = render(<Message role="assistant" content="test" isLoading={true} />);

      // When loading, the content should not be displayed
      // Instead, loading dots are shown
      const contentElement = container.querySelector('.message__content');
      if (contentElement) {
        expect(contentElement).not.toBeVisible();
      }
    });

    test('shows content when not loading', () => {
      render(<Message role="assistant" content="test content" isLoading={false} />);

      expect(screen.getByText('test content')).toBeInTheDocument();
    });

    test('defaults isLoading to false', () => {
      render(<Message role="assistant" content="test" />);

      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('user message has correct test id', () => {
      const { container } = render(<Message role="user" content="test" />);

      const messageElement = container.querySelector('[data-testid="message-user"]');
      expect(messageElement).toBeInTheDocument();
    });

    test('assistant message has correct test id', () => {
      const { container } = render(<Message role="assistant" content="test" />);

      const messageElement = container.querySelector('[data-testid="message-assistant"]');
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    test('renders multiline content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const { container } = render(<Message role="assistant" content={multilineContent} />);

      const messageElement = container.querySelector('.message');
      expect(messageElement?.textContent).toContain('Line 1');
      expect(messageElement?.textContent).toContain('Line 2');
    });

    test('renders content with special characters', () => {
      render(<Message role="assistant" content="Hello! @#$% Test &<>" />);

      expect(screen.getByText(/Hello! @#\$% Test &</)).toBeInTheDocument();
    });

    test('renders empty content', () => {
      const { container } = render(<Message role="assistant" content="" />);

      const messageElement = container.querySelector('.message');
      expect(messageElement).toBeInTheDocument();
    });

    test('renders long content', () => {
      const longContent = 'A'.repeat(1000);
      render(<Message role="assistant" content={longContent} />);

      expect(screen.getByText(new RegExp(longContent))).toBeInTheDocument();
    });
  });
});
