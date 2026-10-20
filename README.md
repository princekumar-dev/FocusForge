<div align="center">

# FocusForge

### Stay on task. Forge your focus.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com)

**[🔗 Live App](https://focus-forge-self.vercel.app)**

</div>

## 🎯 Overview

**FocusForge** is a full-stack productivity app that combines a **task-aware focus timer**, **task management**, and **productivity stats** — plus an **AI hub** for streamed text and image generation. Pick a task, start a focus session, and watch your progress build.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui, authenticated with **Clerk**
- **Backend:** **FastAPI** (Python 3.11) with SQLite, Alembic migrations, Docker & AWS Lambda ready
- **Deployment:** static frontend on **Vercel**, API on **Render** (see `render.yaml`)

## ✨ Features

### ⏱️ Focus Timer
- Timer presets for focus sessions (custom durations)
- Associate a session with a pending task to stay on track
- Live countdown with start/pause/reset controls

### ✅ Tasks
- Create and track tasks with status (pending / done)
- Tasks page with filtering and quick capture
- Tasks feed into the focus timer for session attribution

### 📊 Stats & Profile
- Stats page visualizing your focus activity
- Profile management backed by Clerk sessions

### 🤖 AI Hub
- **Generate text** (`gentxt`) and **generate images** (`genimg`) endpoints
- **SSE streaming** responses rendered live in the UI

### 🔐 Auth & Platform
- Clerk sign-in / sign-up with OAuth callback, error, and logout flows
- Runtime configuration, admin settings, and storage services
- Health-check endpoint for the database layer

## 🗺️ Frontend Routes

| Route | Page |
|-------|------|
| `/` | Landing |
| `/tasks` | Task management |
| `/focus` | Focus timer |
| `/stats` | Productivity stats |
| `/profile` | User profile |
| `/sign-in/*` · `/sign-up/*` | Clerk auth |
| `/auth/callback` · `/auth/error` · `/logout-callback` | Auth flow handlers |

## 🧱 Project Structure

```
FocusForge/
├── src/                        # React frontend
│   ├── pages/                  # FocusPage, TasksPage, StatsPage, ProfilePage, auth pages
│   ├── components/             # UI components (shadcn/ui under components/ui)
│   ├── api/                    # Frontend API layer
│   ├── contexts/ · hooks/      # App state & reusable hooks
│   ├── lib/                    # Utilities & clients
│   ├── App.tsx                 # Route definitions
│   └── main.tsx                # Entry point
├── backend/                    # FastAPI service
│   ├── main.py                 # App entry (uvicorn main:app)
│   ├── routers/                # tasks, auth, users, profiles, settings, storage, aihub, health
│   ├── services/ · models/     # Business logic & ORM models
│   ├── schemas/ · data_models/ # Pydantic schemas & data models
│   ├── core/ · dependencies/   # Config & DI
│   ├── middlewares/ · utils/   # Cross-cutting concerns
│   ├── alembic/                # DB migrations
│   ├── Dockerfile              # Container build
│   └── lambda_handler.py       # AWS Lambda entry
├── render.yaml                 # Render blueprint (backend + static frontend)
├── vercel.json                 # SPA rewrites for Vercel
└── vite.config.ts              # Dev proxy → localhost:3001
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** and **pnpm** (`corepack enable`)
- **Python 3.11**
- A **Clerk** application (free tier works)

### 1. Clone

```bash
git clone https://github.com/princekumar-dev/FocusForge.git
cd FocusForge
```

### 2. Frontend

```bash
pnpm install
# create .env.local (see Environment Variables below)
pnpm run dev                 # http://localhost:5173
```

### 3. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 3001
```

The Vite dev server proxies API calls to `http://localhost:3001`.

### 4. Build

```bash
pnpm run build               # outputs dist/
pnpm run lint                # eslint
```

## 🔧 Environment Variables

**Frontend — `.env.local`**

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=FocusForge
```

**Backend — environment**

```env
LOG_LEVEL=info
ALLOWED_DOMAINS=http://localhost:5173
MASK_KEY=your_masking_key
```

> ⚠️ Never commit real `.env` files — all `.env.*` files are gitignored.

## 📡 API Overview

Base URL: `http://localhost:3001`

| Area | Prefix | Notes |
|------|--------|-------|
| Auth | `/api/v1/auth` | Session/token endpoints for Clerk integration |
| Tasks | `/api/v1/entities/tasks` | CRUD for tasks |
| User profiles | `/api/v1/entities/user_profiles` | Profile records |
| Users | `/api/v1/users` | User management |
| Admin settings | `/api/v1/admin/settings` | Platform settings |
| Storage | `/api/v1/storage` | File/blob storage |
| AI Hub | `/api/v1/aihub` | `gentxt` + `genimg`, SSE streaming |
| Health | `/database` | Database health check |

Interactive OpenAPI docs are served by FastAPI at `/docs`.

## 🗄️ Database

- SQLite for local development (`backend/app.db`), created on first run
- **Alembic** migrations in `backend/alembic/` — run with `alembic upgrade head`
- Production (Render) mounts its own persistent disk; see `render.yaml`

## ☁️ Deployment

**Frontend (Vercel):** static build — `pnpm install && pnpm run build`, output `dist/`, SPA rewrites via `vercel.json`.

**Backend (Render):** blueprint in `render.yaml` — `pip install -r requirements.txt`, started with `uvicorn main:app`. A `Dockerfile` and `lambda_handler.py` are included for container/serverless deploys.

## 📄 License

All rights reserved.
