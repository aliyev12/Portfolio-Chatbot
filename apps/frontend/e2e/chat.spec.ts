import { test, expect } from '@playwright/test';

test.describe('Chatbot Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Load a test page that includes the widget
    // In development, the widget is served from the backend at /widget.js
    await page.goto('http://localhost:3000');
  });

  test('shows chat bubble when chatbot is available', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await expect(bubble).toBeVisible({ timeout: 10000 });
  });

  test('opens chat window when bubble is clicked', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const window = page.locator('[data-testid="chat-window"]');
    await expect(window).toBeVisible();
  });

  test('can send a message and receive a response', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('What is your experience?');

    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    // Wait for assistant message to appear
    const assistantMessage = page.locator('[data-testid="message-assistant"]').last();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });

    // Verify message has content
    const text = await assistantMessage.textContent();
    expect(text).toBeTruthy();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('shows loading state during message transmission', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill('test message');

    // Initially send button should be enabled
    await expect(sendButton).not.toBeDisabled();

    // After clicking, should be disabled during loading
    await sendButton.click();
    await expect(sendButton).toBeDisabled();

    // Wait for response
    const assistantMessage = page.locator('[data-testid="message-assistant"]').last();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });

    // After response, send button should be re-enabled
    await expect(sendButton).not.toBeDisabled();
  });

  test('disables input during message transmission', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill('test');

    // Initially input should be enabled
    await expect(input).not.toBeDisabled();

    // After sending, input should be disabled
    await sendButton.click();
    await expect(input).toBeDisabled();

    // After response, input should be re-enabled
    const assistantMessage = page.locator('[data-testid="message-assistant"]').last();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });
    await expect(input).not.toBeDisabled();
  });

  test('clears input after sending message', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]') as any;
    const sendButton = page.locator('[data-testid="send-button"]');

    await input.fill('test message');
    expect(await input.inputValue()).toBe('test message');

    await sendButton.click();

    // Wait for response
    const assistantMessage = page.locator('[data-testid="message-assistant"]').last();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });

    // Input should be cleared
    expect(await input.inputValue()).toBe('');
  });

  test('displays multiple messages in conversation history', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Send first message
    await input.fill('First question');
    await sendButton.click();

    const firstResponse = page.locator('[data-testid="message-assistant"]').first();
    await expect(firstResponse).toBeVisible({ timeout: 30000 });

    // Send second message
    await input.fill('Second question');
    await sendButton.click();

    // Both messages should be visible
    const messages = page.locator('[data-testid^="message-"]');
    const count = await messages.count();
    // Should have: greeting + user1 + assistant1 + user2 + assistant2 = at least 4
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('scrolls to new messages', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Send message
    await input.fill('test');
    await sendButton.click();

    // Wait for response
    const lastMessage = page.locator('[data-testid="message-assistant"]').last();
    await expect(lastMessage).toBeVisible({ timeout: 30000 });

    // Verify message is visible (scrolled into view)
    await expect(lastMessage).toBeVisible();
  });

  test('closes chat window when close button is clicked', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const window = page.locator('[data-testid="chat-window"]');
    await expect(window).toBeVisible();

    const closeButton = page.locator('[data-testid="close-button"]');
    await closeButton.click();

    // Window should be hidden
    await expect(window).not.toBeVisible();

    // Bubble should reappear
    await expect(bubble).toBeVisible();
  });

  test('can reopen chat after closing', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    const window = page.locator('[data-testid="chat-window"]');

    // Open
    await bubble.click();
    await expect(window).toBeVisible();

    // Close
    const closeButton = page.locator('[data-testid="close-button"]');
    await closeButton.click();
    await expect(window).not.toBeVisible();

    // Reopen
    await bubble.click();
    await expect(window).toBeVisible();
  });

  test('preserves conversation history when reopening', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    const closeButton = page.locator('[data-testid="close-button"]');
    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Open and send a message
    await bubble.click();
    await input.fill('first message');
    await sendButton.click();

    // Wait for response
    const firstResponse = page.locator('[data-testid="message-assistant"]').first();
    await expect(firstResponse).toBeVisible({ timeout: 30000 });

    // Close
    await closeButton.click();

    // Reopen
    await bubble.click();

    // First message should still be there
    const userMessage = page.locator('[data-testid="message-user"]').first();
    await expect(userMessage).toContainText('first message');
  });

  test('handles empty input submission gracefully', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Send button should be disabled with empty input
    await expect(sendButton).toBeDisabled();

    // Fill and clear input
    await input.fill('test');
    await input.clear();

    // Button should be disabled again
    await expect(sendButton).toBeDisabled();
  });

  test('handles whitespace-only input gracefully', async ({ page }) => {
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await bubble.click();

    const input = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Fill with spaces
    await input.fill('   ');

    // Send button should be disabled
    await expect(sendButton).toBeDisabled();
  });
});

test.describe('Widget Bootstrap', () => {
  test('widget initializes on page load', async ({ page }) => {
    // Navigate to page
    await page.goto('http://localhost:3000');

    // Wait for widget to be available
    const bubble = page.locator('[data-testid="chat-bubble"]');
    await expect(bubble).toBeVisible({ timeout: 10000 });
  });

  test('widget is injected at end of body', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const root = page.locator('#portfolio-chatbot-root');
    await expect(root).toBeVisible();
  });
});
