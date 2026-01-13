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
const allowedOrigins =
  process.env.NODE_ENV === 'development'
    ? [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ]
    : config.ALLOWED_ORIGINS;

// Log allowed origins on startup for debugging
console.warn('CORS allowed origins:', allowedOrigins);

app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return '*';

      // Debug: log the comparison
      console.warn(`CORS check - Incoming: "${origin}", Allowed list:`, allowedOrigins);
      console.warn(
        `CORS check - Exact match test:`,
        allowedOrigins.map((allowed) => ({
          allowed,
          matches: allowed === origin,
          allowedLength: allowed.length,
          originLength: origin.length,
        })),
      );

      // Check if origin is in allowed list and return it if allowed
      if (allowedOrigins.includes(origin)) {
        console.warn(`CORS: ✓ Allowing origin: ${origin}`);
        return origin;
      }

      // Deny other origins
      console.warn(`CORS: ✗ Denying origin: ${origin}`);
      return '';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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

// Root endpoint - serve demo page with widget
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio Chatbot Demo</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 600px;
      text-align: center;
    }
    h1 {
      color: #333;
      margin-top: 0;
    }
    p {
      color: #333333;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Portfolio Chatbot</h1>
    <p>Chat with an AI assistant about my experience and projects.</p>
    <p>Click the chat bubble in the bottom right corner to start!</p>
  </div>
  <script>
    // Polyfill process global for the widget script
    if (typeof process === 'undefined') {
      window.process = {
        env: {
          NODE_ENV: 'production'
        }
      };
    }
  </script>
  <script src="/widget.js"></script>
</body>
</html>`;

  return c.html(html);
});

console.warn(`Server starting on port ${config.PORT}...`);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
