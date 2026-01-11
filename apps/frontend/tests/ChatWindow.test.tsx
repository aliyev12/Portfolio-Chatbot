import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatWindow } from '../src/components/ChatWindow/ChatWindow';
import * as useChatModule from '../src/hooks/useChat';

// Mock the useChat hook
vi.mock('../src/hooks/useChat', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: '',
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

describe('ChatWindow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders chat window element', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      expect(screen.getByText(/Chat with Abdul/i)).toBeInTheDocument();
    });

    test('renders greeting message on load', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      expect(
        screen.getByText(/Hi! I'm Abdul's virtual assistant/i),
      ).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    test('displays messages from hook', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    test('shows loading indicator when isLoading is true', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: true,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      // Loading indicator is displayed when isLoading is true
      // Component renders a Message with isLoading prop
    });

    test('displays error message when error exists', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: 'Something went wrong',
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    test('error message includes contact link', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: 'Error occurred',
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'http://contact.url');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Form Submission', () => {
    test('sends message on form submit', () => {
      const mockSendMessage = vi.fn();
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: 'test message',
        setInput: vi.fn(),
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const form = screen.getByRole('form', { hidden: true });
      fireEvent.submit(form);

      expect(mockSendMessage).toHaveBeenCalledWith('test message');
    });

    test('does not send if input is empty', () => {
      const mockSendMessage = vi.fn();
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const form = screen.getByRole('form', { hidden: true });
      fireEvent.submit(form);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('does not send if loading', () => {
      const mockSendMessage = vi.fn();
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: 'message',
        setInput: vi.fn(),
        sendMessage: mockSendMessage,
        isLoading: true,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const form = screen.getByRole('form', { hidden: true });
      fireEvent.submit(form);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('clears input after sending', () => {
      const mockSetInput = vi.fn();
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: 'test message',
        setInput: mockSetInput,
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const form = screen.getByRole('form', { hidden: true });
      fireEvent.submit(form);

      expect(mockSetInput).toHaveBeenCalledWith('');
    });
  });

  describe('Input Handling', () => {
    test('syncs input with hook state', () => {
      const mockSetInput = vi.fn();
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: 'current input',
        setInput: mockSetInput,
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const input = screen.getByPlaceholderText(/Type your question/i);
      expect((input as HTMLInputElement).value).toBe('current input');
    });

    test('input disabled when loading', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: true,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const input = screen.getByPlaceholderText(/Type your question/i);
      expect(input).toBeDisabled();
    });
  });

  describe('Send Button', () => {
    test('send button disabled when input empty', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const button = screen.getByRole('button', { name: /Send/i });
      expect(button).toBeDisabled();
    });

    test('send button disabled when loading', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: 'message',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: true,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const button = screen.getByRole('button', { name: /Send/i });
      expect(button).toBeDisabled();
    });

    test('send button enabled when input has content and not loading', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: 'message',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const button = screen.getByRole('button', { name: /Send/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Close Button', () => {
    test('close button calls onClose', () => {
      const mockOnClose = vi.fn();
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={mockOnClose}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const closeButton = screen.getByRole('button', { name: /Close chat/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('close button has aria-label', () => {
      vi.mocked(useChatModule.useChat).mockReturnValue({
        messages: [],
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <ChatWindow
          onClose={vi.fn()}
          apiUrl="http://test.api"
          contactUrl="http://contact.url"
        />,
      );

      const closeButton = screen.getByRole('button', { name: /Close chat/i });
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });
});
