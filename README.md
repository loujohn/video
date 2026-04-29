# Drama Studio — AI 短剧创作管理平台

AI-powered short drama creation and management platform. Manage projects, characters, scenes, scripts, storyboards, and multimedia assets in a unified workspace.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Nuxt 3](https://nuxt.com/) (Vue 3 + TypeScript) |
| UI | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix Vue](https://reka-ui.com/) |
| Database | PostgreSQL 16 + [Knex.js](https://knexjs.org/) (migrations & seeds) |
| Auth | JWT (via `jose`) + bcrypt |
| Rich Text | [TipTap](https://tiptap.dev/) (ProseMirror-based editor) |
| Validation | [Zod](https://zod.dev/) |
| Testing | [Vitest](https://vitest.dev/) |
| Container | Docker Compose (PostgreSQL + App) |

## Features

- **User Management** — Registration, login, JWT authentication, role-based access control
- **Project Management** — Create and manage drama projects with genre, tone, audience, and language settings
- **Creative Planning** — Collaborative creative concept development with version history
- **Character System** — Character profiles, identity arcs, villain levels, and relationship mapping
- **Scene & Prop Management** — Scene catalog with location/time metadata, prop tracking with variants
- **Episode & Script Writing** — Episode planning with act structure, rich-text script editor with versioning
- **Storyboard Creation** — Shot-by-shot storyboards with camera angles, transitions, and duration
- **Asset Management** — Upload and organize images, audio, and video files with entity linking
- **Notifications & Comments** — Real-time notification system and collaborative commenting
- **Admin Panel** — Administrative dashboard for platform management
- **Team Collaboration** — Team-based project access and sharing

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker for containerized setup)

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Database

```bash
# Option A: Docker (recommended)
npm run docker:db

# Option B: Local PostgreSQL
# Ensure PostgreSQL is running and update DATABASE_URL in .env
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Docker Deployment

Full stack deployment with PostgreSQL and the application:

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Rebuild the app image
npm run docker:build
```

Production app is accessible at `http://localhost:3001`.

## Database Management

```bash
# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Check migration status
npm run db:status
```

Migration files are located in `migrations/`. Seeds are in `seeds/`.

## Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
├── app/                    # Frontend (Vue components, pages, composables)
│   ├── components/         # UI components (shadcn + custom)
│   ├── composables/        # Vue composables
│   ├── core/               # Core frontend logic
│   ├── lib/                # Utility libraries
│   ├── middleware/         # Route middleware
│   └── pages/              # Page components (routing)
├── server/                 # Backend (Nuxt server routes & API)
│   ├── api/                # API route handlers
│   ├── middleware/         # Server middleware
│   ├── plugins/            # Server plugins
│   ├── routes/             # Additional routes
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # Business logic services
│   └── types/              # TypeScript type definitions
├── migrations/             # Knex database migrations
├── seeds/                  # Database seed data
├── scripts/                # Utility scripts (bulk operations, data setup)
├── uploads/                # Uploaded file storage
└── docs/                   # Documentation (API docs, plans)
```

## API Documentation

Full API documentation is available at [docs/api/api-docs.md](docs/api/api-docs.md).

Key endpoints:

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id` |
| Characters | `GET/POST /api/projects/:id/characters`, `PUT/DELETE /api/projects/:id/characters/:cid` |
| Scenes | `GET/POST /api/projects/:id/scenes`, `PUT/DELETE /api/projects/:id/scenes/:sid` |
| Episodes | `GET/POST /api/projects/:id/episodes`, `PUT/DELETE /api/projects/:id/episodes/:num` |
| Scripts | `GET/POST /api/projects/:id/episodes/:num/scripts` |
| Storyboards | `GET/POST /api/projects/:id/episodes/:num/storyboards`, `PUT /api/.../storyboards/reorder` |
| Assets | `GET/POST /api/projects/:id/assets`, `PUT/DELETE /api/projects/:id/assets/:aid` |
| Versions | `GET /api/projects/:id/versions?entity_type=&entity_id=` |

All endpoints (except auth) require `Authorization: Bearer <token>` header.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5433/drama_studio` |
| `JWT_SECRET` | JWT signing secret (change in production!) | `dev-secret` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |

## License

Private — All rights reserved.
