# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio Chatbot is a monorepo containing an embeddable AI chatbot widget for aaliyev.com. The architecture is designed for zero-cost hosting using free tiers of various services.

**Key Technologies:**
- Runtime: Bun (required for all commands)
- Backend: Hono framework with Upstash Redis
- AI: OpenAI SDK with gpt-4o-mini (direct integration, not TanStack AI due to Bun compatibility)
- Frontend: React 18+ with Vite (embeddable widget)
- Containerization: Docker with docker-compose for local development and production
- Testing: Vitest + Playwright
- Deployment: Render.com free tier

## Monorepo Structure

This is a Bun workspace monorepo with three main packages:

- `apps/backend/` - Hono API server with OpenAI integration and Redis caching
- `apps/frontend/` - React embeddable widget built with Vite
- `packages/shared/` - Shared TypeScript types used by both frontend and backend

Additionally, a `docker/` directory contains containerization configuration:
- `docker/Dockerfile.backend` - Production backend image (optimized, compiled)
- `docker/Dockerfile.backend-dev` - Development backend (with hot-reload)
- `docker/Dockerfile.frontend` - Widget build artifact container
- `docker/Dockerfile.frontend-dev` - Development frontend server
- `docker/nginx.conf` - Optional Nginx reverse proxy config

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
- `/api/chat` - POST: Chat with AI via Server-Sent Events (SSE)
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

**AI Service** (`services/ai.ts`):
- Integrates with OpenAI API (gpt-4o-mini)
- Streams responses using async generators
- Injects system prompt from `config/prompt.ts`
- Limits responses to 500 tokens for cost control

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

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Backend Core
- ✅ Phase 3: Redis Integration
- ✅ Phase 4: AI Integration & Streaming
- ✅ Phase 5: Frontend Widget
- ✅ Phase 6: Integration
- ✅ Phase 7: Docker Setup
- ✅ Phase 8: Testing
- ✅ Phase 9: CI/CD
- ⏳ Phase 10-11: In Progress

### Phase 4 Implementation Notes

The AI integration uses the **OpenAI SDK directly** instead of TanStack AI due to Bun runtime compatibility issues (TextDecoderStream not available in Bun). The implementation in `routes/chat.ts`:
- Validates requests with Zod schema
- Checks Redis cache before calling OpenAI API
- Streams responses via Server-Sent Events (SSE)
- Enforces monthly usage limits (returns 429 when exceeded)
- Caches successful responses for 7 days
- Increments usage counter after successful completion

### Implemented Phase 8: Testing

Comprehensive testing infrastructure with unit tests, component tests, and E2E tests.

**Configuration Files Created:**
1. `apps/frontend/vitest.config.ts` - Vitest configuration with jsdom environment
2. `apps/frontend/playwright.config.ts` - Playwright E2E test configuration
3. `apps/frontend/src/vitest.setup.ts` - Testing library setup and global mocks
4. Updated `apps/frontend/tsconfig.json` to include test file paths

**Backend Unit Tests** (`apps/backend/tests/`):
1. `usage.test.ts` - Tests for monthly usage tracking, limits, and resets
2. `cache.test.ts` - Tests for question normalization, hashing, and caching logic
3. `ai.test.ts` - Tests for OpenAI SDK integration and streaming
4. `chat.test.ts` - Tests for chat route validation, cache hits/misses, and SSE streaming

**Frontend Unit Tests** (`apps/frontend/tests/`):
1. `useChat.test.ts` - Tests for chat hook SSE parsing, message state, error handling
2. `useChatStatus.test.ts` - Tests for availability status checking and refetching
3. `ChatWindow.test.tsx` - Component tests for form submission, input, error display
4. `Message.test.tsx` - Component tests for user/assistant messages and loading state
5. `App.test.tsx` - Tests for open/close behavior and state management

**E2E Tests** (`apps/frontend/e2e/`):
1. `chat.spec.ts` - Playwright tests for full user journeys (send messages, open/close, scroll, etc.)

**CI/CD** (`.github/workflows/`):
1. `ci.yml` - GitHub Actions workflow with jobs for linting, backend tests, frontend tests, E2E tests, and Docker build

**Testing Philosophy:**
- Test behavior, not implementation
- Focus on critical paths and edge cases
- Use mocks extensively to avoid external API calls
- Backend tests use Bun's native test framework
- Frontend tests use Vitest + React Testing Library
- E2E tests use Playwright against running Docker containers

**Test Coverage:**
- Backend services: usage tracking, caching, AI integration
- Frontend hooks: data fetching, error handling, state management
- Frontend components: rendering, user interactions, accessibility
- E2E: widget initialization, message sending, error handling, scroll behavior

