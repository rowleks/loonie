# Product Requirements Document

## Product Name
_Working title:_ **Loonie Platform** (customer-facing brand may stay "Loonie Cleaning Services"; the software itself is being built as a reusable product, not a one-off site)

## 1. Summary

A booking and operations platform for residential/commercial cleaning businesses. Customers book and manage cleanings online; admins run day-to-day operations (scheduling, cleaner assignment, revenue); cleaners see their daily jobs and update status from their phone.

The initial deployment is for Loonie Cleaning Services (Metro Vancouver), but the system is architected multi-tenant from day one (`organizations` table) so it can later serve other cleaning companies as a SaaS product without a rewrite.

## 2. Goals

**Business goals**
- Replace manual/phone-based booking with a self-serve online flow
- Give ops staff a single place to see and manage the day's schedule
- Reduce no-shows/confusion via automated confirmations and reminders
- Build a foundation that could be sold/licensed to other cleaning companies later

**Non-goals (for v1)**
- Not building a general-purpose marketplace (no third-party/freelance cleaners bidding on jobs)
- Not building native iOS/Android apps at launch — responsive web + installable PWA covers the mobile need first
- Not building automatic route optimization or GPS live-tracking at launch

## 3. Users & Roles

| Role | Who | Core need |
|---|---|---|
| Customer | Homeowner/business booking a clean | Book fast, manage/reschedule, trust it'll happen |
| Admin | Office/ops staff | See the day, assign cleaners, avoid double-bookings |
| Cleaner | Field staff | Know where to go and what to do, mark jobs done |

A single `users` table with a `role` enum covers all three — a cleaner and an admin are both just a "user" with different permissions, not separate systems.

## 4. Scope by Phase

### Phase 1 — Core Platform (MVP, matches job-posting requirements)
- Marketing site (SEO-optimized): home, services, pricing, about, contact
- Auth (NextAuth v5): email/password + optional Google sign-in, role-based sessions
- Booking flow: service → address (service-area check) → date/time (availability check) → review → Stripe payment → confirmation
- Customer dashboard: upcoming booking, history, reschedule/cancel (24hr cutoff), manage addresses, Stripe billing portal
- Admin dashboard: today's schedule, unassigned-job alerts, cleaner assignment, cleaner management (invite/deactivate), basic revenue/volume metrics
- Cleaner view (mobile-first, PWA-installable): today's jobs in order, tap-to-call, tap-to-map, start/complete status updates, job history

### Phase 2 — Retention & Automation
- Recurring/subscription cleaning plans (weekly/biweekly/monthly), managed via Stripe Subscriptions
- Automated notifications: booking confirmation, day-before reminder, cleaner-assigned notice (email via Resend, SMS via Twilio)
- Customer reviews/ratings, triggered after job marked complete

### Phase 3 — Scale & Differentiation
- Auto-assignment of cleaners (proximity/availability-based), replacing manual dropdown assignment
- Full BI-style metrics/reporting (charts, trends, cleaner performance)
- Multi-org onboarding flow (self-serve signup for a *new* cleaning company) — this is the point the product becomes sellable as SaaS
- Native mobile app (React Native) if PWA limitations (background location, reliable push, offline) become a real blocker

## 5. Key Flows (already designed — see architecture notes)

- **Booking**: single-page multi-step form, booking row only created server-side via Stripe webhook (never trust client-side "payment succeeded" redirect alone)
- **Cancellation/reschedule**: enforced 24hr cutoff, checked both client-side (UX) and server-side (source of truth)
- **Cleaner assignment**: admin picks from a dropdown pre-filtered to cleaners without a scheduling conflict at that time
- **Multi-tenancy**: every core table carries `org_id`; Loonie is simply the first row in `organizations`

## 6. Data Model (v1 core tables)

`organizations`, `users` (role: customer/cleaner/admin), `addresses`, `services`, `bookings` (status: pending/confirmed/in_progress/completed/cancelled). Payments tracked via Stripe (no card data stored locally). Subscriptions, reviews added in Phase 2.

## 7. Tech Stack (decided — do not re-litigate without discussion)

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| ORM | Drizzle |
| Database | PostgreSQL (Neon) |
| Auth | NextAuth v5 (Auth.js) |
| Payments | Stripe (Checkout + Billing Portal + Subscriptions) |
| Notifications | Resend (email), Twilio (SMS) |
| Hosting | Vercel |
| Maps | Deferred — start with a static serviceable-postal-code list; add Mapbox/Google Maps only when precise geocoding/routing is actually needed |

## 8. Non-functional requirements

- **Security**: no card data touches our servers (Stripe handles it); role checks enforced server-side on every mutating action, not just hidden in the UI
- **Performance**: server-rendered dashboards (no client loading spinners for initial data)
- **SEO**: marketing pages must be crawlable/indexable — this is a real acquisition channel for the business, not an afterthought
- **Mobile**: cleaner view must work well as an installed PWA; customer flow must work well on mobile browsers (majority of bookings likely start there)

## 9. Success Metrics (v1)

- % of bookings made without a phone call to the office
- Time from "admin opens dashboard" to "all jobs assigned" each morning
- Booking cancellation/no-show rate
- Page load / Core Web Vitals on marketing pages (SEO impact)

## 10. Open Questions

- Pricing model: flat per-service pricing (assumed for v1) vs. quote-based for commercial/large jobs?
- Do we need per-cleaner specializations/skills (e.g. move-out cleans only for certain staff) before Phase 3 auto-assignment makes sense?
- How far should the multi-tenant abstraction go in Phase 1 — just the `org_id` column, or full org-scoped auth/branding too?
