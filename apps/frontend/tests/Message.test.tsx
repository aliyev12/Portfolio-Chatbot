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

      // When loading, the text content should not be displayed
      // Instead, loading dots are shown
      expect(screen.queryByText('test')).not.toBeInTheDocument();

      // Loading dots should be visible
      const dots = container.querySelectorAll('.message__loading-dot');
      expect(dots.length).toBeGreaterThan(0);
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

  describe('XSS Protection', () => {
    test('sanitizes script tags in content', () => {
      const maliciousContent = 'Hello <script>alert("XSS")</script> World';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      // Script tags should be removed
      const scriptTag = container.querySelector('script');
      expect(scriptTag).not.toBeInTheDocument();

      // Text content should still be visible (without script)
      expect(container.textContent).toContain('Hello');
      expect(container.textContent).toContain('World');
    });

    test('sanitizes onclick event handlers', () => {
      const maliciousContent = 'Click <a href="#" onclick="alert(\'XSS\')">here</a>';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      // Find the anchor tag - raw HTML in markdown should be stripped entirely
      const link = container.querySelector('a');

      // Either no link exists (HTML stripped), or if it exists, no onclick handler
      if (link) {
        expect(link.getAttribute('onclick')).toBeNull();
      }

      // Content should still show "Click here" as text even if HTML is stripped
      expect(container.textContent).toContain('Click');
      expect(container.textContent).toContain('here');
    });

    test('sanitizes onload event handlers in images', () => {
      const maliciousContent = '<img src="x" onerror="alert(\'XSS\')" />';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      // Find any img tag
      const img = container.querySelector('img');

      // If img exists, it should not have onerror handler
      if (img) {
        expect(img.getAttribute('onerror')).toBeNull();
      }
    });

    test('sanitizes javascript: protocol in links', () => {
      const maliciousContent = '[Click me](javascript:alert("XSS"))';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      const link = container.querySelector('a');

      // Link should either not exist or not have javascript: protocol
      if (link) {
        const href = link.getAttribute('href');
        // href should be null or not contain javascript:
        if (href !== null) {
          expect(href).not.toContain('javascript:');
        }
      }
    });

    test('sanitizes data: protocol with base64 script', () => {
      const maliciousContent = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      const link = container.querySelector('a');

      // data: protocol should be removed
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          expect(href).not.toContain('data:');
        }
      }
    });

    test('sanitizes iframe injection', () => {
      const maliciousContent = '<iframe src="https://evil.com"></iframe>';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      // iframe should be removed
      const iframe = container.querySelector('iframe');
      expect(iframe).not.toBeInTheDocument();
    });

    test('sanitizes object/embed tags', () => {
      const maliciousContent = '<object data="malicious.swf"></object>';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      // object tag should be removed
      const objectTag = container.querySelector('object');
      expect(objectTag).not.toBeInTheDocument();
    });

    test('allows safe markdown formatting', () => {
      const safeContent = '**Bold** and *italic* and `code`';
      const { container } = render(<Message role="assistant" content={safeContent} />);

      // Check that formatting elements are present
      expect(container.querySelector('strong')).toBeInTheDocument();
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    test('allows safe links with proper attributes', () => {
      const safeContent = '[Google](https://google.com)';
      render(<Message role="assistant" content={safeContent} />);

      const link = screen.getByRole('link', { name: /google/i });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toBe('https://google.com');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    test('sanitizes style attribute with javascript', () => {
      const maliciousContent = '<div style="background:url(javascript:alert(\'XSS\'))">Test</div>';
      const { container } = render(<Message role="assistant" content={maliciousContent} />);

      // Find any element with style attribute
      const elements = container.querySelectorAll('[style]');

      // Check that none contain javascript:
      elements.forEach((element) => {
        const style = element.getAttribute('style');
        if (style) {
          expect(style).not.toContain('javascript:');
        }
      });
    });
  });
});