**Running Tests:**
```bash
# All tests
bun test

# Backend tests
bun run test:backend

# Frontend tests
bun run test:frontend

# E2E tests
cd apps/frontend && bun run test:e2e

# Frontend tests with watch mode
cd apps/frontend && bun run test:watch
```

Key areas not yet implemented:
- Deployment configuration (Render.com setup)
- System prompt management
- Production deployment testing

### Implemented Phase 9: CI/CD

Continuous Integration and Continuous Deployment workflows for automated testing and deployment.

**Files Created:**

1. `.github/workflows/ci.yml` - GitHub Actions CI workflow
2. `.github/workflows/deploy.yml` - GitHub Actions deployment workflow

**CI Workflow** (`.github/workflows/ci.yml`):

The CI workflow runs on every push to `main` or `develop` and on all pull requests to `main`. It contains the following jobs:

1. **Lint & Type Check** (`lint-and-typecheck`):
   - Sets up Bun runtime
   - Runs ESLint on all files
   - Type checks backend with TypeScript compiler
   - Type checks frontend with TypeScript compiler
   - Runs on every push and PR

2. **Backend Tests** (`test-backend`):
   - Depends on: lint-and-typecheck
   - Runs Bun test suite for backend
   - Provides test environment variables (OPENAI_API_KEY, UPSTASH_REDIS_URL, etc.)
   - Uploads test results

3. **Frontend Tests** (`test-frontend`):
   - Depends on: lint-and-typecheck
   - Runs Vitest suite for frontend components and hooks
   - Includes React component and hook testing

4. **E2E Tests** (`e2e-tests`):
   - Depends on: test-backend, test-frontend
   - Installs Playwright browsers (chromium)
   - Builds frontend widget with `bun run build:frontend`
   - Starts backend server in background
   - Waits 5 seconds for server initialization
   - Runs Playwright E2E test suite
   - Uploads Playwright HTML report on failure (7-day retention)

5. **Docker Build** (`build`):
   - Depends on: test-backend, test-frontend
   - Sets up Docker Buildx for multi-platform builds
   - Builds backend Docker image with caching
   - Uses GitHub Actions cache layer caching for faster rebuilds
   - Verifies Dockerfile.backend is valid and builds successfully
   - Does NOT push to registry (push happens only on deploy)

**Deploy Workflow** (`.github/workflows/deploy.yml`):

The deploy workflow runs automatically on every push to `main` branch and can be manually triggered via workflow_dispatch.

Configuration:
- Trigger: Push to `main` branch or manual workflow dispatch button
- Action: Uses `johnbeynon/render-deploy-action@v0.0.8`
- Waits for deployment success before completing
- Requires `RENDER_SERVICE_ID` and `RENDER_API_KEY` secrets

**GitHub Secrets Required:**

Before workflows can run, add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret Name | Purpose | Where to Get It |
|-------------|---------|-----------------|
| `OPENAI_API_KEY` | OpenAI API key for tests | https://platform.openai.com/api-keys |
| `OPENAI_API_KEY_TEST` | (Optional) Separate key for tests | Same as above |
| `UPSTASH_REDIS_URL` | Redis REST URL for tests | Upstash Console |
| `UPSTASH_REDIS_TOKEN` | Redis REST Token for tests | Upstash Console |
| `RENDER_SERVICE_ID` | Render service ID for deployments | Render Dashboard (service URL) |
| `RENDER_API_KEY` | Render API key for CI/CD | Render Account Settings |

**Workflow Execution Flow:**

```
Push to main/develop
         ↓
┌─────────────────────────────────┐
│ lint-and-typecheck              │ (runs immediately)
│ ├─ ESLint                       │
│ ├─ TypeScript Backend           │
│ └─ TypeScript Frontend          │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ test-backend                    │ (parallel with frontend tests)
│ ├─ Install deps                 │
│ └─ Run Bun tests               │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ test-frontend                   │
│ ├─ Install deps                 │
│ └─ Run Vitest                  │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ e2e-tests                       │ (parallel with docker build)
│ ├─ Install Playwright           │
│ ├─ Build frontend widget        │
│ ├─ Start backend                │
│ ├─ Wait for server              │
│ ├─ Run Playwright tests         │
│ └─ Upload report on failure     │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ build                           │
│ ├─ Docker setup                 │
│ └─ Build Docker image           │
└─────────────────────────────────┘

If push to main branch:
         ↓
┌─────────────────────────────────┐
│ deploy                          │
│ ├─ Render API call              │
│ ├─ Wait for success             │
│ └─ Notify                       │
└─────────────────────────────────┘
```

**Local Testing of Workflows:**

