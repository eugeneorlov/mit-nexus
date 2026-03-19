# MIT Nexus

A private networking app for MIT Professional Education CXO cohort participants.

**Live:** [mit-nexus.vercel.app](https://mit-nexus.vercel.app)

---

## What It Does

MIT Nexus solves a simple problem: 144 executives from 30+ countries go through an 8-week MIT program together, but have no easy way to discover shared interests, find each other geographically, or connect outside scheduled sessions.

The app has three core features:

**Cohort Map** — An interactive world map showing where every member is based, with travel pins for upcoming trips. "I'm in Tokyo next week — who else is nearby?" takes 5 seconds to answer.

**Coffee Roulette** — Weekly random 1:1 matches based on complementary skills. Each member tags what they can help with and what they want to learn. The algorithm pairs people whose "help" tags overlap with the other's "learn" tags. Activates once 10+ members have onboarded.

**Direct Messages** — Real-time private chat with any cohort member. Built on Supabase Realtime (Postgres Changes), so messages appear instantly with no polling.

## The Story

This app was built during the MIT Professional Education Innovation Leadership Program (2026 cohort).
The project is also a deliberate portfolio piece for demonstrating AI-augmented development workflow.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Auth | Supabase Magic Links (passwordless email) |
| Maps | Leaflet, react-leaflet, OpenStreetMap tiles |
| Geocoding | Nominatim (OpenStreetMap) |
| Routing | React Router v7 |
| Deploy | Vercel (frontend), Supabase (backend) |

There is no custom backend server. The entire "backend" is Supabase configuration: database schema, Row-Level Security policies, Realtime subscriptions, and Storage buckets. The React app talks directly to Supabase via the client SDK.

## Local Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- A Supabase project ([supabase.com](https://supabase.com) — free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/mit-nexus.git
cd mit-nexus

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

1. Go to your Supabase project dashboard → SQL Editor
2. Run the migration file at `supabase/migrations/001_initial_schema.sql`
3. This creates all tables, indexes, RLS policies, and the auth trigger

### Run

```bash
pnpm dev
```

The app runs at `http://localhost:5173`. Enter your email to receive a magic link (Supabase sends it automatically).

### Build

```bash
pnpm build    # Outputs to dist/
pnpm preview  # Preview the production build locally
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # AuthGuard, login flow
│   ├── onboarding/      # 3-step wizard (basics, tags, location)
│   ├── directory/       # Member search and grid
│   ├── map/             # Leaflet map with clusters and travel pins
│   ├── roulette/        # Coffee Roulette match display
│   ├── messages/        # DM inbox and conversation view
│   ├── invite/          # Invite link generation, progress bar
│   ├── landing/         # Landing page sections
│   └── layout/          # App shell, navbar
├── hooks/               # useAuth, useProfile, useMessages, etc.
├── lib/
│   ├── supabase.ts      # Supabase client instance
│   ├── types.ts         # TypeScript types matching DB schema
│   └── geocoding.ts     # Nominatim city search
├── pages/               # Route-level page components
├── App.tsx              # Router setup
└── main.tsx             # Entry point
```

## Database Schema

Six tables, all with Row-Level Security:

- **profiles** — Extends Supabase auth.users with name, company, role, location, bio, avatar
- **tags** — "I can help with" / "I want to learn" skill tags per user
- **matches** — Weekly Coffee Roulette pairings with shared tag overlap
- **messages** — Real-time DMs (Supabase Realtime enabled)
- **trips** — Travel announcements with dates and location
- **invites** — Viral invite links with tracking

## Deployment

The app is deployed as:

- **Frontend** → Vercel (auto-deploys from `main` branch)
- **Backend** → Supabase (fully managed, no infra to maintain)

To deploy your own instance:

1. Push to a GitHub repo
2. Connect the repo to [Vercel](https://vercel.com)
3. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Add the Vercel domain to Supabase Auth → Redirect URLs: `https://your-app.vercel.app/auth/callback`
5. Add `vercel.json` for SPA routing:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
   ```

## License

MIT

## Author

Built by Eugene as a cohort impact project for the MIT Professional Education Innovation Leadership Program, 2026 cohort.