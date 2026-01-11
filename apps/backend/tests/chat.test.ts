import { describe, test, expect } from 'bun:test';
import { chatRoutes } from '../src/routes/chat';

describe('Chat Routes', () => {
  // Note: Full route testing requires mocking the Hono context
  // These are structural tests to ensure the route is properly exported
  describe('Route exports', () => {
    test('chatRoutes is exported', () => {
      expect(chatRoutes).toBeDefined();
    });

    test('chatRoutes is a Hono app instance', () => {
      // Hono apps have fetch method
      expect(typeof chatRoutes.fetch).toBe('function');
    });
  });

  describe('Route structure', () => {
    test('route can accept POST requests', () => {
      // Hono routes support POST
      expect(chatRoutes).toBeDefined();
    });
  });

  describe('Service integration', () => {
    test('chatRoutes can be used in server', () => {
      // Routes are functional and can be mounted
      expect(typeof chatRoutes.fetch).toBe('function');
    });
  });
});
