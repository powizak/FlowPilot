# FlowPilot

Self-hosted ERP/PM system combining project management, time tracking, Czech-compliant invoicing, and AI integration. Built as a TypeScript monorepo targeting Synology NAS Docker deployment.

## Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Backend        | NestJS, Prisma, PostgreSQL 16                |
| Frontend       | React 19, Vite, Tailwind CSS v4              |
| Monorepo       | pnpm workspaces, Turborepo                   |
| Infrastructure | Docker Compose, Caddy, Redis, MinIO, MailHog |
| Testing        | Vitest, Playwright                           |
| Language       | TypeScript 5.9, Node 22                      |

## Features

### Project Management

- Projects with Kanban board, list, and calendar views
- Task management with subtasks, labels, priorities, due dates
- Saved custom views and filters
- Drag-and-drop task reordering
- Activity feed and comment threads with @mentions

### Time Tracking

- Start/stop timer and manual entry
- Work type categorization
- Weekly timesheet view
- Billable/non-billable tracking

### Invoicing (Czech-compliant)

- PDF invoice generation (PDFKit)
- SPAYD QR codes for Czech bank payments
- Client and product management
- Bank account management
- Sequential invoice numbering
- Multi-currency support

### AI Integration

- AI chat panel for task assistance
- OpenAI-powered suggestions
- MCP (Model Context Protocol) server for external AI tool access

### Automations & Integrations

- Rule-based automations (triggers + actions)
- Webhook system (incoming/outgoing)
- Google Calendar sync
- Email notifications

### Reports & Analytics

- Project and time reports with charts
- Filterable dashboards
- Export capabilities

### Platform

- i18n: Czech and English
- Role-based access: admin / member / viewer
- Dark theme, keyboard-first UI
- Mobile-responsive with bottom navigation
- Full-text search across projects, tasks, clients
- User-configurable settings

## Project Structure

```
FlowPilot/
├── apps/
│   ├── api/              # NestJS backend (25+ modules)
│   │   └── src/
│   │       ├── auth/           # JWT authentication
│   │       ├── projects/       # Project CRUD + views
│   │       ├── tasks/          # Task management
│   │       ├── time-entries/   # Time tracking
│   │       ├── invoices/       # PDF generation + SPAYD
│   │       ├── clients/        # Client management
│   │       ├── ai/             # OpenAI integration
│   │       ├── mcp/            # MCP server
│   │       ├── automations/    # Rule engine
│   │       ├── webhooks/       # Webhook system
│   │       ├── calendar-sync/  # Google Calendar
│   │       ├── reports/        # Analytics
│   │       ├── search/         # Full-text search
│   │       ├── notifications/  # Email + in-app
│   │       ├── attachments/    # File uploads (MinIO)
│   │       └── ...
│   └── web/              # React + Vite frontend
│       ├── src/
│       │   ├── features/       # Feature modules (12)
│       │   ├── pages/          # Route pages
│       │   ├── components/     # Shared UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── stores/         # State management
│       │   └── lib/            # Utilities
│       └── e2e/          # Playwright E2E tests (10 specs)
├── packages/
│   └── shared/           # Shared types and utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── docker-compose.yml    # Full stack orchestration
├── Caddyfile             # Reverse proxy config
├── DEPLOYMENT.md         # Synology NAS deployment guide
└── turbo.json            # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 16
- Redis 7

### Development Setup

```bash
git clone https://github.com/powizak/FlowPilot.git
cd FlowPilot

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your local database credentials

# Run database migrations
npx prisma migrate dev

# Start development servers
pnpm dev
```

The API runs on `http://localhost:3001` and the web app on `http://localhost:5173`.

### Docker Deployment

```bash
cp .env.example .env    # Edit with production values
docker compose up -d
```

The app is available at `http://localhost:3000` via Caddy reverse proxy.

For Synology NAS deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

For Synology Container Manager, use the dedicated `docker-compose.yaml` stack:

```bash
docker compose -f docker-compose.yaml up -d --build
```

## Environment Variables

| Variable              | Description                      | Default                                                    |
| --------------------- | -------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string     | `postgresql://flowpilot:flowpilot@postgres:5432/flowpilot` |
| `REDIS_URL`           | Redis connection string          | `redis://redis:6379`                                       |
| `JWT_SECRET`          | Secret for JWT signing           | (required)                                                 |
| `PORT`                | API server port                  | `3001`                                                     |
| `MINIO_ENDPOINT`      | MinIO object storage URL         | `http://minio:9000`                                        |
| `MINIO_ROOT_USER`     | MinIO access key                 | `flowpilot`                                                |
| `MINIO_ROOT_PASSWORD` | MinIO secret key                 | (required)                                                 |
| `SMTP_HOST`           | SMTP server host                 | `mailhog`                                                  |
| `SMTP_PORT`           | SMTP server port                 | `1025`                                                     |
| `OPENAI_API_KEY`      | OpenAI API key (for AI features) | (optional)                                                 |

## API Overview

All endpoints are prefixed with `/api`. Authentication uses JWT bearer tokens.

| Endpoint                  | Description         |
| ------------------------- | ------------------- |
| `POST /api/auth/register` | User registration   |
| `POST /api/auth/login`    | Login, returns JWT  |
| `GET /api/projects`       | List projects       |
| `GET /api/tasks`          | List/filter tasks   |
| `GET /api/time-entries`   | Time entries        |
| `GET /api/invoices`       | Invoices            |
| `GET /api/clients`        | Clients             |
| `GET /api/reports/*`      | Reports & analytics |
| `POST /api/ai/chat`       | AI chat             |
| `GET /api/search`         | Full-text search    |
| `GET /api/health`         | Health check        |

## Docker Services

| Service  | Image              | Port            | Purpose                           |
| -------- | ------------------ | --------------- | --------------------------------- |
| app      | Custom (NestJS)    | 3001 (internal) | API server                        |
| web      | Custom (React)     | 80 (internal)   | Frontend                          |
| caddy    | caddy:2-alpine     | **3000**        | Reverse proxy (only exposed port) |
| postgres | postgres:16-alpine | 5432 (internal) | Database                          |
| redis    | redis:7-alpine     | 6379 (internal) | Cache & queues                    |
| minio    | minio/minio        | 9000 (internal) | File storage                      |
| mailhog  | mailhog/mailhog    | 1025, 8025      | Dev email                         |

Total memory footprint: ~1.25 GB.

## Scripts

```bash
pnpm dev        # Start all services in development
pnpm build      # Build all packages
pnpm lint       # Lint all packages
pnpm test       # Run all tests
pnpm format     # Check formatting
```

## License

Private. All rights reserved.
