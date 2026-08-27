import type { Metadata } from 'next'
import { ThemeToggle } from '../components/theme-toggle'

export const metadata: Metadata = {
  title: 'Style Guide — Loonie',
  description: 'Living reference for the Loonie design system.',
}

/* Inline color-dot helper (server component, no client JS) */
function Swatch({
  token,
  label,
  className = '',
}: {
  token: string
  label: string
  className?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-14 w-full rounded-lg border ${className}`}
        style={{ backgroundColor: token }}
      />
      <div>
        <div className="text-xs font-semibold text-foreground">{label}</div>
        <div className="font-mono text-[11px] text-muted-foreground">
          {token}
        </div>
      </div>
    </div>
  )
}

export default function StyleGuidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      {/* Header */}
      <header className="mb-14 flex items-start justify-between gap-4">
        <div>
          <div className="label mb-1">Loonie design system</div>
          <h1 className="page-title">Style guide</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Colors */}
      <section className="mb-14">
        <h2 className="font-display mb-1 text-xl font-bold tracking-tight">
          Colors
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Semantic HSL tokens defined in <code>app/globals.css</code>. Coral is
          reserved for data and highlights — never used for primary actions.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <Swatch token="hsl(172 55% 35%)" label="primary" />
          <Swatch token="hsl(14 100% 64%)" label="accent" />
          <Swatch token="hsl(158 62% 38%)" label="success" />
          <Swatch token="hsl(36 90% 48%)" label="warning" />
          <Swatch token="hsl(0 72% 50%)" label="destructive" />
          <Swatch token="hsl(180 6% 98%)" label="background" />
          <Swatch token="hsl(0 0% 100%)" label="card" className="shadow-sm" />
          <Swatch token="hsl(180 6% 95%)" label="muted" />
          <Swatch token="hsl(200 12% 11%)" label="foreground" />
          <Swatch token="hsl(200 5% 45%)" label="muted-foreground" />
          <Swatch token="hsl(180 8% 91%)" label="border" />
          <Swatch token="hsl(172 55% 35% / 0.1)" label="primary / 10% (chip)" />
        </div>

        <h3 className="mt-8 mb-3 text-sm font-semibold text-foreground">
          Chart palette
        </h3>
        <div className="grid grid-cols-5 gap-4">
          <Swatch token="hsl(172 55% 40%)" label="chart-1" />
          <Swatch token="hsl(14 100% 60%)" label="chart-2" />
          <Swatch token="hsl(215 25% 55%)" label="chart-3" />
          <Swatch token="hsl(36 90% 55%)" label="chart-4" />
          <Swatch token="hsl(280 40% 55%)" label="chart-5" />
        </div>
      </section>

      {/* Typography */}
      <section className="mb-14">
        <h2 className="font-display mb-1 text-xl font-bold tracking-tight">
          Typography
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Sora for display moments (headlines, page titles, stat
          numbers); Inter for all UI, body and data.
        </p>
        <div className="card divide-y p-6">
          <div className="py-4 first:pt-0 last:pb-0">
            <div className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Book a spotless home
            </div>
            <div className="label mt-2">
              Display / Sora 700 — marketing hero
            </div>
          </div>
          <div className="py-4">
            <div className="page-title">Today&apos;s schedule</div>
            <div className="label mt-2">Page title / Sora 700</div>
          </div>
          <div className="py-4">
            <div className="flex items-center justify-between">
              <span>
                <span className="stat-number">1,248</span>
                <span className="ml-2 text-xs font-medium text-success">
                  +12%
                </span>
              </span>
              <span className="stat-number">98.50</span>
            </div>
            <div className="label mt-2">
              Stat numbers / Sora 700, tabular-nums
            </div>
          </div>
          <div className="py-4">
            <div className="text-base font-semibold text-foreground">
              Card title — Deep clean, 3 bed / 2 bath
            </div>
            <div className="label mt-2">Card title / Inter 600</div>
          </div>
          <div className="py-4">
            <p className="max-w-prose text-sm text-foreground">
              Body copy — Your cleaner arrives between 9 and 11 am. You&apos;ll
              get a text when they&apos;re on the way, and you can reschedule
              free of charge up to 24 hours before the booking.
            </p>
            <div className="label mt-2">Body / Inter 400, text-sm</div>
          </div>
          <div className="py-4">
            <div className="text-xs font-medium text-muted-foreground">
              Label — BK-2024-0187 · Sat, Mar 14 · 9:00–11:00 am
            </div>
            <div className="label mt-2">
              Labels &amp; metadata / Inter 500, text-xs
            </div>
          </div>
        </div>
      </section>

      {/* Buttons + forms */}
      <section className="mb-14">
        <h2 className="font-display mb-1 text-xl font-bold tracking-tight">
          Buttons &amp; forms
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Declared with <code>@apply</code> in globals.css — semantic class
          names in JSX, tokens as the source of truth.
        </p>
        <div className="card mb-4 flex flex-wrap items-center gap-3 p-6">
          <button className="btn-primary">Book a cleaning</button>
          <button className="btn-secondary">Manage booking</button>
          <button className="btn-ghost">View history</button>
          <button className="btn-destructive">Cancel booking</button>
          <button className="btn-primary" disabled>
            Processing…
          </button>
        </div>
        <div className="card grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sg-name" className="label">
              Full name
            </label>
            <input id="sg-name" className="input" placeholder="Owen Brady" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sg-email" className="label">
              Email
            </label>
            <input
              id="sg-email"
              type="email"
              className="input"
              placeholder="owen@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="sg-address" className="label">
              Service address
            </label>
            <input
              id="sg-address"
              className="input"
              placeholder="1234 W 12th Ave, Vancouver"
            />
          </div>
        </div>
      </section>

      {/* Signature: chips + stat cards */}
      <section className="mb-14">
        <h2 className="font-display mb-1 text-xl font-bold tracking-tight">
          Chips &amp; stat cards
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The signature element — icons, statuses and metrics sit in tinted
          chips at 10% of their semantic color. Works identically in both modes.
        </p>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="chip-primary">✓</span>
          <span className="chip-accent">★</span>
          <span className="chip-success">↗</span>
          <span className="chip-warning">!</span>
          <span className="chip-destructive">↘</span>
          <span className="label ml-2">
            .chip-primary / -accent / -success / -warning / -destructive
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card card-hover p-5">
            <div className="label mb-3">Upcoming bookings</div>
            <div className="flex items-end justify-between">
              <span className="stat-number">12</span>
              <span className="chip-primary text-sm font-semibold">↗ +3</span>
            </div>
          </div>
          <div className="card card-hover p-5">
            <div className="label mb-3">Completed this month</div>
            <div className="flex items-end justify-between">
              <span className="stat-number">48</span>
              <span className="chip-success text-sm font-semibold">↗ +12%</span>
            </div>
          </div>
          <div className="card card-hover p-5">
            <div className="label mb-3">Cancellations</div>
            <div className="flex items-end justify-between">
              <span className="stat-number">2</span>
              <span className="chip-destructive text-sm font-semibold">
                ↘ −8%
              </span>
            </div>
          </div>
          <div className="card card-hover p-5">
            <div className="label mb-3">Revenue (MTD)</div>
            <div className="flex items-end justify-between">
              <span className="stat-number">$4,280</span>
              <span className="chip-accent text-sm font-semibold">●</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar tokens */}
      <section className="mb-14">
        <h2 className="font-display mb-1 text-xl font-bold tracking-tight">
          Sidebar pattern
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Shared tokens keep admin, cleaner and customer dashboards consistent.
        </p>
        <div className="card overflow-hidden p-0">
          <div className="grid sm:grid-cols-[220px_1fr]">
            <aside
              className="border-sidebar-border flex flex-col gap-1 border-r p-4"
              style={{
                backgroundColor: 'hsl(var(--sidebar))',
                color: 'hsl(var(--sidebar-foreground))',
              }}
            >
              <div className="font-display mb-4 px-3 text-lg font-bold">
                <span className="text-primary">Loonie</span> Admin
              </div>
              <div
                className="rounded-lg px-3 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: 'hsl(var(--sidebar-accent))',
                  color: 'hsl(var(--sidebar-accent-foreground))',
                }}
              >
                Dashboard
              </div>
              <div className="text-muted-foreground px-3 py-2 text-sm">
                Schedule
              </div>
              <div className="text-muted-foreground px-3 py-2 text-sm">
                Cleaners
              </div>
            </aside>
            <div className="p-6">
              <div className="page-title">Dashboard</div>
              <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                Sidebar background, active state and border come from the
                <code> --sidebar-*</code> tokens — swap the active item to
                re-skin for cleaner or customer layouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t pt-6 text-xs text-muted-foreground">
        Toggle dark mode top-right to review both palettes. Radii: cards 16px,
        buttons/inputs 12px. Shadows are near-flat — depth comes from
        canvas/card contrast.
      </footer>
    </div>
  )
}
