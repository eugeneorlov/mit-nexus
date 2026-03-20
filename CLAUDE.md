# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MIT Nexus is a private networking app for MIT Professional Education CXO cohort participants. Features include an interactive cohort map, Coffee Roulette (on-demand 1:1 matching by complementary skills), and real-time direct messages.

**Stack**: React 18 + TypeScript + Vite (frontend), Supabase (Postgres, Auth, Realtime, Edge Functions, Storage), Tailwind CSS + shadcn/ui, Leaflet maps, deployed on Vercel.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Type-check (tsc -b) + Vite production build
pnpm lint       # ESLint (flat config)
pnpm preview    # Preview production build
```

No test framework is configured.

## Architecture

### Frontend

- **Routing**: React Router v7 in `src/App.tsx`. Public routes (`/`, `/auth/callback`, `/join/:token`), auth-required routes (`/onboard`, `/welcome`), and fully guarded routes (`/dashboard`, `/directory`, `/map`, `/messages`, `/profile`).
- **Auth**: Supabase Magic Links. `src/lib/AuthContext.tsx` provides user/profile/session state. Route guards in `src/components/guards/ProtectedRoute.tsx` (AuthGuard + OnboardGuard).
- **Hooks**: All data fetching uses Supabase client directly via custom hooks in `src/hooks/` — `useProfile`, `useRoulette`, `useMessages`, `useMapData`. Realtime subscriptions use ref pattern to avoid stale closures.
- **UI**: shadcn/ui primitives in `src/components/ui/`, new-york style. Brand colors: navy, gold, mit-red (defined in `tailwind.config.js`).
- **Path alias**: `@/*` maps to `./src/*`.

### Backend (Supabase)

- **Database**: 7 RLS-protected tables: `profiles`, `tags`, `matches`, `match_queue`, `messages`, `trips`, `invites`. All migrations in `supabase/migrations/`.
- **Realtime**: Enabled on `messages` and `matches` tables.
- **Edge Function**: `supabase/functions/generate-matches/index.ts` — on-demand matching algorithm. Validates JWT, scores candidates by tag overlap and novelty, enforces max 2 active matches per user.
- **Storage**: `avatars` bucket (public read, authenticated write).

### Key Data Flow

1. Magic Link auth → AuthContext fetches/creates profile
2. OnboardGuard redirects to 3-step wizard until `onboarded=true`
3. Hooks manage Supabase queries + Realtime subscriptions
4. Coffee Roulette calls the `generate-matches` edge function via `supabase.functions.invoke()`

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Conventions

- Single package (not a monorepo), pnpm as package manager
- ESLint flat config with typescript-eslint, react-hooks, react-refresh plugins
- TypeScript strict mode, no unused locals/parameters
- All database tables use Row-Level Security — never bypass RLS from frontend
- Edge functions use Deno runtime with `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Geocoding via Nominatim (OpenStreetMap) with 1 req/sec rate limit (`src/lib/geocoding.ts`)

## Safety

- Never modify applied Supabase migrations in `supabase/migrations/`
- Always run `pnpm build` after changes to verify they compile
- Commit messages: conventional format, no conversation IDs