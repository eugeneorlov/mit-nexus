# Local Build Guide

This guide walks you through setting up and running the MIT Nexus project on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** v18 or higher ([download](https://nodejs.org/))
- **pnpm** v8 or higher (recommended package manager)
  ```bash
  npm install -g pnpm
  ```
- A **Supabase** account — [supabase.com](https://supabase.com)
- **Git**

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mit-nexus
```

---

## Step 2: Install Dependencies

```bash
pnpm install
```

> **Note:** `npm install` works too, but pnpm is preferred since `pnpm-lock.yaml` is the canonical lock file.

---

## Step 3: Set Up Supabase

The app requires a running Supabase project for authentication, the database, and real-time features.

### 3a. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose a name and region, and wait for it to provision.

### 3b. Apply Database Migrations

Migrations live in `supabase/migrations/`. You can apply them via the Supabase dashboard (SQL Editor) or the Supabase CLI.

**Using the Supabase CLI:**
```bash
# Install the CLI
npm install -g supabase

# Link your project (get the project ref from the Supabase dashboard URL)
supabase link --project-ref <your-project-ref>

# Push migrations to your remote project
supabase db push
```

**Using the dashboard:**
Open the SQL Editor in your Supabase project and run each `.sql` file in `supabase/migrations/` in chronological order (sorted by filename).

### 3c. Get Your API Keys

In the Supabase dashboard, go to **Project Settings → API** and copy:
- **Project URL** (e.g. `https://xxxx.supabase.co`)
- **`anon` public key**

---

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env   # if an example file exists, otherwise create it manually
```

Add the following variables:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_AUTH_REDIRECT_URL=http://localhost:5173
```

> All variables must be prefixed with `VITE_` to be exposed to the Vite frontend.

---

## Step 5: Configure Auth Redirect URL (Supabase)

In the Supabase dashboard, go to **Authentication → URL Configuration** and add the following to **Redirect URLs**:

```
http://localhost:5173
```

This is required for OAuth flows to redirect back to your local dev server.

---

## Step 6: Start the Development Server

```bash
pnpm run dev
```

The app will be available at **[http://localhost:5173](http://localhost:5173)**.

It supports Hot Module Replacement (HMR), so changes to source files reflect immediately without a full page reload.

---

## Step 7: Run the Linter

```bash
pnpm run lint
```

This runs ESLint across the codebase. Fix any reported issues before committing.

---

## Step 8: Build for Production

```bash
pnpm run build
```

This runs TypeScript type-checking (`tsc -b`) followed by the Vite production build. Output is placed in the `dist/` directory.

To preview the production build locally:

```bash
pnpm run preview
```

The preview server runs at **[http://localhost:4173](http://localhost:4173)** by default.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start the Vite dev server with HMR |
| `pnpm run build` | Type-check and build for production |
| `pnpm run preview` | Serve the production build locally |
| `pnpm run lint` | Run ESLint across the codebase |

---

## Project Structure (Quick Reference)

```
mit-nexus/
├── src/
│   ├── pages/          # Route-level page components
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # shadcn/ui primitives
│   │   ├── guards/     # Auth/onboarding route guards
│   │   ├── layout/     # App shell layout
│   │   ├── directory/  # User directory UI
│   │   ├── map/        # Interactive cohort map (Leaflet)
│   │   ├── messages/   # Real-time messaging UI
│   │   ├── onboarding/ # Onboarding flow
│   │   ├── invite/     # Invite system
│   │   └── roulette/   # Coffee roulette matching
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and Auth context
│   ├── App.tsx         # Route definitions
│   └── main.tsx        # React entry point
├── supabase/
│   ├── migrations/     # SQL database schema migrations
│   └── functions/      # Supabase Edge Functions
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # TailwindCSS configuration
└── tsconfig.json       # TypeScript configuration
```

---

## Troubleshooting

**`VITE_SUPABASE_URL` is undefined at runtime**
Make sure your `.env` file is in the project root (not a subdirectory) and that variable names start with `VITE_`. Restart the dev server after editing `.env`.

**Auth redirects fail / infinite loop after login**
Verify that `http://localhost:5173` is listed in Supabase → Authentication → URL Configuration → Redirect URLs.

**Database errors on first load**
Migrations may not have been applied. Follow Step 3b to push all SQL migrations to your Supabase project.

**TypeScript errors on `pnpm run build`**
Run `pnpm run lint` first to surface ESLint issues, then address TypeScript errors shown in the build output. Ensure you're on Node.js v18+.

**Port 5173 already in use**
Pass a different port: `pnpm run dev -- --port 3000` and update `VITE_AUTH_REDIRECT_URL` and the Supabase redirect URL to match.
