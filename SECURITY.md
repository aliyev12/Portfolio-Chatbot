# Security Implementation

This document describes the multi-layered security implementation for the Portfolio Chatbot to protect against bot abuse and unauthorized access.

## Overview

The chatbot uses a **defense-in-depth** approach with 4 security layers:

1. **API Token Authentication** - Prevents casual API abuse
2. **Cloudflare Turnstile** - Validates requests are from real humans, not bots
3. **CORS Protection** - Prevents embedding on unauthorized domains
4. **Rate Limiting** - Prevents abuse even if other layers are compromised

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User interacts with widget
       │ 2. Turnstile validates user is human
       │ 3. Request sent with API token + Turnstile token
       ▼
┌─────────────────────────┐
│   Backend Middleware    │
├─────────────────────────┤
│ 1. Rate Limiting        │ ← Check IP-based request limits
│ 2. API Token Auth       │ ← Validate X-API-Token header
│ 3. Turnstile Verify     │ ← Verify X-Turnstile-Token with Cloudflare
└─────────┬───────────────┘
          │ All checks passed
          ▼
    ┌─────────────┐
    │  Chat API   │
    └─────────────┘
```

## Setup Instructions

### 1. Generate API Token

Generate a secure random API token for your backend:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the generated token - you'll need it for both backend and frontend.

### 2. Set Up Cloudflare Turnstile

1. **Sign up for Cloudflare** (free): https://dash.cloudflare.com/sign-up

2. **Create a Turnstile Site**:
   - Go to https://dash.cloudflare.com/ → **Turnstile**
   - Click **Add Site**
   - **Site name**: Portfolio Chatbot
   - **Domain**: Your website domain (e.g., `aaliyev.com`)
   - **Widget Mode**: Select **Invisible**
   - Click **Create**

3. **Copy your keys**:
   - **Site Key** (public) - Used in frontend
   - **Secret Key** (private) - Used in backend

### 3. Configure Backend Environment

Update your backend `.env` file (or Render.com environment variables):

```bash
# Required: API Token (must match frontend)
API_TOKEN=your-generated-api-token-here

# Required: Turnstile Secret Key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key-here

# Optional: Rate limiting configuration
RATE_LIMIT_REQUESTS=10           # Requests per window
RATE_LIMIT_WINDOW_MS=60000       # 60 seconds (1 minute)
```

### 4. Configure Frontend Environment

Create or update `apps/frontend/.env`:

```bash
# Must match backend API_TOKEN
VITE_API_TOKEN=your-generated-api-token-here

# Turnstile Site Key (public key from Cloudflare)
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key-here

# Optional: API URL (defaults to current host:3000)
VITE_API_URL=http://localhost:3000
```

### 5. Build and Deploy

```bash
# Install dependencies
bun install

# Build both frontend and backend
bun run build

# Run in production
bun run start:backend
```

The widget will automatically:
- Load Cloudflare Turnstile script
- Obtain a Turnstile token when user opens chat
- Send API token + Turnstile token with every chat request

## Security Features Explained

### 1. API Token Authentication

**Purpose**: Prevent casual API abuse from curl, Postman, or unauthorized scripts.

**Implementation**:
- Frontend sends `X-API-Token` header with every request
- Backend validates token matches `API_TOKEN` environment variable
- Returns `401 Unauthorized` if token is missing or invalid

**Limitation**: Token is visible in client-side JavaScript bundle. This is acceptable because:
- Combined with other layers (Turnstile, CORS, rate limiting)
- Primary goal is defense-in-depth, not perfect secrecy
- Even if extracted, attacker still needs to bypass Turnstile

### 2. Cloudflare Turnstile

**Purpose**: Validate requests are from real humans, not automated bots.

**How it works**:
- Invisible CAPTCHA widget embedded in chat window
- Automatically validates user in background (no puzzles)
- Issues short-lived tokens that backend verifies with Cloudflare
- Tokens expire and must be refreshed

**Implementation**:
- Frontend: Renders `<Turnstile>` component with site key
- Component obtains token automatically
- Token sent via `X-Turnstile-Token` header
- Backend verifies token with Cloudflare API at `challenges.cloudflare.com/turnstile/v0/siteverify`

**Error handling**:
- Development: Skipped if no secret key configured
- Production: Required - returns `403 Forbidden` if verification fails

### 3. CORS Protection

**Purpose**: Prevent unauthorized websites from embedding your chatbot.

**Implementation**:
- Backend configured with `ALLOWED_ORIGINS` environment variable
- Only listed domains can make requests to the API
- Browsers enforce same-origin policy

**Configuration**:
```bash
# Production
ALLOWED_ORIGINS=https://aaliyev.com,https://www.aaliyev.com

