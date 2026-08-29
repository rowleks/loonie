# AGENTS.md

Instructions for any AI coding agent (Claude Code, Cursor, Copilot Workspace, etc.) working in this repository. Read this before making changes. If a request conflicts with this file, follow this file and flag the conflict rather than silently picking one.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before writing any code. Heed deprecation notices.

## Project context

This is a multi-tenant cleaning-service booking platform (see `PRD.md` for full product context). It has three user-facing surfaces sharing one Next.js codebase: **customer**, **admin**, **cleaner**. Treat these as separate concerns even though they live in one repo — a change to the customer booking flow should not casually touch admin logic, and vice versa.

## Stack — do not substitute without being asked

- Next.js 15, App Router, TypeScript (strict mode on)
- Drizzle ORM (never introduce Prisma, raw SQL clients, or another ORM alongside it)
- NextAuth v5 (Auth.js) for auth — not Clerk, not a custom auth system
- PostgreSQL (Neon)
- Stripe for all payments — never store raw card data
- Resend for email, Twilio for SMS
- Tailwind CSS for styling

If a task seems to need a different tool than what's listed here, say so and ask rather than adding a new dependency silently.

## Folder structure (established — follow it)

```
app/
  (marketing)/       public site
  (auth)/             sign in / sign up
  (customer)/dashboard/
  (admin)/admin/
  (cleaner)/jobs/
  api/                 route handlers, webhooks only — prefer Server Actions elsewhere
  components/          shared UI
db/
  schema.ts            Drizzle schema — single source of truth for data shape
  index.ts             db client
auth.ts                 NextAuth v5 config
lib/                     shared utilities (availability, booking rules, etc.)
```

Route groups `(customer)`, `(admin)`, `(cleaner)` each have their own layout with a server-side role check. Every new page in one of these groups must sit under the matching layout — never create a standalone route that bypasses the role check.

## Non-negotiable rules

1. **Every `org_id`-bearing table gets `org_id` on every new table you add.** This app is multi-tenant from the schema up. Don't add a table that implicitly assumes there's only one organization.

2. **Role checks happen server-side, on every mutating action** — Server Actions and route handlers must re-check `session.user.role` and ownership (e.g. "is this booking actually this customer's / this cleaner's") even if the UI already hides the button. Client-side hiding is UX, not security.

3. **Bookings are only created from the Stripe webhook**, never from the client-side "payment succeeded" redirect. The webhook (`checkout.session.completed`) is the single source of truth for "did payment actually happen."

4. **Cancellation/reschedule cutoff (24hr) is enforced in the shared `lib/booking-rules.ts` function**, called from both the UI (to grey out buttons) and the server action (to actually block it). Don't duplicate this logic inline elsewhere — import the function.

5. **No card data, ever, in our database or logs.** Stripe Checkout / Billing Portal handles all of it.

6. **Prefer Server Components + Server Actions over client-side fetching** for dashboard data. Only reach for `"use client"` and client state when there's real interactivity (multi-step forms, buttons with local pending state).

7. **Schema changes go through Drizzle migrations** (`drizzle-kit generate`), never hand-edited SQL against the live DB.

## Conventions

- TypeScript strict — no `any` without a comment explaining why it's unavoidable
- Prefer small, composable queries in `lib/` over inline queries scattered across pages, once a query is used in more than one place
- Naming: tables/columns `snake_case` in the DB (Drizzle default), `camelCase` in TS
- Every new Server Action does an auth check as its **first** lines, before any DB read/write
- Keep the three route groups visually and functionally distinct — admin and cleaner views should look and feel like internal tools, not the marketing/customer brand

## When adding a feature, check first

- Does `PRD.md` already scope this into a phase? If it's a Phase 2/3 item, flag that you're pulling it forward rather than building it silently.
- Does this need a new table, or does it belong on an existing one (e.g. don't create a separate "cleaner" table — cleaners are `users` with `role: cleaner`)?
- Does this introduce a new third-party dependency? If so, name it explicitly and explain why an existing tool in the stack can't do it.

## What NOT to do

- Don't add Prisma, a second ORM, or a second auth library "just to try it"
- Don't build native mobile (React Native) work — that's an explicit later-phase decision, not default scope
- Don't add Mapbox/Google Maps for the service-area check — that's deferred until precise geocoding is actually needed (see PRD §7)
- Don't invent a permissions/roles system beyond the three-role enum unless asked — keep it simple until there's a real need
- Don't write directly to `main`/`production` config or secrets — flag what env vars are needed and let a human set them

## Environment variables agents should expect (not values, just names)

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
NEXT_PUBLIC_URL
```

If a task needs a new one, name it clearly and explain what it's for rather than hardcoding a value.
