# MIT Nexus — Full Visual Redesign (Claude Code Task)

**Scope:** Color system overhaul + Landing page redesign + Onboarding improvements + Propagation across entire app
**Estimated time:** 4–6 hours
**Replaces:** Original Task 18 (Landing Page) from `mit_cohort_app_claude_code_tasks.md`
**Prerequisites:** Tasks 1–17 complete and working

---

## Part 0: Context for Claude Code

```
I'm redesigning the visual identity of MIT Nexus, a cohort networking app
for 144 MIT Professional Education CXO program participants.

Stack: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase + Leaflet
Deployed at: mit-nexus.vercel.app

The app is functionally complete. This task is a visual redesign:
1. Replace the amber/orange accent color system (reads as Pornhub)
2. Rebuild the landing page to feel premium and institutional
3. Improve onboarding tag options for CXO audience
4. Propagate the new color system across every existing component

Reference: this file for all design specs. Do NOT change functionality — only visuals and copy.
```

---

## Part 1: New Color System

### The Problem

The current amber (#F59E0B) on dark navy (#1E293B) palette reads as Pornhub. The app needs to feel like an MIT-affiliated executive network — premium, techy, and institutional.

### New Palette

Replace the existing color tokens globally. Search-and-replace across all components.

| Token | Old Value | New Value | Usage |
|-------|-----------|-----------|-------|
| **Primary (navy)** | `#1E293B` | `#0F172A` | ← Darker. Hero backgrounds, app shell, headers |
| **Primary light** | — | `#1E293B` | Secondary backgrounds, card headers, nav bar |
| **Accent (gold)** | `#F59E0B` (amber) | `#C9A84C` | CTA buttons, active states, highlights, progress bars |
| **Accent hover** | `#D97706` | `#B8963F` | Button hover states |
| **Accent subtle** | — | `rgba(201, 168, 76, 0.12)` | Soft glow behind stats, light accent backgrounds |
| **MIT Red** | — | `#A31F34` | Eyebrow badge ONLY. Nowhere else. Very surgical. |
| **Emerald (help tags)** | `#10B981` | `#10B981` | Keep — still used for "I can help with" tags |
| **Blue (learn tags)** | `#3B82F6` | `#3B82F6` | Keep — still used for "I want to learn" tags |
| **Background light** | `#F9FAFB` | `#F8FAFC` | Light sections (features, quotes) |
| **Text on dark** | — | `#F1F5F9` | Primary text on dark backgrounds |
| **Text muted on dark** | — | `#94A3B8` | Secondary text on dark backgrounds (slate-400) |
| **Text on light** | — | `#0F172A` | Headings on light backgrounds |
| **Text body on light** | — | `#475569` | Body text on light backgrounds (slate-600) |
| **Border light** | — | `#E2E8F0` | Card borders, dividers on light bg |
| **Border dark** | — | `#334155` | Dividers on dark bg |

### Tailwind Config Update

Update `tailwind.config.ts` to add these as custom colors:

```typescript
colors: {
  brand: {
    navy: '#0F172A',
    'navy-light': '#1E293B',
    gold: '#C9A84C',
    'gold-hover': '#B8963F',
    'gold-subtle': 'rgba(201, 168, 76, 0.12)',
    'mit-red': '#A31F34',
  }
}
```

### Global Search-and-Replace

Run these replacements across ALL `.tsx` and `.css` files in `src/`:

| Find | Replace With | Notes |
|------|-------------|-------|
| `bg-amber-500` | `bg-brand-gold` | Button backgrounds |
| `bg-amber-400` | `bg-brand-gold` | Lighter amber uses |
| `bg-amber-600` | `bg-brand-gold-hover` | Hover states |
| `hover:bg-amber-600` | `hover:bg-brand-gold-hover` | |
| `text-amber-500` | `text-brand-gold` | Accent text |
| `text-amber-400` | `text-brand-gold` | |
| `text-amber-600` | `text-brand-gold` | |
| `border-amber-500` | `border-brand-gold` | |
| `border-amber-200` | `border-brand-gold/30` | |
| `bg-amber-500/10` | `bg-brand-gold-subtle` | Subtle backgrounds |
| `#F59E0B` | `#C9A84C` | Any direct hex references |
| `#D97706` | `#B8963F` | Hover hex references |

**Important:** Do NOT replace `emerald` or `blue` classes — those are correctly used for help/learn tags.

After replacements, visually verify:
- [ ] Buttons are gold, not orange
- [ ] Progress bars use gold
- [ ] Navigation active indicators use gold
- [ ] No remaining amber/orange anywhere
- [ ] Help tags still emerald, learn tags still blue

---

## Part 2: Landing Page Redesign

### Wording Changes

The current landing page says "MIT Professional Education · Innovation Leadership 2026". This is wrong — the audience is CXOs, and the platform should accommodate multiple MIT PE programs.

**App identity:** "MIT Nexus" (keep)
**Eyebrow badge text:** `MIT PROFESSIONAL EDUCATION · CXO COHORT 2026`
**Program-specific labeling:** Moved to individual profiles (see Part 3 — Onboarding)

### Section-by-Section Spec

---

#### Section 1: Hero (full viewport, dark)

**Background:** Gradient from `#080E1A` (near-black) at top to `#0F172A` (brand-navy) at bottom.

**Layout:** Vertically + horizontally centered, `min-h-screen`, flexbox column.

**Content stack (top to bottom):**

1. **Eyebrow badge:**
   - Text: `MIT PROFESSIONAL EDUCATION · CXO COHORT 2026`
   - Style: `text-xs uppercase tracking-[0.2em] text-slate-400`
   - Container: `px-5 py-2 rounded-full border border-brand-mit-red/40 bg-brand-mit-red/8`
   - The MIT red is ONLY used here — a thin tinted border and very subtle background wash

2. **Headline:**
   - Text: `Find your people in the cohort`
   - Style: `text-5xl md:text-7xl font-bold text-white tracking-tight text-center mt-8`
   - The word **"people"** → render in `text-brand-gold italic` (one accent word, goimmersionlive.com pattern)

3. **Subheadline:**
   - Text: `A private network for 144 leaders. Discover who knows what, who's traveling where, and who you should meet this week.`
   - Style: `text-lg md:text-xl text-slate-400 font-light text-center max-w-2xl mx-auto mt-6 leading-relaxed`

4. **Email form** (use shared `EmailSignInForm` component):
   - Desktop: inline row — input left (`rounded-l-xl`), button right (`rounded-r-xl`), joined seamlessly
   - Input: dark background (`bg-slate-800/60 border border-slate-600`), white text, placeholder `you@mit.edu`
   - Button: `bg-brand-gold text-brand-navy font-semibold px-8`, text: `Get Started`
   - Mobile: stack vertically, both full-width, button below with `mt-3`
   - On submit → replace form with: `✓ Check your inbox — we sent you a magic link` in `text-emerald-400`

5. **Scroll indicator:**
   - Chevron-down icon or `↓`, `text-slate-500 animate-bounce absolute bottom-8`

---

#### Section 2: MIT Building Image Section

**This is the centerpiece that says "you belong to MIT."**

**Image source:** Use a CC-licensed photo of the MIT Great Dome / Building 10 / Killian Court from Wikimedia Commons.

Recommended files (all CC-licensed):
- `https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/MIT_Killian_Court.jpg/1280px-MIT_Killian_Court.jpg` (Killian Court wide shot, CC BY-SA 4.0)
- `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/2017_Maclaurin_Buildings_%28MIT_Building_10%29_and_Great_Dome.jpg/1280px-2017_Maclaurin_Buildings_%28MIT_Building_10%29_and_Great_Dome.jpg` (Building 10 + Dome, CC BY-SA 4.0)

**Implementation:**
1. Download the image and save it to `public/images/mit-great-dome.jpg`
2. Optimize: resize to max 1920px wide, compress to ~200KB with quality 80

**Layout:**
- Full-width section, `h-[400px] md:h-[500px]` (fixed height, NOT viewport)
- Image as CSS `background-image` with `background-size: cover; background-position: center;`
- Dark overlay: a `div` with `absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/60 to-brand-navy/80`
- This makes the image visible but muted, with text readable on top

**Text overlay (centered on the image):**
- Line 1: `Where leaders become a network.`
  - Style: `text-3xl md:text-5xl font-bold text-white text-center`
  - "network" in `text-brand-gold italic`
- Line 2 (optional): `Built on the foundation of MIT Professional Education.`
  - Style: `text-base md:text-lg text-slate-300 text-center mt-4`

**Credit (required for CC-BY-SA):** Small text at bottom-right of the image section:
- `Photo: Wikimedia Commons (CC BY-SA 4.0)`
- Style: `text-[10px] text-slate-500/50 absolute bottom-2 right-4`

---

#### Section 3: Stats Bar

**Background:** `bg-brand-navy` (solid, not gradient)

**Layout:** `py-12`, 4 stats in a centered row. Mobile: 2×2 grid.

| Value | Label |
|-------|-------|
| `144` | Leaders |
| `30+` | Countries |
| `50+` | Industries |
| `2026` | Cohort |

**Style per stat:**
- Number: `text-4xl md:text-5xl font-bold text-brand-gold`
- Label: `text-sm uppercase tracking-wide text-slate-400 mt-1`
- Container per stat: `p-4 rounded-lg bg-brand-gold-subtle` (very subtle gold glow)
- Desktop: thin `border-r border-slate-700` dividers between stats (not on last). Mobile: no dividers.

---

#### Section 4: Features Section (light)

**Background:** `bg-slate-50` (`#F8FAFC`)

**Section heading:**
- Text: `More than a directory. A launchpad.`
- "launchpad" in `text-brand-gold italic`
- Style: `text-3xl md:text-4xl font-bold text-brand-navy text-center`
- Sub-text: `Three features designed for how busy executives actually network.`
- Style: `text-lg text-slate-600 text-center mt-4 max-w-xl mx-auto`

**Cards:** `grid grid-cols-1 md:grid-cols-3 gap-8 mt-16`

Each card:
- Container: `bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-gold/30 transition-all duration-300`
- Icon: Lucide icon in a colored background pill (`w-14 h-14 rounded-xl flex items-center justify-center`)
- Title: `text-xl font-semibold text-brand-navy mt-6`
- Description: `text-base text-slate-600 mt-3 leading-relaxed`

| Card | Icon | Icon BG | Description |
|------|------|---------|-------------|
| Cohort Map | `Globe` (Lucide) | `bg-blue-500/10 text-blue-500` | See where 144 CXOs are based — and who's traveling to your city next. Pin your home, announce trips, discover neighbors you never knew you had. |
| Coffee Roulette | `Coffee` (Lucide) | `bg-brand-gold/10 text-brand-gold` | Every week, get matched with someone whose skills complement yours. You teach what you know, learn what you don't. Serendipity, engineered. |
| Direct Messages | `MessageCircle` (Lucide) | `bg-emerald-500/10 text-emerald-500` | Real-time, private conversations with anyone in the cohort. No Slack noise. No email threads. Just the conversation you need. |

---

#### Section 5: How It Works (dark)

**Background:** `bg-[#080E1A]` (near-black, darkest section)

**Section heading:**
- Text: `Up and running in two minutes`
- "two minutes" in `text-brand-gold italic`
- Style: `text-3xl md:text-4xl font-bold text-white text-center`

**Steps:** `grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 max-w-4xl mx-auto`

| # | Title | Description |
|---|-------|-------------|
| 01 | Enter your email | We send a magic link — no password to remember. |
| 02 | Set up your profile | Your name, company, what you can help with, what you want to learn. |
| 03 | Start connecting | Browse the directory, get your first match, explore the map. |

**Style per step:**
- Step number: `text-5xl font-bold text-brand-gold/25` (large, semi-transparent)
- Title: `text-lg font-semibold text-white mt-4`
- Description: `text-sm text-slate-400 mt-2`

---

#### Section 6: Quote (light)

**Background:** `bg-slate-50`

**Content:**
- Decorative open-quote mark: `text-8xl text-brand-gold/30 font-serif` positioned as a visual element
- Quote: `"The best professional networks aren't found — they're built. This cohort has the raw ingredients. This app is the kitchen."`
- Style: `text-2xl md:text-3xl font-light italic text-brand-navy text-center max-w-3xl mx-auto leading-relaxed`
- Attribution: `— Built for the MIT PE CXO Cohort 2026`
- Style: `text-base text-slate-500 mt-6 text-center`

---

#### Section 7: Final CTA (dark)

**Background:** `bg-brand-navy`

**Content:**
- Heading: `Ready to find your people?`
  - "people" in `text-brand-gold italic` (echoes hero)
  - Style: `text-3xl md:text-5xl font-bold text-white text-center`
- Sub-text: `Join the cohort network. It takes two minutes.`
  - Style: `text-lg text-slate-400 text-center mt-4`
- **Email form** — reuse the same `EmailSignInForm` component from the hero

---

#### Section 8: Footer (minimal)

**Background:** `bg-[#080E1A]` (darkest)

**Content (centered):**
- Line 1: `A cohort project by Eugene · MIT Professional Education 2026`
- Line 2: `React · Supabase · Leaflet`
- Style: `text-sm text-slate-600 text-center py-8`

---

### Component Architecture

```
src/pages/Landing.tsx
src/components/landing/
├── HeroSection.tsx
├── MITBuildingSection.tsx          ← NEW: image section with overlay
├── StatsBar.tsx
├── FeaturesSection.tsx
├── HowItWorksSection.tsx
├── QuoteSection.tsx
├── FinalCTASection.tsx
├── LandingFooter.tsx
└── EmailSignInForm.tsx             ← Shared between Hero + Final CTA
```

---

## Part 3: Onboarding Improvements

### 3A: Add Program & Cohort Year Fields

**Schema change** — add two columns to the `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN program TEXT DEFAULT 'Innovation Leadership';
ALTER TABLE profiles ADD COLUMN cohort_year INTEGER DEFAULT 2026;
```

**Onboarding Step 1 (StepBasics.tsx)** — add two new fields after the existing fields:

1. **Program** — dropdown select:
   - Options: `Innovation Leadership`, `Technology Leadership Program (TLP)`, `Digital Transformation`, `Chief Technology Officer`, `Chief Digital Officer`, `Chief Product Officer`, `Short Programs`, `Other`
   - Default: `Innovation Leadership`
   - Style: standard shadcn Select component

2. **Cohort Year** — dropdown select:
   - Options: `2024`, `2025`, `2026`, `2027`
   - Default: `2026`

These fields appear on profile cards as a badge: e.g. `Innovation Leadership · 2026`

### 3B: Improved Tag Suggestions

Replace the current tag list in `StepTags.tsx` with better CXO-relevant options, organized by category.

**"I can help with" and "I want to learn" use the same tag pool:**

**Strategy & Leadership:**
- Board Management
- CTO→CEO Transition
- Scaling from Startup to Enterprise
- M&A Due Diligence (Tech)
- Executive Communication
- Organizational Design
- OKR / Strategy Frameworks
- Building Innovation Culture

**Technology & Architecture:**
- AI/ML Strategy & Implementation
- Data Platform & Infrastructure
- Cloud Migration & Architecture
- Technical Debt Management
- Cybersecurity & Compliance
- Platform Engineering / DevOps
- API Strategy & Microservices
- Edge Computing / IoT

**Product & Growth:**
- Product-Led Growth
- Go-To-Market Strategy
- Pricing & Monetization
- Customer Data & Analytics
- UX/Design Leadership
- A/B Testing at Scale

**People & Org:**
- Hiring & Talent Strategy
- Remote/Hybrid Teams
- Engineering Culture
- Diversity & Inclusion in Tech
- Performance Management
- Team Topologies

**Business & Finance:**
- Fundraising & Investor Relations
- IP / Patent Strategy
- International Expansion
- Digital Transformation in Regulated Industries
- Vendor / Build-vs-Buy Decisions

**Implementation notes:**
- Display tags grouped by these categories with category headers in the UI
- Category headers: small text above each group, e.g. `STRATEGY & LEADERSHIP` in `text-xs uppercase tracking-wide text-slate-400`
- Keep the max-5-per-category limit
- Keep the custom tag input
- The categories are purely visual grouping — in the DB, tags are still flat strings in the `tags` table

---

## Part 4: Propagation Across Entire App

After changing the color system (Part 1) and verifying the landing page (Part 2), check every existing page and component for visual consistency.

### Checklist — Component by Component

**App Shell / Navigation (`AppShell.tsx`, `Navbar.tsx`):**
- [ ] Background: `bg-brand-navy-light` (was plain navy)
- [ ] Active nav indicator: `border-brand-gold` or `text-brand-gold` (was amber)
- [ ] User avatar area: no color change needed
- [ ] Unread message badge: `bg-brand-gold text-brand-navy` (was amber)

**Dashboard (`Dashboard.tsx`):**
- [ ] Welcome heading: `text-brand-navy` (on light bg) or `text-white` (on dark bg)
- [ ] Coffee Roulette match card: gold accent highlights
- [ ] Progress bar: `bg-brand-gold` (was amber). Track: `bg-slate-200`
- [ ] "Coffee Roulette activates at 10!" text: `text-brand-gold` (was amber)
- [ ] "Invite your cohort mates" card: button uses gold, not orange

**Onboarding (`Onboarding.tsx`, `StepBasics.tsx`, `StepTags.tsx`, `StepLocation.tsx`):**
- [ ] Step indicator: active step `bg-brand-gold`, inactive `bg-slate-300`
- [ ] "Next" / "Complete Profile" buttons: `bg-brand-gold text-brand-navy`
- [ ] Tag selection badges (help): keep `emerald` ✓
- [ ] Tag selection badges (learn): keep `blue` ✓
- [ ] Selected tag state: filled badge with appropriate color
- [ ] Add program + cohort year fields (Part 3A)
- [ ] Replace tag suggestions (Part 3B)

**Directory (`Directory.tsx`):**
- [ ] Search input focus ring: `focus:ring-brand-gold/50` (was amber)
- [ ] No other color changes expected

**Profile Card (`ProfileCard.tsx`):**
- [ ] Add program badge: small `text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5` showing `{program} · {cohort_year}`
- [ ] Any amber accents → gold

**Map (`Map.tsx`, map components):**
- [ ] Map marker clusters: check if any amber colors are used in cluster styling
- [ ] Travel pin indicators: update if amber was used
- [ ] Map popup cards: verify gold accent on "Message" or "View Profile" links

**Messages (`Messages.tsx`, `Conversation.tsx`):**
- [ ] Send button: `bg-brand-gold text-brand-navy`
- [ ] Unread indicator dots: `bg-brand-gold`
- [ ] Message timestamp: no change (should be slate/gray)
- [ ] Own message bubble vs other's message bubble: verify colors work with gold

**Coffee Roulette (`MatchCard.tsx`):**
- [ ] Match card accent: gold border or gold "Connect" button
- [ ] Shared tags highlight: can use gold underline or `bg-brand-gold/10`

**Invite Flow (`InviteCTA.tsx`, `ProgressBar.tsx`):**
- [ ] "Copy Invite Link" button: `bg-brand-gold text-brand-navy`
- [ ] Progress bar fill: `bg-brand-gold`
- [ ] Milestone text: `text-brand-gold`

**Auth pages (`AuthCallback.tsx`):**
- [ ] Loading spinner: `text-brand-gold` (if color was amber)

---

## Verification Checklist (Full App)

### Landing Page
- [ ] Hero renders with near-black gradient, gold accent word, MIT red eyebrow badge
- [ ] Email form works: submit → "check your inbox" confirmation
- [ ] MIT building section shows photo with dark overlay and text
- [ ] Stats bar shows 4 stats with gold numbers
- [ ] Feature cards render with Lucide icons and correct descriptions
- [ ] How It Works shows 3 numbered steps
- [ ] Quote section renders cleanly
- [ ] Final CTA has working email form
- [ ] Footer shows attribution
- [ ] Authenticated users redirect to `/dashboard` (never see landing)
- [ ] Responsive: looks good at 375px, 768px, 1440px

### Color System
- [ ] No remaining amber/orange (#F59E0B, #D97706) anywhere in the app
- [ ] All CTA buttons use gold (#C9A84C)
- [ ] MIT red (#A31F34) appears ONLY in the landing page eyebrow badge
- [ ] Help tags still emerald, learn tags still blue
- [ ] All dark backgrounds use brand-navy or darker
- [ ] Progress bars use gold
- [ ] The overall vibe is "premium tech" not "streaming site"

### Onboarding
- [ ] Program dropdown appears in Step 1 with correct options
- [ ] Cohort year dropdown appears in Step 1
- [ ] Tags in Step 2 are organized by category with headers
- [ ] All new CXO-relevant tags appear
- [ ] Max-5 limit still enforced per category
- [ ] Custom tag input still works
- [ ] Profile card shows program badge after onboarding

### Cross-App
- [ ] Navigation active state uses gold
- [ ] Dashboard progress bar uses gold
- [ ] Messages send button uses gold
- [ ] Invite link button uses gold
- [ ] No console errors
- [ ] No visual regressions on any page

---

*Spec created: 2026-03-19*
*Scope: Full visual redesign — color system + landing page + onboarding + global propagation*
*Design direction: Muted gold accent (#C9A84C) + MIT red badge (#A31F34) + dark navy base (#0F172A)*
