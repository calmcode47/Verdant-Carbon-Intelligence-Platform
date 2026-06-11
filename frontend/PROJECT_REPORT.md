# Verdant — Project Report (Submission)

## Problem Statement Alignment

Verdant helps urban professionals **measure, understand, and sustain** carbon behavior change through:

- Daily activity tracking across transport, food, energy, and lifestyle
- Server-side IPCC/EPA/IEA-style emission factors (24 sub-categories)
- Google Gemini AI insights with deterministic fallback
- Gamification: XP, levels, badges, challenges, leaderboard
- Production deployment on Vercel with Neon Postgres persistence

## Architecture (Current)

| Layer | Implementation |
|-------|----------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind, Framer Motion, Three.js |
| API | Next.js route handlers (`/api/me`, `/api/activities`, `/api/insights`, …) |
| Backend services | Shared `backend/` package (validation, sessions, carbon + insights services) |
| Database | Neon serverless Postgres via Drizzle ORM (in-memory fallback for local dev) |
| AI | `@google/genai` — Gemini 3.5 Flash with structured JSON output |
| Auth | Signed httpOnly session cookies (anonymous, per-device) |
| Testing | Vitest unit tests + GitHub Actions CI (lint, test, build) |

## Security

- Zod validation on all write endpoints
- Rate limiting per session + IP
- HMAC-signed session cookies with production `SESSION_SECRET` enforcement
- Security headers: CSP, HSTS, X-Frame-Options, nosniff
- Server-side emission calculation (client values not trusted)
- Gemini API key kept server-side only

## Accessibility

- Skip-to-content link, semantic landmarks, ARIA on interactive controls
- `prefers-reduced-motion` support
- Chart text alternatives and screen-reader summaries on profile analytics
- Keyboard-accessible toggles and form controls

## Data Integrity

- Profile 30-day chart, CSV export, and journey milestones derive from **live activity data**
- Challenges page reads **backend-synced challenges** and user badges
- Delete-all-data calls `DELETE /api/me` and clears persisted client cache
- Leaderboard shows community benchmarks with clearly labeled live user rank

## Validation Commands

```bash
cd frontend
npm run lint
npm run test
npm run build
```

## Live Demo

Production URL is documented in the root `README.md` after each deployment.
