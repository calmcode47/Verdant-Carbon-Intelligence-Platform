# Verdant Carbon Intelligence Platform

Verdant is a full-stack carbon intelligence assistant for an **Urban Professional** persona. It helps users understand, track, and reduce their carbon footprint across commute, meals, home energy, and lifestyle choices through server-side calculations, gamified progress, challenges, and AI-generated recommendations.

**Frontend:** [https://frontend-five-ruby-77.vercel.app](https://frontend-five-ruby-77.vercel.app)  
**Backend API:** [https://frontend-five-ruby-77.vercel.app/api/me](https://frontend-five-ruby-77.vercel.app/api/me)

## What It Does

- Tracks daily carbon activities and stores durable anonymous-session data.
- Calculates emissions, XP, levels, streaks, badges, summaries, and challenge progress on the server.
- Prioritizes a Gemini Carbon Advisor chat on the Insights page, followed by structured analysis cards.
- Generates structured AI insights and chat responses with Gemini, with deterministic contextual fallback answers when the model is unavailable.
- Renders immersive Three.js scenes with visible WebGL fallbacks for devices that cannot run WebGL.
- Keeps the demo frictionless: no login wall, httpOnly session cookie, and localStorage only as a short-lived UI cache.

## Architecture

```text
frontend/
  src/app/                 Next.js App Router pages and API route handlers
  src/components/three/    Earth globe, data orbs, neural core, WebGL fallbacks
  src/lib/                 API client, performance helpers, utilities
  src/store/               Zustand frontend state hydrated from backend APIs
  backend/                 API validation, session, database, and service layer
```

Backend implementation files live in `frontend/backend`. The Next.js route handlers in `frontend/src/app/api/*` are thin HTTP entrypoints that validate requests and call the backend service layer.

Primary backend routes:

- `GET /api/me`
- `POST /api/activities`
- `POST /api/insights`
- `GET /api/summary`
- `GET /api/challenges`

## Tech Stack

- **Next.js 16 + React 19 + TypeScript**
- **Neon Serverless Postgres + Drizzle ORM**
- **Zod** for runtime validation
- **Google Gemini via `@google/genai`**
- **Zustand** for UI state and short-lived demo cache
- **Three.js / React Three Fiber** with WebGL capability fallbacks
- **Vitest + ESLint** for validation
- **Vercel** for deployment

## Environment Variables

Create `frontend/.env.local` for local development and configure the same values in Vercel Production:

```bash
DATABASE_URL=postgres://...
GEMINI_API_KEY=...
SESSION_SECRET=use-a-random-32-character-secret
NEXT_PUBLIC_APP_URL=https://frontend-five-ruby-77.vercel.app
NEXT_PUBLIC_APP_NAME=Verdant
```

Do not commit real secrets. If `DATABASE_URL` is missing, Verdant uses an in-memory demo backend. If `GEMINI_API_KEY` is missing or invalid, `/api/insights` returns deterministic fallback insights.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

Run checks from `frontend`:

```bash
npm run lint
npm run test
npm run build
npm audit --audit-level=moderate
```

Repository rule checks:

```bash
git branch --list
git ls-files | xargs -I{} du -k {} 2>/dev/null | awk '{sum+=$1} END {print sum " KB tracked"}'
```

Run a secret scan before submission for provider tokens, database URLs, API keys, and project-specific key fragments. Do not place real secrets or copied secret fragments in documentation.

Current validation status: lint, tests, and production build pass; tracked repository size is approximately 1.3 MB; only the `main` branch is used.

## Deployment

Deploy from `frontend` with the linked Vercel project:

```bash
cd frontend
npx vercel deploy --prod
```

Vercel must have these Production environment variables configured: `DATABASE_URL`, `GEMINI_API_KEY`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_APP_NAME`.

## Security Notes

- httpOnly sameSite anonymous session cookie.
- Strict Zod validation and request body limits on API writes.
- Server-side emission-factor lookup; client-calculated emissions are never trusted.
- DB-backed rate limiting when Postgres is configured.
- Safe error responses and CSP/security headers in `next.config.js`.
- No secrets are required in the client bundle.
