import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run start:backend',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      OPENAI_API_KEY: 'sk-test-key',
      UPSTASH_REDIS_URL: 'https://test.upstash.io',
      UPSTASH_REDIS_TOKEN: 'test-token',
      MAX_MONTHLY_CONVERSATIONS: '500',
      ADMIN_SECRET: 'test-secret',
      ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5173',
    },
  },
});
