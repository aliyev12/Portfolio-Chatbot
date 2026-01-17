# OpenAI Tracing & Conversation Analytics

This document explains how to access and analyze user conversations tracked in the OpenAI Platform dashboard.

## Overview

The Portfolio Chatbot now stores all conversations in OpenAI's platform for 30 days, allowing you to:
- View full conversation history for each user session
- Analyze chat patterns and common questions
- Debug issues with specific interactions
- Track API usage and costs
- Filter conversations by session ID and metadata

## How It Works

### Implementation Details

The chatbot uses the following OpenAI API parameters to enable tracing:

```typescript
const stream = await openai.chat.completions.create({
  // ... other parameters
  store: true,                    // Enable 30-day storage
  user: sessionId,                // Track by session ID
  metadata: {                     // Additional tracking data
    session_id: sessionId,
    app_name: 'portfolio-chatbot',
    timestamp: new Date().toISOString(),
  },
});
```

**Key Parameters:**

- `store: true` - Enables conversation storage in OpenAI dashboard for 30 days
- `user: sessionId` - Shows as "End User" in the dashboard for filtering
- `metadata` - Custom key-value pairs (max 16) for additional tracking

### Data Stored

For each chat request, OpenAI stores:
- Complete conversation messages (user input + AI responses)
- Session ID (as "End User")
- Metadata (session_id, app_name, timestamp)
- Model used (gpt-4o-mini)
- Token usage and costs
- Tool calls (contact_me, visit_linkedin)
- Response timestamps

## Accessing Traces in OpenAI Dashboard

### Step 1: Log in to OpenAI Platform

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in with your OpenAI account (the same account that owns the API key)

### Step 2: Navigate to Usage & Logs

1. Click on **"Dashboard"** in the left sidebar
2. Select **"Usage"** from the dropdown menu
3. Click on the **"Logs"** tab at the top

   **URL**: [https://platform.openai.com/usage/logs](https://platform.openai.com/usage/logs)

### Step 3: View Stored Completions

In the Logs page, you'll see:
- List of all API requests (chat completions)
- Timestamp of each request
- Model used
- Token usage (input/output)
- Cost per request
- Request ID

### Step 4: Filter by Session

To find conversations for a specific user session:

1. Click the **"Filters"** button (top right)
2. Select **"End User"** filter
3. Enter the session ID you want to analyze
4. Click **"Apply"**

### Step 5: View Conversation Details

To see the full conversation for a specific request:

1. Click on any row in the logs table
2. A side panel will open showing:
   - Full request details (messages, system prompt, parameters)
   - Complete response (AI output, tool calls)
   - Metadata (session_id, app_name, timestamp)
   - Performance metrics (latency, tokens)
   - Cost breakdown

### Step 6: Filter by Metadata

To filter conversations by metadata:

1. Use the **"Filters"** button
2. Look for **"Metadata"** filter option
3. Filter by:
   - `session_id` - Specific session
   - `app_name` - Should be "portfolio-chatbot"
   - `timestamp` - Time range

### Step 7: Analyze Patterns

The dashboard allows you to:
- **Group by time**: View conversation volume by hour/day/month
- **Track costs**: Monitor spending per session or time period
- **Identify popular questions**: Manually review frequent topics
- **Debug issues**: Find sessions where errors occurred

## Alternative: Access via API

You can also retrieve stored completions programmatically:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// List stored completions (filtered by metadata)
const completions = await openai.chat.completions.list({
  limit: 100,
  metadata: {
    app_name: 'portfolio-chatbot',
  },
});

// Get specific completion by ID
const completion = await openai.chat.completions.retrieve('comp_xxx');
```

## Accessing Traces Dashboard (Agents SDK)

If you later migrate to the OpenAI Agents SDK, you can access the Traces dashboard:

1. Go to [https://platform.openai.com/traces](https://platform.openai.com/traces)
2. View traces organized by workflows
3. Group traces by `group_id` for multi-turn conversations

Note: The current implementation uses the standard OpenAI SDK, so traces appear in the **Logs** section, not the **Traces** section.

## Data Retention

- **Storage Duration**: 30 days by default
- **Zero Data Retention**: If your organization has ZDR enabled, tracing will be unavailable
- **Disable Storage**: Set `store: false` to prevent storage for specific requests

## Privacy Considerations

Since conversations are stored in OpenAI's platform:

1. **User Anonymity**: Session IDs are UUIDs, not personally identifiable
2. **Sensitive Data**: Users may share personal information in chats - review OpenAI's data policy
3. **Compliance**: Ensure this aligns with your privacy policy and user consent
4. **Disable if Needed**: Set `store: false` for sensitive deployments

## Troubleshooting

### Conversations Not Appearing

- **Wait Time**: Allow 1-2 minutes for logs to appear after a request
- **Store Parameter**: Verify `store: true` is set in the API call
- **Date Range**: Check the date filter in the dashboard (default: last 7 days)
- **API Key**: Ensure you're logged in with the account that owns the API key

### Missing Metadata

- **Metadata Requirement**: Only works with `store: true`
- **Limit**: Maximum 16 key-value pairs per request
- **Format**: Values must be strings, numbers, or booleans

### Cannot Filter by Session

- Ensure the `user` parameter is set correctly in the API call
- Session IDs must be non-empty strings
- Use the exact session ID (case-sensitive)

## Example Workflow: Analyzing User Feedback

1. User reports an issue with the chatbot
2. User provides their session ID (visible in browser console or support ticket)
3. Go to OpenAI Platform > Usage > Logs
4. Filter by "End User" = session ID
5. Review all requests in that session
6. Check for errors, unexpected responses, or tool call issues
7. Identify the root cause and fix

## Cost Tracking

Each log entry shows:
- Input tokens
- Output tokens
- Total cost in USD

Use this to:
- Monitor daily/weekly spending
- Identify expensive sessions (long conversations)
- Optimize system prompts to reduce token usage

## Related Resources

- [OpenAI Platform Dashboard](https://platform.openai.com/usage/logs)
- [Conversation State Documentation](https://platform.openai.com/docs/guides/conversation-state)
- [Chat Completions API Reference](https://platform.openai.com/docs/api-reference/chat)
- [Stored Completions Guide](https://platform.openai.com/docs/guides/migrate-to-responses)

---

**Last Updated**: January 2026
**Implementation**: apps/backend/src/services/ai.ts (lines 89-98)
