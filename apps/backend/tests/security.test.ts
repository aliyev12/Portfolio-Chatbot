import { describe, test, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { securityHeaders } from '../src/middleware/security';

describe('Security Headers Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', securityHeaders);
  });

  test('should set X-Content-Type-Options header', async () => {
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  test('should set X-Frame-Options header', async () => {
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  test('should set X-XSS-Protection header', async () => {
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  test('should set Referrer-Policy header', async () => {
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  test('should set Permissions-Policy header', async () => {
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    const permissionsPolicy = res.headers.get('Permissions-Policy');

    expect(permissionsPolicy).toContain('geolocation=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('payment=()');
    expect(permissionsPolicy).toContain('usb=()');
  });

  test('should set restrictive CSP for API routes', async () => {
    app.get('/api/test', (c) => c.json({ ok: true }));

    const res = await app.request('/api/test');
    const csp = res.headers.get('Content-Security-Policy');

    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  test('should set permissive CSP for non-API routes', async () => {
    app.get('/widget.js', (c) => c.text('// widget code'));

    const res = await app.request('/widget.js');
    const csp = res.headers.get('Content-Security-Policy');

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain('https://challenges.cloudflare.com');
    expect(csp).not.toContain("default-src 'none'");
  });

  test('should set HSTS header in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    app.get('/test', (c) => c.json({ ok: true }));
    const res = await app.request('/test');

    expect(res.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );

    process.env.NODE_ENV = originalEnv;
  });

  test('should not set HSTS header in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    app.get('/test', (c) => c.json({ ok: true }));
    const res = await app.request('/test');

    expect(res.headers.get('Strict-Transport-Security')).toBeNull();

    process.env.NODE_ENV = originalEnv;
  });

  test('should apply headers to all routes', async () => {
    app.get('/test1', (c) => c.json({ ok: true }));
    app.get('/test2', (c) => c.json({ ok: true }));
    app.post('/test3', (c) => c.json({ ok: true }));

    const res1 = await app.request('/test1');
    const res2 = await app.request('/test2');
    const res3 = await app.request('/test3', { method: 'POST' });

    expect(res1.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res2.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res3.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });
});
