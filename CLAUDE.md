# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord activity report posting system. Users authenticate via Discord OAuth2, and authorized members can submit activity reports that get posted as embeds to a Discord channel.

## Commands

```bash
# Development (runs both backend and frontend concurrently)
npm run dev

# Run only backend (port 3000)
npm run dev:backend

# Run only frontend (port 5173)
npm run dev:frontend

# Build frontend for production
npm run build

# Run backend tests
npm run test           # Watch mode
npm run test:run       # Single run
```

## Architecture

**Monorepo with npm workspaces** containing `backend/` and `frontend/` packages.

### Backend (Express.js + ES Modules)

Entry point: `src/index.js` → `src/app.js`

| File | Description |
|------|-------------|
| `src/app.js` | Express app factory with middleware setup |
| `src/auth.js` | Discord OAuth2 via Passport, guild/role-based authorization with session caching |
| `src/discord.js` | Discord API client (Bot token) for member lookup and posting embeds |
| `src/config.js` | Environment variable configuration |
| `src/routes/auth.js` | OAuth flow endpoints (`/auth/discord`, `/auth/discord/callback`, `/auth/status`) |
| `src/routes/api.js` | Protected API (`/api/activities`, `/api/posts`) |
| `src/models/embed.js` | Builder pattern for Discord embed messages |
| `src/data/activities.js` | Static activity definitions with validation |
| `src/lib/datetime.js` | Date/time utilities |
| `src/lib/url.js` | URL utilities |

Authorization flow: User must be in the allowed guild AND have the allowed role (checked via Bot token).

### Frontend (Vue 3 + Vite + PrimeVue)

Entry point: `src/main.js` → `src/App.vue`

| File | Description |
|------|-------------|
| `src/App.vue` | Root component |
| `src/router/index.js` | Vue Router configuration with auth guards |
| `src/stores/auth.js` | Pinia store for authentication state |
| `src/composables/useDiscordAvatar.js` | Discord avatar URL composable |
| `src/components/AppLayout.vue` | Common layout wrapper |
| `src/views/Login.vue` | Login page with Discord OAuth button |
| `src/views/Callback.vue` | OAuth callback handler |
| `src/views/Report.vue` | Activity report form (main feature) |
| `src/views/PostComplete.vue` | Success page with confetti |
| `src/views/Unauthorized.vue` | Unauthorized access page |

Tech stack:
- Vue 3 Composition API (`<script setup>`)
- PrimeVue 4 with Aura theme
- Pinia for state management
- Vue Router with navigation guards
- Vite (proxies `/api` and `/auth` to backend in dev)

## Environment Variables

Backend requires `backend/.env`:

| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` | OAuth2 client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret |
| `DISCORD_BOT_TOKEN` | Bot token for member/role lookup |
| `ALLOWED_GUILD_ID` | Guild ID for authorization |
| `ALLOWED_ROLE_ID` | Role ID for authorization |
| `POST_CHANNEL_ID` | Channel ID where reports are posted |
| `SESSION_SECRET` | Express session secret |

## Testing

Tests use Vitest with supertest for API testing. Test files are co-located with source (`*.test.js`).

```bash
npm run test      # Watch mode
npm run test:run  # Single run
```

## Docker

Both backend and frontend have Dockerfiles in their respective directories. Build context is the repository root.

```bash
# Backend
docker build -f backend/Dockerfile -t discord-report-backend .

# Frontend (multi-stage: builds with Node, serves with nginx)
docker build -f frontend/Dockerfile -t discord-report-frontend .
```

Frontend container uses nginx and accepts `BACKEND_URL` environment variable for API proxy.

## CI/CD

GitHub Actions workflow at `.github/workflows/build.yaml`:
- Triggers on push to main, tags (`v*`), and pull requests
- Builds both backend and frontend images in parallel
- Pushes to ghcr.io on main/tag (PRs only build, no push)
- Multi-platform support: amd64 + arm64 (amd64 only for PRs)
