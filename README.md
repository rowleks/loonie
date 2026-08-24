# Loonie Platform

A booking and operations platform for residential/commercial cleaning businesses. Customers book and manage cleanings online, admins run day-to-day operations (scheduling, cleaner assignment, revenue), and cleaners see their daily jobs and update status from their phone.

Built for Loonie Cleaning Services (Metro Vancouver) as the first deployment, but multi-tenant (`organizations` table) from day one so it can later be sold/licensed to other cleaning companies without a rewrite.

## Surfaces

One Next.js codebase, three distinct concerns plus marketing:

- **Customer** — booking flow (service → address/service-area check → date/time/availability → review → Stripe → confirmation), dashboard with upcoming/history bookings, reschedule/cancel (24hr cutoff), address management, Stripe billing portal
- **Admin** — today's schedule, unassigned-job alerts, cleaner assignment & management, basic revenue/volume metrics
- **Cleaner** — mobile-first installable PWA: today's jobs in order, tap-to-call/tap-to-map, start/complete status updates, job history
- **Marketing site** — home, services, pricing, about, contact (SEO is a real acquisition channel)

## Tech stack

Next.js 15 (App Router) · TypeScript (strict) · Drizzle ORM · PostgreSQL (Neon) · NextAuth v5 (Auth.js) · Stripe (Checkout + Billing Portal) · Resend (email) · Twilio (SMS) · Tailwind CSS · Vercel hosting

Do not substitute any of these without discussion — see `AGENTS.md`.

## Getting started

1. `npm install`
2. Create `.env.local` with the environment variables listed below (values set by a human, never committed)
3. Generate and run Drizzle migrations: `drizzle-kit generate`
4. `npm run dev`

Environment variable names: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `NEXT_PUBLIC_URL`.

## Key rules (full details in `AGENTS.md`)

- **Multi-tenancy**: every core table carries `org_id` — don't add tables that assume one organization
- **Security**: every mutating Server Action / route handler re-checks `session.user.role` and ownership server-side; client-side hiding is UX, not security
- **Bookings are created only from the Stripe webhook** (`checkout.session.completed`) — never trust the client-side success redirect alone
- **Cancellation/reschedule 24hr cutoff** lives in `src/lib/booking-rules.ts` — import it in both UI and server actions, don't duplicate inline
- **No card data, ever**, in the database or logs — Stripe handles all of it
- Prefer Server Components + Server Actions over client-side fetching; `"use client"` only where there's real interactivity
- Schema changes go through Drizzle migrations, never hand-edited SQL against the live DB

## Structure

Route groups `(marketing)`, `(auth)`, `(customer)/dashboard`, `(admin)/admin`, `(cleaner)/jobs` share one app; each role group has its own layout with a server-side role check. The Drizzle schema (`src/db/schema.ts`) is the single source of truth for data shape. Shared logic (availability, booking rules) lives in `src/lib/`. Route handlers and webhooks sit under `src/app/api/`; everything else prefers Server Actions.

## Further reading

- `PRD.md` — phased scope, key flows, data model, open questions
- `AGENTS.md` — conventions and non-negotiable rules for anyone (or any agent) working in this repo
