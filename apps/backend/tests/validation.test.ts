import { describe, test, expect } from 'bun:test';
import {
  sanitizeInput,
  validateMessageContent,
  containsInappropriateContent,
  validateAndSanitizeMessage,
} from '../src/utils/validation';

describe('sanitizeInput', () => {
  test('should remove null bytes', () => {
    const input = 'Hello\0World';
    const result = sanitizeInput(input);
    expect(result).toBe('HelloWorld');
  });

  test('should remove control characters', () => {
    const input = 'Hello\x00\x01\x02World';
    const result = sanitizeInput(input);
    expect(result).toBe('HelloWorld');
  });

  test('should strip HTML tags', () => {
    const input = 'Hello <script>alert("XSS")</script>World';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World');
  });

  test('should remove script tags aggressively', () => {
    const input = '<script src="malicious.js"></script>Hello';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello');
  });

  test('should normalize whitespace', () => {
    const input = 'Hello    World\n\n\nTest';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World Test');
  });

  test('should trim leading and trailing whitespace', () => {
    const input = '   Hello World   ';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World');
  });

  test('should handle valid input without changes', () => {
    const input = 'Hello, how are you?';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello, how are you?');
  });
});

describe('validateMessageContent', () => {
  test('should accept valid messages', () => {
    const message = 'Hello, how can I help you?';
    const result = validateMessageContent(message);
    expect(result).toBeNull();
  });

  test('should reject messages with excessive repeated characters', () => {
    const message = 'Hellooooooooooo';
    const result = validateMessageContent(message);
    expect(result).toContain('excessive repeated characters');
  });

  test('should reject messages with extremely long words', () => {
    // Use different characters to avoid triggering the repeated character check
    const message = 'abcdefghij'.repeat(11); // 110 character word without repetition
    const result = validateMessageContent(message);
    expect(result).toContain('unusually long words');
  });

  test('should reject messages with excessive capitals', () => {
    const message = 'HELLO THIS IS ALL CAPS MESSAGE';
    const result = validateMessageContent(message);
    expect(result).toContain('capital letters');
  });

  test('should allow short all-caps messages', () => {
    const message = 'HELLO';
    const result = validateMessageContent(message);
    expect(result).toBeNull();
  });

  test('should detect SQL injection attempts', () => {
    const message = 'SELECT * FROM users; DROP TABLE users;';
    const result = validateMessageContent(message);
    expect(result).toContain('malicious content');
  });

  test('should detect script injection attempts', () => {
    const message = '<script>alert("XSS")</script>';
    const result = validateMessageContent(message);
    expect(result).toContain('malicious content');
  });

  test('should detect javascript: protocol', () => {
    const message = 'javascript:alert("XSS")';
    const result = validateMessageContent(message);
    expect(result).toContain('malicious content');
  });

  test('should detect event handlers', () => {
    const message = '<img onclick="alert(1)">';
    const result = validateMessageContent(message);
    expect(result).toContain('malicious content');
  });
});

describe('containsInappropriateContent', () => {
  test('should detect profanity', () => {
    const message = 'This is a fucking test';
    const result = containsInappropriateContent(message);
    expect(result).toBe(true);
  });

  test('should be case-insensitive', () => {
    const message = 'This is a FUCKING test';
    const result = containsInappropriateContent(message);
    expect(result).toBe(true);
  });

  test('should allow clean messages', () => {
    const message = 'This is a clean message';
    const result = containsInappropriateContent(message);
    expect(result).toBe(false);
  });

  test('should use word boundaries to avoid false positives', () => {
    // "assume" contains "ass" but shouldn't trigger
    const message = 'I assume this will work';
    const result = containsInappropriateContent(message);
    expect(result).toBe(false);
  });
});

describe('validateAndSanitizeMessage', () => {
  test('should accept and sanitize valid messages', () => {
    const message = '  Hello, how are you?  ';
    const result = validateAndSanitizeMessage(message);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('Hello, how are you?');
    expect(result.error).toBeUndefined();
  });

  test('should reject empty messages after sanitization', () => {
    const message = '   ';
    const result = validateAndSanitizeMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty');
  });

  test('should reject messages with format issues', () => {
    const message = 'a'.repeat(101);
    const result = validateAndSanitizeMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should reject inappropriate content', () => {
    const message = 'This is a fucking test';
    const result = validateAndSanitizeMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('inappropriate');
  });

  test('should sanitize and validate in correct order', () => {
    const message = '  <script>alert("XSS")</script>Hello  ';
    const result = validateAndSanitizeMessage(message);
    // After sanitization: "Hello"
    // Should be valid after sanitization removes malicious content
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('Hello');
  });

  test('should handle HTML entities correctly', () => {
    const message = 'Hello <b>World</b>';
    const result = validateAndSanitizeMessage(message);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('Hello World');
  });

  test('should reject SQL injection after sanitization fails to clean it', () => {
    const message = "'; DROP TABLE users; --";
    const result = validateAndSanitizeMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('malicious');
  });
});
