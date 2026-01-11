# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio Chatbot is a monorepo containing an embeddable AI chatbot widget for aaliyev.com. The architecture is designed for zero-cost hosting using free tiers of various services.

**Key Technologies:**
- Runtime: Bun (required for all commands)
- Backend: Hono framework with Upstash Redis
- AI: TanStack AI with OpenAI (gpt-4o-mini)
- Frontend: React 18+ with Vite (not yet implemented)
- Testing: Vitest + Playwright
- Deployment: Render.com free tier

## Monorepo Structure

This is a Bun workspace monorepo with three main packages:

- `apps/backend/` - Hono API server with OpenAI integration and Redis caching
- `apps/frontend/` - React widget (planned, not yet implemented)
- `packages/shared/` - Shared TypeScript types used by both frontend and backend

The shared types package is imported directly via workspace protocol. Type changes in `packages/shared/src/types.ts` are immediately available to both apps.

## Common Commands

### Development
```bash
# Backend development (auto-restart on changes)
bun run dev:backend

# Frontend development (not yet implemented)
bun run dev:frontend

# Install dependencies
bun install
```

### Building
```bash
# Build both apps
bun run build

# Build backend only
bun run build:backend

# Build frontend only
bun run build:frontend

# Run production backend
bun run start:backend
```

### Testing
```bash
# Run all tests
bun test

# Backend tests only
bun run test:backend

# Frontend tests only
bun run test:frontend

# E2E tests (Playwright)
bun run test:e2e
```

### Type Checking & Linting
```bash
# Type check all packages
bun run typecheck

# Type check backend only
bun run typecheck:backend

# Type check frontend only
bun run typecheck:frontend

# Lint all files
bun run lint

# Lint and auto-fix
bun run lint:fix

# Format all files
bun run format

# Check formatting without changes
bun run format:check
```

## Backend Architecture

### Entry Point & Routing
The backend is a Hono application (`apps/backend/src/index.ts`) with a modular route structure:

- `/api/health` - Health check endpoint
- `/api/status` - Public: Check chatbot availability (respects usage limits)
- `/api/status/usage` - Protected: Get detailed usage statistics
- `/api/status/clear-cache` - Protected: Clear Redis cache
- `/widget.js` - Serves the compiled frontend widget

Protected endpoints require `Authorization: Bearer {ADMIN_SECRET}` header.

### Configuration
All configuration is centralized in `apps/backend/src/config/index.ts` and loaded from environment variables. Required env vars for production:
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`
- `ADMIN_SECRET`

See `.env.example` for all configuration options.

### Services Layer
The backend uses a service-oriented architecture:

**Usage Service** (`services/usage.ts`):
- Tracks monthly conversation count in Redis
- Enforces `MAX_MONTHLY_CONVERSATIONS` limit
- Auto-resets count on first of each month
- Redis keys: `chatbot:usage:count`, `chatbot:usage:reset_at`

**Cache Service** (`services/cache.ts`):
- Caches AI responses by normalized question hash
- Uses Bun.hash() for generating cache keys
- Question normalization: lowercase, trim, remove punctuation, collapse spaces
- 7-day TTL on cached responses
- Redis key pattern: `chatbot:cache:{hash}`

Both services share a single Upstash Redis instance initialized with REST credentials.

## Type System

Shared types are defined in `packages/shared/src/types.ts`:

- `ChatMessage` - User/assistant/system messages
- `ChatRequest` - Client request payload
- `ChatStatusResponse` - Availability status
- `UsageResponse` - Usage stats with limit and reset time
- `ErrorResponse` - Standardized error format

When adding new types, consider if they should be shared or app-specific.

## Code Style

### TypeScript
- Strict mode enabled with additional safety flags (`noUncheckedIndexedAccess`, `noUnusedLocals`, etc.)
- Target ES2022
- Use `bundler` module resolution
- Prefix unused vars with `_` to satisfy linter

### ESLint
- Follows TypeScript recommended rules
- Console statements must use `console.warn()` or `console.error()` (not `console.log()`)
- Unused vars/args starting with `_` are ignored
- React rules enabled for `.tsx` files (React in scope not required)

### Formatting
- Prettier for all files
- Configuration in `.prettierrc`

## Development Notes

### Bun-Specific Features
- Uses `Bun.hash()` for cache key generation (cache.ts:33)
- Uses `Bun.file()` for static file serving (index.ts:35)
- Backend build target is `bun`, not `node`

### Redis Patterns
- All Redis operations use async/await
- Usage tracking requires monthly reset logic
- Cache keys are hashed to handle variable-length questions
- Use `redis.keys()` sparingly (only in admin operations like cache clearing)

### Environment Handling
- Development: Missing env vars allowed for skeleton development
- Production: `NODE_ENV=production` enforces required var validation
- CORS origins are comma-separated in `ALLOWED_ORIGINS`

## Implementation Status

The project follows a phased implementation plan (see `EXECUTION_PLAN.md`):

- ✅ Phase 1
- ✅ Phase 2
- ✅ Phase 3
- ⏳ Phase 4-11: In Progress

Key areas not yet implemented:
- AI chat endpoint with streaming SSE responses
- Frontend React widget
- Docker configuration
- CI/CD workflows
- Playwright E2E tests

When implementing new phases, follow the patterns established in existing code (service layer, route structure, type safety).
