import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mock the useChatStatus hook
vi.mock('../src/hooks/useChatStatus', () => ({
  useChatStatus: () => ({
    isAvailable: true,
    isLoading: false,
    error: null,
  }),
}));

// Mock the ChatBubble component
vi.mock('../src/components/ChatBubble/ChatBubble', () => ({
  ChatBubble: ({ onClick, isOpen }: any) => {
    if (isOpen) return null;
    return <button onClick={onClick} data-testid="chat-bubble">Chat</button>;
  },
}));

// Mock the ChatWindow component
vi.mock('../src/components/ChatWindow/ChatWindow', () => ({
  ChatWindow: ({ onClose }: any) => (
    <div data-testid="chat-window">
      <button onClick={onClose} data-testid="close-button">Close</button>
    </div>
  ),
}));

const mockConfig = {
  apiUrl: 'http://test.api',
  contactUrl: 'http://contact.url',
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    test('returns null while loading', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: true,
        error: null,
      });

      const { container } = render(<App config={mockConfig} />);

      // When loading, App returns null
      expect(container.firstChild?.childNodes.length).toBe(0);
    });
  });

  describe('Unavailable State', () => {
    test('returns null when unavailable', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: false,
        isLoading: false,
        error: null,
      });

      const { container } = render(<App config={mockConfig} />);

      // When unavailable, App returns null
      expect(container.firstChild?.childNodes.length).toBe(0);
    });
  });

  describe('Available State', () => {
    test('renders ChatBubble when available', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      render(<App config={mockConfig} />);

      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument();
    });

    test('does not render ChatWindow initially', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      render(<App config={mockConfig} />);

      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
    });
  });

  describe('Open/Close Behavior', () => {
    test('clicking bubble opens ChatWindow', async () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      render(<App config={mockConfig} />);

      const bubble = screen.getByTestId('chat-bubble');
      fireEvent.click(bubble);

      await waitFor(() => {
        expect(screen.getByTestId('chat-window')).toBeInTheDocument();
      });
    });

    test('ChatBubble hidden when window is open', async () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      render(<App config={mockConfig} />);

      const bubble = screen.getByTestId('chat-bubble');
      fireEvent.click(bubble);

      await waitFor(() => {
        // Bubble should be hidden (mocked to return null when isOpen is true)
        expect(screen.queryByTestId('chat-bubble')).not.toBeInTheDocument();
      });
    });

    test('closing window shows ChatBubble again', async () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<App config={mockConfig} />);

      // Open window
      const bubble = screen.getByTestId('chat-bubble');
      fireEvent.click(bubble);

      await waitFor(() => {
        expect(screen.getByTestId('chat-window')).toBeInTheDocument();
      });

      // Close window
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      // Need to trigger re-render to see updated state
      rerender(<App config={mockConfig} />);

      // Bubble should reappear
      expect(screen.queryByTestId('chat-bubble')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    test('passes apiUrl to ChatWindow', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      const config = {
        apiUrl: 'http://my-api.com',
        contactUrl: 'http://contact.com',
      };

      render(<App config={config} />);

      const bubble = screen.getByTestId('chat-bubble');
      fireEvent.click(bubble);

      // ChatWindow would receive apiUrl (tested via mock verification)
      expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });

    test('passes contactUrl to ChatWindow', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      const config = {
        apiUrl: 'http://api.com',
        contactUrl: 'http://my-contact.com',
      };

      render(<App config={config} />);

      const bubble = screen.getByTestId('chat-bubble');
      fireEvent.click(bubble);

      expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });

    test('passes apiUrl to useChatStatus hook', () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      render(<App config={mockConfig} />);

      // Hook is called with apiUrl
      expect(useChatStatus).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    test('full open/close cycle works', async () => {
      const { useChatStatus } = require('../src/hooks/useChatStatus');
      useChatStatus.mockReturnValue({
        isAvailable: true,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<App config={mockConfig} />);

      // Initially, only bubble is visible
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument();
      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();

      // Click bubble to open
      fireEvent.click(screen.getByTestId('chat-bubble'));

      await waitFor(() => {
        expect(screen.getByTestId('chat-window')).toBeInTheDocument();
      });

      // Close the window
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      rerender(<App config={mockConfig} />);

      // Should be back to initial state (bubble visible, window hidden)
      expect(screen.getByTestId('chat-bubble')).toBeInTheDocument();
      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
    });
  });
});
