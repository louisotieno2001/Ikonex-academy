# Ikonex Academy

School management system — student records, assessments, attendance, report cards, and grading.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Database** | PostgreSQL 16 |
| **CMS / API** | Directus (headless CMS) |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **PDF** | PDFKit |
| **Charts** | Recharts |

## Architecture

```
postgres:5432  ←  directus:9000  ←  backend:9002  ←  frontend:9001
```

- **PostgreSQL** — primary database
- **Directus** — data layer / admin panel (manages collections, users, permissions)
- **Backend** — Express API that proxies Directus and adds business logic (grading, scoring, PDF generation)
- **Frontend** — React SPA, talks to the backend via REST

All services run via Docker Compose.

## Prerequisites

- Docker & Docker Compose

## Quick Start

```bash
# 1. Clone and enter the project
cd ikonex-academy

# 2. Copy environment file and edit secrets (tokens, passwords)
cp .env.example .env

# 3. Start all services
docker compose up -d --build
```

This starts PostgreSQL, Directus (port 9000), the Express backend (port 9002), and the Vite frontend (port 9001).

**Wait ~30 seconds** for Directus to finish its first-time setup, then:

- **Frontend** → http://localhost:9001
- **Directus Admin** → http://localhost:9000/admin (login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`)
- **Backend health** → http://localhost:9002/health

## Directus Setup

After first launch, configure Directus collections:

1. Create required collections and fields as you define them (students, subjects, class_streams, assessments, grading_scale, attendance, etc.)
2. Create a **Static Token** for the backend service account under **Settings → API Tokens** and set it as `DIRECTUS_TOKEN` in `.env`
3. Set user roles and permissions so the backend token has full access to all `items/*` endpoints

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_PORT` | Backend port | `9002` |
| `PORT` | Directus port | `9000` |
| `DIRECTUS_URL` | Directus internal URL | `http://directus:9000` |
| `DIRECTUS_TOKEN` | Directus API static token | (required) |
| `JWT_SECRET` | Secret for signing auth tokens | (required) |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:9001` |
| `VITE_API_URL` | Frontend API proxy target | `http://localhost:9002/api` |

## Development (without Docker)

```bash
# Backend
cd backend
npm install
cp ../.env .
npm run dev          # nodemon on port 9002

# Frontend
cd frontend
npm install
npm run dev          # Vite on port 9001, proxies /api → localhost:9002

# Type check
npm run typecheck
```

## Key Features

- **Student & Class Management** — CRUD for students, class streams, and subjects
- **Assessments** — Record exam and continuous assessment scores per student/subject
- **Grading** — Configurable grading scales with automatic grade computation (50/50 exam/CA split)
- **Report Cards** — Per-student PDF report cards and class-wide performance reports
- **Attendance** — Daily present/absent tracking with term/date/student filters
- **Position Ranking** — Class-wide and per-subject position calculation using percentage scores
- **Role-based Access** — Admin (full access) and Teacher (assigned classes only)
- **System Monitoring** — Live telemetry with Directus connection status, uptime, and recent signups
