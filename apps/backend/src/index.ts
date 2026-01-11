import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health';
import { statusRoutes } from './routes/status';
import { chatRoutes } from './routes/chat';
import { config } from './config';

const app = new Hono();

// Middleware
app.use('*', logger());

// Determine CORS origins based on environment
const corsOrigins = process.env.NODE_ENV === 'development'
  ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
  : config.ALLOWED_ORIGINS;

app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Routes
app.route('/api/health', healthRoutes);
app.route('/api/status', statusRoutes);
app.route('/api/chat', chatRoutes);

// Serve frontend widget (placeholder for now)
app.get('/widget.js', async (c) => {
  // Try multiple possible paths for the widget file
  const possiblePaths = [
    './apps/backend/public/widget.js', // When run from root
    './public/widget.js', // When run from backend dir
    '../backend/public/widget.js', // Alternative
  ];

  let file;
  let exists = false;

  for (const path of possiblePaths) {
    file = Bun.file(path);
    exists = await file.exists();
    if (exists) break;
  }

  if (!exists) {
    return c.text('// Widget not yet built', 200, {
      'Content-Type': 'application/javascript',
    });
  }

  return new Response(file, {
    headers: { 'Content-Type': 'application/javascript' },
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Portfolio Chatbot API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      chat: '/api/chat',
      usage: '/api/status/usage (protected)',
      clearCache: '/api/status/clear-cache (protected)',
      widget: '/widget.js',
    },
  });
});

console.log(`Server starting on port ${config.PORT}...`);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
