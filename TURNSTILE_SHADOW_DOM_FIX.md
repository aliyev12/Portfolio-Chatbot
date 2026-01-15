# Turnstile + Shadow DOM Fix

## Problem

Cloudflare Turnstile was failing with the error:
```
Cannot read properties of undefined (reading 'toLowerCase')
```

This happened because **Turnstile cannot render inside Shadow DOM**. The widget uses Shadow DOM for style isolation, but Turnstile's script needs direct access to the main document DOM tree.

## Root Cause

When Turnstile tries to traverse the DOM to generate a unique identifier for the widget container, it encounters the Shadow DOM boundary and fails. The error occurs in Turnstile's internal code:

```javascript
var v = _t(r.tagName.toLowerCase())  // r is undefined when crossing Shadow DOM boundary
```

## Solution

Move Turnstile rendering **outside the Shadow DOM** while keeping the React app inside it.

### Architecture

```
Document (main DOM)
├── <div id="portfolio-chatbot-turnstile"> ← Turnstile renders here (outside Shadow DOM)
│   └── [Turnstile iframe]
│
└── <div id="portfolio-chatbot-host">     ← React app lives here (inside Shadow DOM)
    └── #shadow-root
        └── <App />
            └── <ChatWindow />
```

### Implementation Details

1. **Turnstile Initialization** (`apps/frontend/src/main.tsx`):
   - Created `initTurnstile()` function that runs **before** the Shadow DOM is created
   - Container is appended directly to `document.body` (main DOM)
   - Widget renders as invisible CAPTCHA with no UI

2. **Token Management**:
   - Token stored in module-level variable: `let turnstileToken = ''`
   - Exported via `getTurnstileToken()` function
   - Token updated automatically via Turnstile's callback

3. **React Integration** (`apps/frontend/src/hooks/useChat.ts`):
   - `useChat` hook imports `getTurnstileToken()` from `main.tsx`
   - Token retrieved fresh on every API call
   - No props needed - token accessed globally

4. **Removed Components**:
   - Deleted `<Turnstile>` component from `ChatWindow.tsx`
   - Removed `turnstileToken` state management from React components

### Code Flow

```
1. Page loads → main.tsx runs
2. loadTurnstileScript() → Loads Cloudflare script
3. initTurnstile() → Renders widget in main DOM
4. User opens chat → React app renders in Shadow DOM
5. User sends message → useChat calls getTurnstileToken()
6. getTurnstileToken() returns current token → API request succeeds
```

## Testing

### Verify Turnstile Works

1. **Build and start**:
   ```bash
   bun run build
   bun run start:backend
   ```

2. **Open browser console**:
   - You should see: `✓ Turnstile token obtained`
   - Check DOM: `document.getElementById('portfolio-chatbot-turnstile')` should exist

3. **Send a chat message**:
   - Should succeed without "Missing Turnstile token" error
   - Check Network tab: `X-Turnstile-Token` header should be present

### Debug Checklist

If Turnstile still doesn't work:

- [ ] Verify `TURNSTILE_SITE_KEY` is set correctly in backend `.env`
- [ ] Check `window.CHATBOT_TURNSTILE_SITE_KEY` is set in HTML before widget loads
- [ ] Look for errors in browser console
- [ ] Verify domain is whitelisted in Cloudflare Turnstile dashboard
- [ ] Check that Turnstile container exists: `document.getElementById('portfolio-chatbot-turnstile')`

## Benefits

1. **No DOM conflicts**: Turnstile works in main DOM, React in Shadow DOM
2. **Cleaner code**: No complex prop drilling for token
3. **Better separation**: Security layer (Turnstile) separate from UI layer (React)
4. **Performance**: Single Turnstile instance shared across widget lifecycle

## Trade-offs

**Pros**:
- Turnstile works correctly
- Simpler state management
- Widget remains portable

**Cons**:
- Global variable for token (acceptable for this use case)
- Turnstile container in main DOM (but hidden and doesn't affect page layout)

## Future Improvements

1. **Cleanup**: Add widget cleanup when user closes chat or navigates away
2. **Retry logic**: Automatically retry Turnstile verification on failure
3. **Token refresh**: Implement automatic token refresh before expiry
4. **Error handling**: Show user-friendly error if Turnstile fails to load

## Related Files

- `apps/frontend/src/main.tsx` - Turnstile initialization
- `apps/frontend/src/hooks/useChat.ts` - Token retrieval
- `apps/frontend/src/components/ChatWindow/ChatWindow.tsx` - Removed Turnstile component

## References

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Shadow DOM Spec](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [GitHub Issue: Turnstile in Shadow DOM](https://github.com/cloudflare/turnstile-demo/issues)
