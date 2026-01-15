# Embedding the Chatbot Widget

This guide explains how to embed the Portfolio Chatbot widget on your website.

## Quick Start

Add this code snippet to your HTML page, just before the closing `</body>` tag:

```html
<script>
  // Configure the chatbot (required)
  window.CHATBOT_API_TOKEN = 'jEztRHGG4485LLw9tac+JY47Is128lV3XJSqFgaMkFw=';
  window.CHATBOT_TURNSTILE_SITE_KEY = '0x4AAAAAACMrp5qTg-yFVIul';

  // Optional: Customize API URL (defaults to auto-detected)
  // window.CHATBOT_API_URL = 'https://your-backend.onrender.com';
</script>
<script src="https://your-backend.onrender.com/widget.js"></script>
```

Replace:
- `your-backend.onrender.com` with your actual Render.com backend URL
- The `CHATBOT_API_TOKEN` with your API token
- The `CHATBOT_TURNSTILE_SITE_KEY` with your Cloudflare Turnstile site key

## Configuration Options

### Required Configuration

**`window.CHATBOT_API_TOKEN`** (required)
- The API token that matches your backend configuration
- Must be set before loading `widget.js`
- Example: `'jEztRHGG4485LLw9tac+JY47Is128lV3XJSqFgaMkFw='`

**`window.CHATBOT_TURNSTILE_SITE_KEY`** (required)
- Your Cloudflare Turnstile site key (public key)
- Get this from: https://dash.cloudflare.com/ → Turnstile
- Example: `'0x4AAAAAACMrp5qTg-yFVIul'`

### Optional Configuration

**`window.CHATBOT_API_URL`** (optional)
- Override the backend API URL
- Defaults to `{protocol}//{hostname}:3000`
- Example: `'https://portfolio-chatbot.onrender.com'`

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Portfolio</title>
</head>
<body>
  <!-- Your page content -->
  <h1>Welcome to My Portfolio</h1>
  <p>Check out my projects below...</p>

  <!-- Chatbot widget configuration and loader -->
  <script>
    // Configure chatbot security credentials
    window.CHATBOT_API_TOKEN = 'jEztRHGG4485LLw9tac+JY47Is128lV3XJSqFgaMkFw=';
    window.CHATBOT_TURNSTILE_SITE_KEY = '0x4AAAAAACMrp5qTg-yFVIul';

    // Optional: Override API URL if backend is on different domain
    // window.CHATBOT_API_URL = 'https://portfolio-chatbot.onrender.com';
  </script>

  <!-- Load the widget -->
  <script src="https://portfolio-chatbot.onrender.com/widget.js"></script>
</body>
</html>
```

## For Render.com Deployment

### Backend Environment Variables

Set these in your Render.com service dashboard under **Environment**:

```bash
# Required
API_TOKEN=jEztRHGG4485LLw9tac+JY47Is128lV3XJSqFgaMkFw=
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
TURNSTILE_SITE_KEY=0x4AAAAAACMrp5qTg-yFVIul

# Optional (for demo page)
OPENAI_API_KEY=your-openai-api-key
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
ADMIN_SECRET=your-admin-secret
ALLOWED_ORIGINS=https://aaliyev.com,https://www.aaliyev.com
```

### Important Notes

1. **No frontend build variables needed**: The API token and Turnstile site key are now configured at **runtime** via `window` variables, not at build time. This means you don't need to set `VITE_*` variables on Render.com.

2. **Widget.js is portable**: Once built, `widget.js` works on any domain. Just configure it with the right credentials when embedding.

3. **Security**: While the API token is visible in your HTML, security comes from the combination of:
   - API token (prevents casual abuse)
   - Cloudflare Turnstile (validates real users)
   - CORS (prevents unauthorized domains)
   - Rate limiting (prevents abuse)

## Embedding on aaliyev.com

Based on your current setup, add this snippet to your `aaliyev.com` website:

```html
<!-- Before closing </body> tag -->
<script>
  window.CHATBOT_API_TOKEN = 'jEztRHGG4485LLw9tac+JY47Is128lV3XJSqFgaMkFw=';
  window.CHATBOT_TURNSTILE_SITE_KEY = '0x4AAAAAACMrp5qTg-yFVIul';
</script>
<script src="https://your-render-app.onrender.com/widget.js"></script>
```

## Testing the Widget

### 1. Test Locally

```bash
# Build the widget
bun run build:frontend

# Start the backend
bun run dev:backend

# Open browser to http://localhost:3000
# You should see the demo page with working chat
```

### 2. Test on Production

After deploying to Render.com:

1. Visit `https://your-render-app.onrender.com/`
2. Click the chat bubble
3. Send a test message
4. Verify bot responds

### 3. Test on Your Website

1. Add the embed code to your website
2. Deploy your website
3. Open browser developer tools (F12)
4. Check for errors in Console tab
5. Verify chat works

## Troubleshooting

### Widget doesn't appear

**Check 1: Script loaded?**
```javascript
// Open browser console (F12) and check:
console.log(window.CHATBOT_API_TOKEN);
console.log(window.CHATBOT_TURNSTILE_SITE_KEY);
// Should show your credentials, not undefined
```

**Check 2: CORS errors?**
- Ensure your domain is in `ALLOWED_ORIGINS` on backend
- Check browser console for CORS errors

### "Missing API token" error

**Cause**: `window.CHATBOT_API_TOKEN` not set before loading widget.

**Solution**: Ensure the configuration script runs **before** loading `widget.js`:
```html
<!-- CORRECT -->
<script>
  window.CHATBOT_API_TOKEN = 'your-token';
</script>
<script src="widget.js"></script>

<!-- WRONG - token set after widget loads -->
<script src="widget.js"></script>
<script>
  window.CHATBOT_API_TOKEN = 'your-token';
</script>
```

### "Turnstile verification failed" error

**Cause**: Incorrect Turnstile site key or domain not whitelisted.

**Solution**:
1. Verify `CHATBOT_TURNSTILE_SITE_KEY` matches Cloudflare dashboard
2. Check domain is whitelisted in Turnstile settings
3. Ensure backend `TURNSTILE_SECRET_KEY` is correct

### Widget works locally but not in production

**Cause**: CORS configuration issue.

**Solution**: Add your production domain to `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=https://aaliyev.com,https://www.aaliyev.com
```

## Widget Customization

The widget comes with default styling, but you can customize it using CSS:

```html
<style>
  /* Override widget styles if needed */
  #portfolio-chatbot-host {
    /* Position adjustments */
  }
</style>
```

The widget uses Shadow DOM for style isolation, so global styles won't affect it.

## Performance Considerations

The widget:
- Loads asynchronously (doesn't block page render)
- ~150KB gzipped
- Lazy-loads Cloudflare Turnstile script
- Only activates when user opens chat

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13.4+)
- IE11: ❌ Not supported (uses ES2020 features)

## Next Steps

1. Deploy your backend to Render.com
2. Add the embed code to aaliyev.com
3. Test end-to-end
4. Monitor usage via backend logs

For questions or issues, check `SECURITY.md` for detailed security documentation.