You can test GitHub Actions workflows locally using `act` (https://github.com/nektos/act):

```bash
# Install act (macOS)
brew install act

# Run CI workflow locally
act -j lint-and-typecheck

# Run all jobs
act

# Run with specific GitHub secrets
act -s OPENAI_API_KEY=sk-test-key
```

**Troubleshooting CI/CD:**

1. **Tests failing locally but passing in CI**: Ensure environment variables match between local and CI
2. **Docker build failing**: Check Dockerfile syntax and ensure base image is accessible
3. **E2E tests timing out**: May need to increase wait time in workflow or improve backend startup time
4. **Playwright report not uploading**: Check that failure condition is properly set (`if: failure()`)
5. **Deploy not triggering**: Verify you're pushing to `main` branch and Render secrets are set correctly

### Implemented Phase 5: Frontend Widget

1. Set up Vite with React
2. Create CSS variables and reset
3. Build ChatBubble component
4. Build ChatWindow component
5. Build Message component
6. Implement useChat hook
7. Configure library build mode

### Phase 6: Integration Implementation Summary

The integration phase connects the frontend widget to the backend API and verifies end-to-end functionality.

**Key Changes:**
1. **CORS Configuration** (apps/backend/src/index.ts):
   - Dynamic CORS origin selection based on NODE_ENV
   - Development: Allows localhost:3000, localhost:5173, 127.0.0.1:3000, 127.0.0.1:5173
   - Production: Uses config.ALLOWED_ORIGINS from environment variables

2. **Frontend API Configuration** (apps/frontend/src/main.tsx):
   - Made window.CHATBOT_API_URL configurable
   - Fallback to `{protocol}//{hostname}:3000` for development
   - Allows widget to work in any environment without code changes

3. **Docker Compose Setup**:
   - `docker-compose.yml` - Development environment with hot-reload for both backend and frontend
   - `docker-compose.prod.yml` - Production-like environment for testing built artifacts
   - `Dockerfile.backend` - Multi-stage build for optimized production backend
   - `Dockerfile.frontend-dev` - Development frontend server with Vite

4. **Verified Functionality**:
   - ✅ Frontend widget builds successfully (146.57 KB gzipped)
   - ✅ Backend serves widget.js endpoint correctly
   - ✅ CORS headers properly configured for cross-origin requests
   - ✅ SSE streaming works end-to-end (/api/chat endpoint)
   - ✅ Status endpoint returns availability correctly (/api/status)
   - ✅ Health check endpoint responsive (/api/health)

**Testing:**
- All endpoints tested and verified to be working
- CORS headers validated for correct origin handling
- SSE streaming confirmed with proper event formatting
- Widget file serving verified with correct MIME types

### Phase 7: Docker Setup Implementation Summary

Docker setup enables portable, containerized deployment of the entire application stack.

**Directory Structure:**
```
docker/
├── Dockerfile.backend      # Multi-stage production backend build
├── Dockerfile.backend-dev  # Development backend with hot-reload
├── Dockerfile.frontend     # Widget build-only container (outputs widget.js)
├── Dockerfile.frontend-dev # Vite dev server for frontend development
└── nginx.conf              # Optional reverse proxy configuration
```

**Dockerfiles Created:**

1. **docker/Dockerfile.backend** (Production):
   - Multi-stage build: compile TypeScript in builder stage, run lean production stage
   - Uses `oven/bun:1-slim` for minimal runtime image
   - Layer optimization: dependencies installed before source code for better caching
   - Includes health check endpoint
   - Runs compiled app with: `bun ./dist/index.js`

2. **docker/Dockerfile.backend-dev** (Development):
   - Full Bun runtime for development with hot-reload
   - Installs dependencies, source mounted via volumes
   - Runs with: `bun --watch apps/backend/src/index.ts`
   - Used by docker-compose.yml for development environment

3. **docker/Dockerfile.frontend** (Build-only):
   - Build-only container that outputs widget.js to scratch image
   - Compiles widget via `bun run build:frontend`
   - Output artifact: widget.js copied to `apps/backend/public/widget.js`
   - Used in CI/CD pipeline to build widget separately

4. **docker/Dockerfile.frontend-dev** (Development):
   - Development-focused, runs Vite dev server
   - Watches source files for hot-reload via volume mounts
   - Exposed on port 5173
   - Runs with: `bun run dev:frontend`

5. **docker/nginx.conf**:
   - Reverse proxy configuration for optional Nginx setup
   - Handles CORS headers, caching, compression, and rate limiting
   - Security headers included
   - SSE streaming support with proxy buffering disabled

**Docker Compose Files:**

1. **docker-compose.yml** (Development):
   - Starts both backend and frontend services
   - Backend mounts source code for live reloading via `bun --watch`
   - Frontend runs Vite dev server with live reload
   - Environment: development with relaxed CORS
   - Services automatically restart on failure

2. **docker-compose.prod.yml** (Production-like):
   - Backend service only (no frontend service)
   - Runs compiled backend from built image
   - Environment: production mode
   - Restart policy: unless-stopped

**Optimization Strategies:**

1. **Build Caching**: Separate dependency installation from source code copying to leverage Docker's layer caching. Unchanged dependencies = faster builds.

2. **Multi-stage Builds**: Builder stage includes compilation tools; production stage only includes runtime (reduces final image size by ~50%).

3. **.dockerignore**: Excludes unnecessary files from build context:
   - Git artifacts, node_modules, build artifacts
   - IDE files, logs, documentation
   - Environment files, CI/CD configs
   - Reduces build context size and improves build speed

4. **Minimal Base Images**: Uses `oven/bun:1-slim` instead of full `oven/bun:1` in production stage.

5. **Layer Cleanup**: Source files removed after compilation in builder stage.

**Building Locally:**

```bash
# Build backend image
docker build -f docker/Dockerfile.backend -t portfolio-chatbot:backend .

# Build frontend widget
docker build -f docker/Dockerfile.frontend -t portfolio-chatbot:frontend .

# Or use docker-compose
docker compose build         # Development
docker compose -f docker-compose.prod.yml build  # Production
```

**Running Locally:**

```bash
# Development (both backend and frontend)
docker compose up

# Production-like testing
docker compose -f docker-compose.prod.yml up

# Detached mode (background)
docker compose up -d

# View logs
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
docker compose logs              # All services
```

**Estimated Image Sizes:**

- Backend production: ~200-250 MB (Bun runtime + dependencies)
- Frontend widget artifact: ~150-200 KB (React app gzipped)
- Development images slightly larger due to dev dependencies

**Volume Mount Configuration:**

The docker-compose.yml uses volume mounts for development:
- Backend: Mounts source code for `bun --watch` hot-reload
  - `./apps/backend/src:/app/apps/backend/src`
  - `./packages/shared:/app/packages/shared`

- Frontend: Mounts source code and config files
  - `./apps/frontend/src:/app/apps/frontend/src`
  - `./apps/frontend/vite.config.ts:/app/apps/frontend/vite.config.ts`
  - `./apps/frontend/tsconfig.json:/app/apps/frontend/tsconfig.json`
  - `./packages/shared:/app/packages/shared`
  - `./tsconfig.base.json:/app/tsconfig.base.json` (critical for TypeScript extends)

**Important Notes:**

1. **Development vs Production**:
   - Development uses `docker-compose.yml` with dev Dockerfiles (hot-reload enabled)
   - Production uses `docker-compose.prod.yml` with production Dockerfile.backend (compiled, optimized)

2. **Known Issues & Fixes Applied**:
   1. **Vite Not Listening on All Interfaces**:
      - Issue: Vite by default listens on localhost only, making it inaccessible from host or other containers
      - Fix: Added `server: { host: '0.0.0.0', port: 5173 }` to vite.config.ts

   2. **Frontend-Backend Communication**:
      - Issue: Frontend was trying to connect to `http://localhost:3000` from inside container, but localhost refers to the container itself
      - Fix: Changed `VITE_API_URL=http://backend:3000` in docker-compose.yml (uses Docker service name for inter-container communication)
      - Fix: Updated main.tsx to use `import.meta.env.VITE_API_URL` environment variable

   3. **Frontend Health Check**:
      - Issue: Vite dev server doesn't respond well to simple HTTP health checks
      - Fix: Removed health check from Dockerfile.frontend-dev

   4. **TypeScript Configuration**:
      - Issue: tsconfig.base.json must be mounted for frontend to resolve extends directive
      - Fix: Added `./tsconfig.base.json:/app/tsconfig.base.json` volume mount

   5. **Dependency Conditions**:
      - Issue: `depends_on: { condition: service_healthy }` causes timeouts with health checks
      - Fix: Use `depends_on: [backend]` (simple dependency without health condition) for development

3. **CI/CD Integration Notes:**
   - Dockerfile.frontend builds widget artifact for CI/CD pipelines
   - Can build widget in isolation: `docker build -f docker/Dockerfile.frontend -t widget-builder .`
   - Extract artifact via Docker COPY from built container

**Development Quick Start:**

```bash
# Start both containers with hot-reload
docker compose up

# Open browser and view application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000

# Rebuild images if needed
docker compose build

# View logs (all services)
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop containers
docker compose down
```

**What You'll See:**

When you open http://localhost:5173 in your browser:
1. Title: "Portfolio Chatbot Widget - Development Mode"
2. Chat bubble in bottom-right corner
3. Click bubble to open chat window
4. Ask questions and chat with the AI-powered chatbot

**Hot-Reload in Action:**

- Edit `apps/frontend/src/` files → Changes appear instantly in browser
- Edit `apps/backend/src/` files → Backend restarts automatically
- No need to rebuild or restart containers

When implementing new phases, follow the patterns established in existing code (service layer, route structure, type safety).
