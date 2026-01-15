// Log environment variable for debugging
console.warn('Raw ALLOWED_ORIGINS env var:', process.env.ALLOWED_ORIGINS);

export const config = {
  PORT: parseInt(process.env.PORT || '3000'),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL || '',
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN || '',
  SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || '',
  MAX_MONTHLY_CONVERSATIONS: parseInt(process.env.MAX_MONTHLY_CONVERSATIONS || '500'),
  ADMIN_SECRET: process.env.ADMIN_SECRET || '',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:4321')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, '')),
  // Security tokens
  API_TOKEN: process.env.API_TOKEN || '',
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
  // Rate limiting
  RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '10'),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
};

// Log parsed origins for debugging
console.warn('Parsed ALLOWED_ORIGINS:', config.ALLOWED_ORIGINS);

// Validate required environment variables
// For Phase 2, we're only validating what we need for the skeleton
// Later phases will require OPENAI_API_KEY, UPSTASH_REDIS_URL, etc.
const requiredForProduction = [
  'OPENAI_API_KEY',
  'UPSTASH_REDIS_URL',
  'UPSTASH_REDIS_TOKEN',
  'ADMIN_SECRET',
  'API_TOKEN',
  'TURNSTILE_SECRET_KEY',
];

// Only validate in production or if NODE_ENV is set
if (process.env.NODE_ENV === 'production') {
  for (const key of requiredForProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
