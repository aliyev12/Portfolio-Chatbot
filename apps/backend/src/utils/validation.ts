/**
 * Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation and sanitization to prevent
 * XSS attacks, injection attacks, and inappropriate content.
 */

/**
 * Sanitize user input by removing potentially dangerous characters
 * and normalizing whitespace
 */
export function sanitizeInput(input: string): string {
  let sanitized = input;

  // Remove null bytes (using both unicode and hex representations)
  sanitized = sanitized.replace(/\u0000/g, '').replace(/\x00/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Remove script tags more aggressively (before general HTML tag removal)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Strip HTML tags (basic protection against XSS) - improved regex
  sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, '');

  // Normalize whitespace (collapse multiple spaces/newlines)
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim leading and trailing whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate message format and content
 * Returns null if valid, error message if invalid
 */
export function validateMessageContent(message: string): string | null {
  // Check for excessive character repetition (potential spam)
  const repeatedCharPattern = /(.)\1{10,}/;
  if (repeatedCharPattern.test(message)) {
    return 'Message contains excessive repeated characters';
  }

  // Check for extremely long words (potential overflow attack)
  const words = message.split(/\s+/);
  const hasExtremelyLongWord = words.some((word) => word.length > 100);
  if (hasExtremelyLongWord) {
    return 'Message contains unusually long words';
  }

  // Check if message is all caps (potential spam/shouting)
  // Allow if message is short or has less than 70% uppercase
  const uppercaseRatio =
    (message.match(/[A-Z]/g) || []).length / message.replace(/\s/g, '').length;
  if (message.length > 20 && uppercaseRatio > 0.7) {
    return 'Please avoid using excessive capital letters';
  }

  // Check for suspicious patterns (SQL injection attempts)
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(--\s*$)/m,
    /(\bEXEC\b.*\()/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(message)) {
      return 'Message contains potentially malicious content';
    }
  }

  // Check for script injection attempts
  const scriptPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers like onclick=
    /eval\s*\(/i,
  ];

  for (const pattern of scriptPatterns) {
    if (pattern.test(message)) {
      return 'Message contains potentially malicious content';
    }
  }

  return null; // Message is valid
}

/**
 * Basic profanity filter
 * Returns true if message contains inappropriate content
 */
export function containsInappropriateContent(message: string): boolean {
  // Basic profanity word list (can be extended)
  // Using partial matches to catch variations
  const inappropriateWords = [
    // Common profanity
    'fuck',
    'shit',
    'bitch',
    'asshole',
    'damn',
    'crap',
    // Offensive slurs (abbreviated to avoid explicit content)
    // Add more as needed based on your requirements
  ];

  // Check for inappropriate words (case-insensitive)
  for (const word of inappropriateWords) {
    // Use word boundaries to avoid false positives
    const pattern = new RegExp(`\\b${word}`, 'i');
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

/**
 * Comprehensive validation function that combines all checks
 */
export function validateAndSanitizeMessage(
  message: string,
): { isValid: boolean; sanitized?: string; error?: string } {
  // First sanitize the input
  const sanitized = sanitizeInput(message);

  // Check if sanitization removed everything
  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: 'Message is empty after sanitization',
    };
  }

  // Validate content format
  const formatError = validateMessageContent(sanitized);
  if (formatError) {
    return {
      isValid: false,
      error: formatError,
    };
  }

  // Check for inappropriate content
  if (containsInappropriateContent(sanitized)) {
    return {
      isValid: false,
      error: 'Message contains inappropriate language',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}