# Development (automatically includes localhost)
NODE_ENV=development
```

### 4. Rate Limiting

**Purpose**: Prevent abuse even if API token is compromised.

**Implementation**:
- Uses Redis to track request counts per IP address
- Sliding window algorithm
- Default: 10 requests per minute per IP
- Returns `429 Too Many Requests` when limit exceeded

**Configuration**:
```bash
RATE_LIMIT_REQUESTS=10           # Max requests per window
RATE_LIMIT_WINDOW_MS=60000       # Window duration in milliseconds
```

**IP Detection** (in order of precedence):
1. `CF-Connecting-IP` header (Cloudflare)
2. `X-Forwarded-For` header (proxies)
3. `X-Real-IP` header
4. Fallback to `'unknown'` (still rate-limited)

## Testing Security

### Test API Token Protection

```bash
# Without token (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'

# Response: {"error":"Missing API token","code":"MISSING_API_TOKEN"}

# With invalid token (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Token: wrong-token" \
  -d '{"message":"Hello"}'

# Response: {"error":"Invalid API token","code":"INVALID_API_TOKEN"}
```

### Test Turnstile Protection

```bash
# Without Turnstile token (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Token: your-api-token" \
  -d '{"message":"Hello"}'

# Response: {"error":"Missing Turnstile token","code":"MISSING_TURNSTILE_TOKEN"}
```

### Test Rate Limiting

```bash
# Send 11 requests rapidly (11th should fail)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "X-API-Token: your-api-token" \
    -H "X-Turnstile-Token: valid-token" \
    -d "{\"message\":\"Test $i\"}"
  echo ""
done

# 11th response: {"error":"Rate limit exceeded","code":"RATE_LIMIT_EXCEEDED"}
```

## Monitoring and Logs

The security middleware logs all authentication failures for monitoring:

```bash
# Watch backend logs
bun run dev:backend

# You'll see:
# - CORS denials
# - Invalid API token attempts
# - Turnstile verification failures
# - Rate limit violations
```

## Production Deployment

### Render.com Configuration

1. **Set Environment Variables**:
   - Go to Render.com Dashboard → Your Service → Environment
   - Add all required variables from `.env.example`
   - Ensure `API_TOKEN` and `TURNSTILE_SECRET_KEY` are set

2. **Build Command**:
   ```bash
   bun install && bun run build:backend
   ```

3. **Start Command**:
   ```bash
   bun run start:backend
   ```

### Widget Deployment

The widget is served from the backend at `/widget.js`. To embed on your website:

```html
<!-- Set environment variables before loading widget -->
<script>
  window.CHATBOT_API_URL = 'https://your-backend.onrender.com';
</script>
<script src="https://your-backend.onrender.com/widget.js"></script>
```

The API token and Turnstile site key are bundled into `widget.js` at build time.

## Security Best Practices

1. **Never commit tokens to git**:
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate API token periodically**:
   - Generate new token
   - Update both backend and frontend
   - Rebuild and redeploy

3. **Monitor rate limit violations**:
   - Set up alerts for excessive `429` responses
   - Investigate repeated violations from same IPs

4. **Keep Turnstile secret key secure**:
   - Never expose in client-side code
   - Only use in backend environment variables

5. **Use HTTPS in production**:
   - Prevents token interception
   - Cloudflare provides free SSL/TLS

6. **Review CORS origins**:
   - Only whitelist domains you control
   - Remove development origins in production

## Troubleshooting

### "Missing API token" error

**Cause**: Frontend environment variable not set or widget not rebuilt after adding token.

**Solution**:
```bash
# Add to apps/frontend/.env
VITE_API_TOKEN=your-api-token

# Rebuild frontend
bun run build:frontend
```

### "Turnstile verification failed" error

**Cause**: Invalid secret key or domain mismatch.

**Solution**:
1. Verify `TURNSTILE_SECRET_KEY` matches Cloudflare dashboard
2. Check domain is whitelisted in Turnstile settings
3. Ensure you're using the correct site key in frontend

### Rate limit triggered too quickly

**Cause**: `RATE_LIMIT_REQUESTS` is too low.

**Solution**:
```bash
# Increase limit or window duration
RATE_LIMIT_REQUESTS=20
RATE_LIMIT_WINDOW_MS=120000  # 2 minutes
```

### CORS errors

**Cause**: Frontend domain not in `ALLOWED_ORIGINS`.

**Solution**:
```bash
# Add your domain
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## Additional Resources

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Rate Limiting Best Practices](https://upstash.com/docs/redis/features/ratelimiting)

## Support

For issues or questions about security implementation:
- File an issue in the GitHub repository
- Review backend logs for detailed error messages
- Check Cloudflare Turnstile dashboard for verification statistics
