# Portfolio Chatbot

An embeddable AI-powered chatbot widget for aaliyev.com, built with modern web technologies and designed for zero-cost hosting.

## Project Overview

This is a monorepo containing a full-stack chatbot application:

- **Backend**: Bun + Hono API server with OpenAI integration
- **Frontend**: React widget built with Vite
- **Shared**: Common TypeScript types
- **DevOps**: Docker, GitHub Actions, and Render.com deployment

## Tech Stack

- **Runtime**: Bun
- **Backend Framework**: Hono
- **Frontend Framework**: React 18+
- **AI SDK**: TanStack AI with OpenAI (gpt-4o-mini)
- **Storage/Cache**: Upstash Redis (free tier)
- **Styling**: Vanilla CSS with CSS custom properties
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Hosting**: Render.com (free tier)

## Project Structure

```
portfolio-chatbot/
├── apps/
│   ├── backend/          # Hono API server
│   └── frontend/         # React widget
├── packages/
│   └── shared/           # Shared TypeScript types
├── docker/               # Docker configurations
├── .github/workflows/    # CI/CD workflows
└── EXECUTION_PLAN.md     # Detailed implementation plan
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0 or later
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (optional, for containerization)

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables template
cp .env.example .env

# Edit .env and add your API keys
```

### Development

```bash
# Run backend in development mode
bun run dev:backend

# Run frontend in development mode
bun run dev:frontend

# Run linter
bun run lint

# Run formatter
bun run format

# Type check all packages
bun run typecheck
```

### Environment Variables

See `.env.example` for required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `UPSTASH_REDIS_URL`: Upstash Redis REST URL
- `UPSTASH_REDIS_TOKEN`: Upstash Redis REST token
- `SYSTEM_PROMPT`: System prompt for the chatbot
- `MAX_MONTHLY_CONVERSATIONS`: Monthly usage limit (default: 500)
- `ADMIN_SECRET`: Secret for admin endpoints
- `ALLOWED_ORIGINS`: CORS allowed origins

## Implementation Phases

This project is being implemented in phases as outlined in `EXECUTION_PLAN.md`:

- ✅ **Phase 1**: Project Setup (COMPLETED)
- ⏳ **Phase 2**: Backend Core
- ⏳ **Phase 3**: Redis Integration
- ⏳ **Phase 4**: AI Integration
- ⏳ **Phase 5**: Frontend Widget
- ⏳ **Phase 6**: Integration
- ⏳ **Phase 7**: Docker Setup
- ⏳ **Phase 8**: Testing
- ⏳ **Phase 9**: CI/CD
- ⏳ **Phase 10**: Deployment
- ⏳ **Phase 11**: Astro Integration

## Features

- 🎯 Zero-cost hosting using free tiers
- 💬 Real-time streaming responses via SSE
- 🔒 Usage limits to prevent unexpected costs
- ⚡ Response caching with Upstash Redis
- 📦 Embeddable widget (no iframe)
- 🐳 Docker support for portability
- 🔄 CI/CD with GitHub Actions
- 🎨 Light/dark mode support

## Cost Management

- **Hosting**: $0/month (Render.com free tier)
- **Database**: $0/month (Upstash Redis free tier)
- **LLM**: ~$0.25/month (with 500 conversation cap)

## License

MIT

## Author

Abdul Aliyev - [aaliyev.com](https://aaliyev.com)
