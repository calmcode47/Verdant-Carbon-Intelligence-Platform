# Verdant — Carbon Intelligence Platform
## Project Report

> **"Know Your Carbon. Own Your Future."**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Objectives](#2-objectives)
3. [Current Project Status](#3-current-project-status)
4. [System Architecture](#4-system-architecture)
5. [Frontend — Languages & Frameworks](#5-frontend--languages--frameworks)
6. [Backend & API Layer](#6-backend--api-layer)
7. [State Management](#7-state-management)
8. [AI Integration](#8-ai-integration)
9. [Module Breakdown](#9-module-breakdown)
10. [Data Models & Type System](#10-data-models--type-system)
11. [Carbon Calculation Engine](#11-carbon-calculation-engine)
12. [Design System](#12-design-system)
13. [File Structure](#13-file-structure)
14. [Environment Configuration](#14-environment-configuration)
15. [Known Limitations & Future Roadmap](#15-known-limitations--future-roadmap)

---

## 1. Project Overview

**Verdant** is a full-stack, AI-powered personal carbon footprint intelligence platform. It enables individuals to track, analyze, and reduce their daily carbon emissions across four core activity categories — **Transport**, **Food**, **Energy**, and **Lifestyle**. The platform combines real-time data logging, scientific emission factor calculations (sourced from IPCC, EPA, and IEA data), Google Gemini AI-powered personalised insights, a community challenge system, and an XP-based gamification engine — all within a visually immersive, space-themed web experience.

The platform was developed as a **hackathon project** and is currently operational as a client-side web application with a serverless Next.js API route for AI communication.

---

## 2. Objectives

| # | Objective |
|---|-----------|
| 1 | Enable users to log daily carbon-emitting activities across four tracked categories |
| 2 | Compute scientifically accurate CO₂ emissions using IPCC/EPA/IEA emission factors |
| 3 | Deliver personalised, AI-generated actionable insights via Google Gemini |
| 4 | Motivate behaviour change through gamification (XP, Levels, Badges, Leaderboard) |
| 5 | Visualise carbon data with interactive charts and real-time dashboards |
| 6 | Provide an immersive, premium user experience with 3D WebGL visuals |
| 7 | Build a community layer via cooperative sustainability challenges |

---

## 3. Current Project Status

> **Status: Active Development — Hackathon MVP (Functionally Complete)**

### Feature Completion Summary

| Module | Status | Notes |
|---|---|---|
| **Landing Page** | ✅ Complete | Fully implemented with WebGL Earth globe, stats ticker, how-it-works workflow, 3D feature cards, CO₂ molecule section, and newsletter footer |
| **Dashboard** | ✅ Complete | Carbon summary KPIs, category breakdown, activity log, AI insights card, interactive charts |
| **Activity Tracker (`/track`)** | ✅ Complete | Full multi-category activity logging form with real-time carbon computation and XP awarding |
| **AI Insights (`/insights`)** | ✅ Complete | Gemini-powered personalised tips, fallback mock insights when API key is absent |
| **Challenges (`/challenges`)** | ✅ Complete | Active community challenges with progress bars, category filters, and XP rewards |
| **Profile Hub (`/profile`)** | ✅ Complete | User stats, badge collection, level progression, and leaderboard view |
| **Navigation** | ✅ Complete | Responsive top navigation with active state indicators |
| **Carbon Calculator Engine** | ✅ Complete | 24 emission sub-categories across 4 domains with scientifically-backed factors |
| **State Management** | ✅ Complete | Zustand persisted store with full CRUD for activities, challenges, user profile |
| **3D Visuals** | ✅ Complete | Earth globe, CO₂ molecule, AI core orb, leaf particles — all WebGL via Three.js |
| **Leaderboard** | ✅ Complete | Dynamic ranked leaderboard with real-time user position updates |
| **Gemini API Route** | ✅ Complete | Serverless Next.js API route at `/api/insights` |
| **Design System** | ✅ Complete | Custom Tailwind theme, four-font typographic scale, animation tokens |
| **Responsive Layout** | ⚠️ Partial | Desktop-first; mobile adaptations exist (CSS globe fallback on mobile) but are not fully audited |
| **Authentication** | ❌ Not Implemented | Currently uses a default mock user; no real auth system |
| **Backend Database** | ❌ Not Implemented | All state is persisted to `localStorage` via Zustand `persist` middleware |
| **Real-time Data Sync** | ❌ Not Implemented | No server-side data persistence or multi-device sync |
| **Unit & Integration Tests** | ❌ Not Implemented | No automated test suite exists at this stage |

### Overall Completion: **~80% MVP Complete**

The platform is **fully functional** for its intended hackathon use case. All six pages render correctly, AI insights are generated live (with graceful fallback), and the carbon tracking loop (log → calculate → summarise → insight → challenge) is end-to-end operational.

---

## 4. System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                               │
│                                                                       │
│   ┌────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│   │  Next.js   │   │   React 18   │   │  Three.js / R3F          │  │
│   │  App Router│   │   Components │   │  WebGL 3D Scenes         │  │
│   └────────────┘   └──────────────┘   └──────────────────────────┘  │
│          │                │                                           │
│          ▼                ▼                                           │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │            Zustand Global State Store (Persisted)            │   │
│   │   user · activities · summary · challenges · leaderboard    │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                    │                                                  │
│                    ▼ (fetch)                                          │
│         ┌──────────────────────┐                                      │
│         │  Next.js API Route   │  /api/insights (Server-side)        │
│         │  (Serverless Edge)   │                                      │
│         └──────────────────────┘                                      │
│                    │                                                  │
└────────────────────┼──────────────────────────────────────────────────┘
                     │ HTTPS
                     ▼
          ┌─────────────────────┐
          │  Google Gemini API  │  (gemini-1.5-flash)
          │  @google/generative │
          │  -ai SDK            │
          └─────────────────────┘
```

**Architecture Pattern:** Monolithic Next.js full-stack application using the App Router. No separate backend service. State is managed client-side and persisted to `localStorage`.

---

## 5. Frontend — Languages & Frameworks

### Core Languages

| Language | Role |
|---|---|
| **TypeScript 5** | Primary language for all application code — provides strict type safety across components, stores, and API routes |
| **TSX (TypeScript + JSX)** | Used for all React component files (`.tsx`) |
| **CSS** | Global styles via `globals.css`; utility-first extended with custom Tailwind tokens |

### Frameworks & Runtime

| Framework / Runtime | Version | Role |
|---|---|---|
| **Next.js** | `14.2.35` | Full-stack React framework using the App Router (`src/app/`). Handles page routing, server-side rendering (SSR), and serverless API routes. |
| **React** | `^18` | Core UI library. Uses functional components, hooks (`useState`, `useEffect`, `useRef`, `Suspense`), and `'use client'` directives. |
| **React DOM** | `^18` | DOM rendering layer for React. |

### UI & Styling

| Library | Version | Role |
|---|---|---|
| **Tailwind CSS** | `^3.4.1` | Utility-first CSS framework extended with a custom Verdant design system — custom colours (`verdant.green`, `verdant.teal`, `verdant.dark`), four-font typographic scale, and custom keyframe animations. |
| **PostCSS** | `^8` | Processes Tailwind directives into CSS. |
| **tailwind-merge** | `^3.6.0` | Merges conflicting Tailwind class names safely within component logic. |
| **clsx** | `^2.1.1` | Conditional class name utility for dynamic component states. |
| **Radix UI** | `^1.x` | Headless, accessible primitive components: `Dialog`, `Progress`, `Tooltip`. |
| **Lucide React** | `^1.17.0` | Icon library providing consistent SVG icon set throughout the UI. |

### 3D Graphics & WebGL

| Library | Version | Role |
|---|---|---|
| **Three.js** | `^0.184.0` | Low-level 3D WebGL rendering engine. Powers Earth globe, CO₂ molecule, particle systems, and orbital visualisations. |
| **@react-three/fiber (R3F)** | `^8.18.0` | React renderer for Three.js. Enables declarative 3D scene composition using React components. Used for `<Canvas>`, `<EarthGlobe>`, `<CarbonMolecule>` etc. |
| **@react-three/drei** | `^9.122.0` | Helper library for R3F providing utilities like `OrbitControls`, `Stars`, `useTexture`, and `Sphere`. |

### Animation

| Library | Version | Role |
|---|---|---|
| **Framer Motion** | `^12.40.0` | Production-grade animation library. Used for page transitions, staggered card reveals (`motion.div`), hero animations, hover effects (`whileHover`, `whileTap`), and scroll-triggered animations (`whileInView`). |

### Data Visualisation

| Library | Version | Role |
|---|---|---|
| **Recharts** | `^3.8.1` | Composable chart library built on D3. Used in the Dashboard for the weekly carbon trend line chart and category bar charts. |

### State Management

| Library | Version | Role |
|---|---|---|
| **Zustand** | `^5.0.14` | Minimal global state management. A single store (`carbon-store.ts`) manages all application state with `persist` middleware writing to `localStorage`. |

### Date Utilities

| Library | Version | Role |
|---|---|---|
| **date-fns** | `^4.4.0` | Lightweight date utility library for formatting timestamps in the Activity Log. |

### Typography (Google Fonts)

| Font | Role |
|---|---|
| **Bebas Neue** | `font-display` — Large hero headings, stat counters, impact typography |
| **Syne** | `font-heading` — Section headings, navigation labels, card titles |
| **DM Mono** | `font-mono` — Eyebrow labels, technical annotations, code-style text |
| **Space Grotesk** | `font-body` — Body copy, descriptions, form labels |

---

## 6. Backend & API Layer

The project uses **Next.js Route Handlers** (App Router) as serverless API endpoints. There is one active API route:

### `POST /api/insights`

| Property | Value |
|---|---|
| **File** | `src/app/api/insights/route.ts` |
| **Method** | `POST` |
| **Purpose** | Accepts the user's activity summary and profile data, constructs a detailed prompt, and calls the Google Gemini API to generate personalised AI insights |
| **Fallback** | If no `GEMINI_API_KEY` is set, the route returns a set of pre-built mock insights |
| **Model** | `gemini-1.5-flash` |

---

## 7. State Management

All application state is managed by a **single Zustand store** (`src/store/carbon-store.ts`) with the `persist` middleware.

### Store Structure

```typescript
CarbonStore {
  user: UserProfile | null          // Profile, XP, level, badges
  activities: Activity[]            // Full logged activity history
  insights: AIInsight[]             // AI-generated insight cards
  challenges: Challenge[]           // Active/completed community challenges
  summary: CarbonSummary | null     // Aggregated today/week/month/year totals
  leaderboard: LeaderboardEntry[]   // Ranked user leaderboard
  isLoading: boolean                // Global loading state flag
}
```

### Key Store Actions

| Action | Behaviour |
|---|---|
| `addActivity()` | Calculates carbon, awards XP, levels up user, updates challenges, recomputes full summary |
| `removeActivity()` | Reverses carbon, deducts XP, recomputes summary |
| `updateLeaderboard()` | Re-sorts leaderboard by XP, updates user rank dynamically |
| `getTodayActivities()` | Computed filter returning today's logged activities |
| `getWeekActivities()` | Computed filter returning the last 7 days of activities |

---

## 8. AI Integration

| Property | Detail |
|---|---|
| **Provider** | Google Gemini (`@google/generative-ai` v0.24.1) |
| **Model** | `gemini-1.5-flash` |
| **Integration Point** | `src/lib/gemini.ts` — initialises the client; `src/app/api/insights/route.ts` — generates insights |
| **Input** | User profile (name, level, XP, monthly budget), activity history (categories, carbon totals, trends) |
| **Output** | Structured JSON array of `AIInsight` objects with title, description, difficulty, action items, and estimated CO₂ saving |
| **Fallback** | Graceful degradation to pre-built mock insights if `GEMINI_API_KEY` is absent |
| **Prompt Engineering** | The API route constructs a detailed system-level prompt instructing Gemini to act as a carbon intelligence advisor, respond strictly in JSON, and tailor advice to the user's specific activity patterns |

---

## 9. Module Breakdown

### Pages (`src/app/`)

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page — WebGL Earth hero, stats ticker, how-it-works workflow, feature showcase, CO₂ molecule callout, footer |
| `/dashboard` | `dashboard/page.tsx` | Main dashboard — KPI cards, carbon summary chart, activity log, quick-log form, AI insights preview |
| `/track` | `track/page.tsx` | Full activity logging — category selector, sub-category picker, value input, real-time carbon preview, history list |
| `/insights` | `insights/page.tsx` | AI insights hub — Gemini-generated tips by category, difficulty rating, estimated savings, action item checklists |
| `/challenges` | `challenges/page.tsx` | Community challenge board — active/completed challenges, progress bars, participant counts, XP rewards |
| `/profile` | `profile/page.tsx` | User profile — stats overview, badge gallery, level/XP bar, leaderboard ranking |

### Components (`src/components/`)

| Directory | Components | Purpose |
|---|---|---|
| `layout/` | `Navigation.tsx`, `PageTransition.tsx` | Global navigation bar; animated page transition wrapper |
| `dashboard/` | `ActivityLog.tsx`, `CarbonChart.tsx`, `InsightsCard.tsx` | Dashboard-specific components for displaying activity history and carbon data |
| `challenges/` | `ChallengeList.tsx` | Renders active and completed challenges with real-time progress |
| `insights/` | `Confetti.tsx`, `FingerprintSVG.tsx` | Decorative components for the insights page |
| `three/` | `EarthGlobe.tsx`, `CarbonMolecule.tsx`, `ConstellationBackground.tsx`, `DataOrb.tsx`, `AICore.tsx`, `LeafParticles.tsx` | All WebGL/Three.js R3F scene components |
| `visualizations/` | `EarthCanvas.tsx`, `EmissionGlobe.tsx` | Canvas wrappers for 3D visualisation components |
| `ui/` | `Button.tsx`, `Card.tsx`, `CustomCursor.tsx`, `Dialog.tsx`, `Progress.tsx`, `Tooltip.tsx` | Reusable primitive UI components; includes custom animated cursor |

### Libraries (`src/lib/`)

| File | Purpose |
|---|---|
| `carbon-calculator.ts` | Core emission calculation engine with 24 sub-categories; includes carbon labelling and XP computation |
| `gemini.ts` | Google Generative AI client initialisation with null-safe API key handling |
| `utils.ts` | General utility helpers (e.g., `cn()` for class merging) |

---

## 10. Data Models & Type System

All TypeScript interfaces are defined in `src/types/index.ts`.

| Type | Key Fields |
|---|---|
| `Activity` | `id`, `category`, `subCategory`, `value`, `unit`, `carbonKg`, `timestamp`, `notes`, `aiSuggestion` |
| `UserProfile` | `id`, `name`, `email`, `avatar`, `location`, `monthlyBudgetKg`, `totalCarbonKg`, `streak`, `level`, `xp`, `badges` |
| `CarbonSummary` | `today`, `week`, `month`, `year`, `categoryBreakdown`, `trend`, `percentageVsAverage` |
| `AIInsight` | `id`, `type`, `title`, `description`, `potentialSavingKg`, `difficulty`, `category`, `actionItems`, `generatedAt` |
| `Challenge` | `id`, `title`, `description`, `category`, `targetReductionKg`, `currentProgressKg`, `duration`, `xpReward`, `participants`, `status`, `endsAt` |
| `Badge` | `id`, `name`, `description`, `icon`, `rarity` (`common` / `rare` / `epic` / `legendary`), `earnedAt` |
| `LeaderboardEntry` | `rank`, `userId`, `name`, `avatar`, `reductionKg`, `xp`, `level` |
| `EmissionFactor` | `category`, `subCategory`, `label`, `kgCO2PerUnit`, `unit`, `icon` |

---

## 11. Carbon Calculation Engine

**File:** `src/lib/carbon-calculator.ts`

The engine is backed by real-world emission factors sourced from the **IPCC**, **EPA**, and **IEA**.

### Coverage: 24 Sub-categories across 4 Domains

| Domain | Sub-categories |
|---|---|
| **Transport** | Car (Petrol), Car (Diesel), Electric Car, Short Flight (<3h), Long Flight (>3h), Train, Bus, Motorcycle |
| **Food** | Beef, Lamb, Pork, Chicken, Fish, Dairy, Eggs, Vegetables, Fruits, Grains & Legumes |
| **Energy** | Electricity, Natural Gas, Heating Oil, LPG |
| **Lifestyle** | New Clothing, Electronics, Streaming, General Waste |

### Emission Factor Examples

| Activity | Factor | Unit |
|---|---|---|
| Car (Petrol) | 0.192 kg CO₂ | per km |
| Beef | 27.0 kg CO₂ | per kg |
| Electricity | 0.233 kg CO₂ | per kWh |
| Electronics | 70.0 kg CO₂ | per item |

### Carbon Labels

| Daily kg CO₂ | Label | Colour |
|---|---|---|
| < 5 kg | Climate Hero | `#00E676` (Green) |
| 5–10 kg | Eco Conscious | `#69F0AE` (Light Green) |
| 10–15 kg | Average | `#FFEB3B` (Yellow) |
| 15–20 kg | High Impact | `#FF9800` (Orange) |
| > 20 kg | Critical | `#F44336` (Red) |

---

## 12. Design System

The Verdant design system follows a **"Cosmic Environmental Observatory"** visual language.

### Colour Palette

| Token | Hex | Use |
|---|---|---|
| `verdant.green` | `#00E676` | Primary accent — CTAs, highlights, metrics |
| `verdant.teal` | `#1DE9B6` | Secondary accent — alternative highlights |
| `verdant.dark` | `#0A0F0D` | Primary background |
| `verdant.mid` | `#141C18` | Card backgrounds |
| `verdant.muted` | `#1E2E26` | Borders and subtle fills |

### Typography Scale

| Role | Font | Usage |
|---|---|---|
| Display | Bebas Neue | Hero headings, stat counters |
| Heading | Syne | Section titles, nav, card titles |
| Mono | DM Mono | Labels, annotations, code |
| Body | Space Grotesk | Descriptions, body text |

### Custom Animations

| Animation | Duration | Effect |
|---|---|---|
| `float` | 6s | Gentle vertical floating for 3D elements |
| `pulse-green` | 2s | Pulsing green glow on KPI cards |
| `scan` | 3s | Vertical scan line on hero section |
| `glow` | 2s | Text glow effect on accent headings |
| `orbit` | 20s | Orbital motion for particle/icon elements |

---

## 13. File Structure

```
verdant-carbon-intelligence-platform/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, global metadata, navigation
│   │   ├── page.tsx                # Landing page (/)
│   │   ├── dashboard/page.tsx      # Dashboard (/dashboard)
│   │   ├── track/page.tsx          # Activity tracker (/track)
│   │   ├── insights/page.tsx       # AI insights (/insights)
│   │   ├── challenges/page.tsx     # Challenge board (/challenges)
│   │   ├── profile/page.tsx        # Profile hub (/profile)
│   │   └── api/insights/route.ts   # Gemini AI API route
│   │
│   ├── components/
│   │   ├── layout/                 # Navigation, PageTransition
│   │   ├── dashboard/              # ActivityLog, CarbonChart, InsightsCard
│   │   ├── challenges/             # ChallengeList
│   │   ├── insights/               # Confetti, FingerprintSVG
│   │   ├── three/                  # WebGL: EarthGlobe, CarbonMolecule, etc.
│   │   ├── visualizations/         # EarthCanvas, EmissionGlobe
│   │   └── ui/                     # Button, Card, Dialog, Progress, Tooltip, CustomCursor
│   │
│   ├── store/
│   │   └── carbon-store.ts         # Zustand global state (persisted)
│   │
│   ├── lib/
│   │   ├── carbon-calculator.ts    # Emission factors & calculation engine
│   │   ├── gemini.ts               # Google Gemini client initialisation
│   │   └── utils.ts                # General utilities
│   │
│   ├── types/
│   │   └── index.ts                # All TypeScript interfaces & types
│   │
│   └── styles/
│       └── globals.css             # Global CSS, Tailwind directives, custom classes
│
├── .env.example                    # Environment variable template
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS custom design tokens
├── tsconfig.json                   # TypeScript compiler options
└── package.json                    # Dependencies & scripts
```

---

## 14. Environment Configuration

The application requires a single environment variable for full AI functionality:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional (Recommended) | Google Gemini API key. Without this, AI insights fall back to mock data. |
| `NEXT_PUBLIC_APP_URL` | Optional | Base URL of the application (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | Optional | Application display name (default: `Verdant`) |

**Setup:**
```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
```

**Running locally:**
```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 15. Known Limitations & Future Roadmap

### Current Limitations

| Area | Limitation |
|---|---|
| **Persistence** | All data stored in `localStorage`. Data is lost on browser clear or device change. |
| **Authentication** | No user authentication. Platform operates with a single default mock user profile. |
| **Multi-user** | No concept of multiple user accounts or real community participants on leaderboards. |
| **Mobile** | Responsive adaptations exist but a full mobile audit and QA pass is outstanding. |
| **Testing** | No automated unit, integration, or E2E test suite. |
| **Real Data** | Challenge participant counts and leaderboard peers are seeded mock data. |
| **Accessibility** | ARIA and keyboard navigation has not been formally audited. |

### Future Roadmap

| Priority | Feature |
|---|---|
| High | Firebase / Supabase backend integration for persistent cross-device storage |
| High | Firebase Authentication for real user accounts |
| High | Full mobile-responsive audit and redesign of complex layouts |
| Medium | Real-time community leaderboard with live participant data |
| Medium | Email / push notifications for challenge deadlines and insights |
| Medium | Carbon offset marketplace (tree planting, renewable energy credits) |
| Medium | CSV / PDF export of carbon reports |
| Low | Native mobile app (React Native) |
| Low | Integration with third-party APIs (e.g., smart home energy monitors) |
| Low | Organisation / team dashboard for corporate ESG reporting |

---

## Document Information

| Field | Value |
|---|---|
| **Project Name** | Verdant — Carbon Intelligence Platform |
| **Repository** | `Verdant-Carbon-Intelligence-Platform` |
| **Report Generated** | June 9, 2026 |
| **Document Version** | 1.0 |
| **Status** | Active Hackathon MVP |
| **Author** | Development Team |

---

*© 2026 Verdant. Built for Hackathon. All rights reserved.*
