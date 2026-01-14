# How to Embed the Chatbot Widget

The chatbot widget is now a single-file embed that includes all CSS and JavaScript. Here's how to add it to your portfolio site.

## Quick Start

Add these two lines anywhere in your HTML (preferably before the closing `</body>` tag):

```html
<script>
  window.CHATBOT_API_URL = 'https://your-backend-url.com';
</script>
<script src="https://your-backend-url.com/widget.js"></script>
```

That's it! The chatbot bubble will automatically appear in the bottom-right corner.

## Configuration

### Setting the API URL

The widget needs to know where your backend API is hosted. There are three ways to configure this:

1. **Window Global (Recommended for Production)**:
   ```html
   <script>
     window.CHATBOT_API_URL = 'https://your-backend-url.com';
   </script>
   <script src="https://your-backend-url.com/widget.js"></script>
   ```

2. **Build-time Environment Variable**:
   Set `VITE_API_URL` when building the widget:
   ```bash
   VITE_API_URL=https://your-backend-url.com bun run build:frontend
   ```

3. **Auto-detect (Development Only)**:
   If neither is set, the widget will try to connect to `{protocol}//{hostname}:3000`

### Contact URL

The widget includes a "Contact" button that links to your contact page. This is currently hardcoded to `https://www.aaliyev.com/contact` in `apps/frontend/src/main.tsx`. To change it:

1. Edit `apps/frontend/src/main.tsx`
2. Change the `contactUrl` value
3. Rebuild with `bun run build:frontend`

## Testing Locally

1. Start the backend:
   ```bash
   bun run dev:backend
   ```

2. Visit the test page:
   ```
   http://localhost:3000/test-embed.html
   ```

This shows exactly how the widget will look when embedded on your portfolio site.

## Widget Behavior

- **Auto-initializes**: The widget runs automatically when the script loads
- **No layout impact**: The widget uses fixed positioning and won't affect your page layout
- **Responsive**: Works on mobile and desktop
- **Theme-aware**: Automatically adapts to light/dark mode based on user preferences
- **Self-contained**: All styles are scoped to avoid conflicts with your site's CSS

## Styling

The widget is fully self-contained and shouldn't interfere with your site's styles. All CSS is scoped to `#portfolio-chatbot-root` and its children.

If you need to customize the widget's appearance, you can override the CSS variables:

```html
<style>
  #portfolio-chatbot-root {
    --chatbot-color-primary: #your-brand-color;
    --chatbot-bubble-size: 70px; /* Make bubble larger */
  }
</style>
```

See `apps/frontend/src/styles/variables.css` for all available CSS variables.

## Troubleshooting

### Widget doesn't appear
- Check browser console for errors
- Verify the API URL is correct
- Ensure the backend is running and accessible
- Check that `/api/status` endpoint returns `{"available": true}`

### Widget appears but no CSS styling
- This issue has been fixed! CSS is now injected into the JavaScript bundle
- If you're still seeing this, make sure you're using the latest build
- Check that you're loading `widget.js` and not a cached old version

### CORS errors
- Add your portfolio domain to `ALLOWED_ORIGINS` in your backend `.env` file
- Example: `ALLOWED_ORIGINS=https://aaliyev.com,https://www.aaliyev.com`

## Production Deployment

1. Build the widget:
   ```bash
   bun run build:frontend
   ```

2. Deploy the backend (widget.js is served from `/widget.js`)

3. Add the embed code to your portfolio site with your production API URL

4. Test that everything works!
