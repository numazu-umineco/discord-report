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
- `src/app.js` - Express app factory with middleware setup
- `src/auth.js` - Discord OAuth2 via Passport, guild/role-based authorization with session caching
- `src/discord.js` - Discord API client (Bot token) for member lookup and posting embeds
- `src/routes/auth.js` - OAuth flow endpoints (`/auth/discord`, `/auth/discord/callback`, `/auth/status`)
- `src/routes/api.js` - Protected API (`/api/activities`, `/api/posts`)
- `src/models/embed.js` - Builder pattern for Discord embed messages
- `src/data/activities.js` - Static activity definitions with validation

Authorization flow: User must be in the allowed guild AND have the allowed role (checked via Bot token).

### Frontend (Vue 3 + Vite + PrimeVue)
- Uses Vue 3 Composition API (`<script setup>`)
- PrimeVue 4 with Aura theme for UI components
- Pinia for state management (`stores/auth.js`)
- Vue Router with navigation guards for auth protection
- Vite proxies `/api` and `/auth` to backend during development

Key views: Login → Dashboard (form) → PostComplete (with confetti)

## Environment Variables

Backend requires a `.env` file with:
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` - OAuth2 credentials
- `DISCORD_BOT_TOKEN` - Bot token for member/role lookup
- `ALLOWED_GUILD_ID`, `ALLOWED_ROLE_ID` - Authorization constraints
- `POST_CHANNEL_ID` - Where reports get posted

## Testing

Tests use Vitest with supertest for API testing. Test files are co-located with source (`*.test.js`).
