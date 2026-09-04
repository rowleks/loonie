import Link from 'next/link'
import { BookingCard } from '@/app/(admin)/admin/_components/booking-card'
import { requireRole } from '@/lib/auth'
import { filterAvailableCleaners } from '@/lib/availability'
import {
  getActiveCleaners,
  getAdminMetrics,
  getBookingsStartingBetween,
  getScheduledBookingsBetween,
  getUnassignedUpcoming,
  type BookingListItem,
} from '@/lib/booking-queries'
import { formatDay, getTodayRange } from '@/lib/datetime'
import { formatMoney } from '@/lib/format'

const CONFLICT_HORIZON_DAYS = 14

export default async function AdminDashboardPage() {
  const admin = await requireRole('admin')
  const now = new Date()
  const today = getTodayRange(now)
  const horizonEnd = new Date(
    today.start.getTime() + CONFLICT_HORIZON_DAYS * 24 * 60 * 60 * 1000,
  )

  const [todayBookings, unassigned, cleaners, metrics, scheduled] =
    await Promise.all([
      getBookingsStartingBetween(admin.orgId, today.start, today.end),
      getUnassignedUpcoming(admin.orgId, now),
      getActiveCleaners(admin.orgId),
      getAdminMetrics(admin.orgId, now),
      getScheduledBookingsBetween(admin.orgId, now, horizonEnd),
    ])

  // Conflict-free cleaner options per booking (PRD §5) — the action
  // re-checks server-side on submit; this only shapes the dropdown.
  const availableCleanersFor = (booking: BookingListItem) =>
    filterAvailableCleaners(
      cleaners,
      booking,
      scheduled.filter((slot) => slot.id !== booking.id),
    )

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="page-title">Today&rsquo;s schedule</h1>
        <p className="text-sm text-muted-foreground">{formatDay(now)}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="label">Jobs today</div>
          <div className="stat-number mt-1">{metrics.todayCount}</div>
        </div>
        <div className="card p-5">
          <div className="label">Needs assignment</div>
          <div className={`stat-number mt-1 ${metrics.unassignedCount > 0 ? 'text-accent' : ''}`}>
            {metrics.unassignedCount}
          </div>
        </div>
        <div className="card p-5">
          <div className="label">Revenue this month</div>
          <div className="stat-number mt-1">
            {formatMoney(metrics.monthRevenueCents)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            from {metrics.monthCompletedCount} completed{' '}
            {metrics.monthCompletedCount === 1 ? 'job' : 'jobs'}
          </div>
        </div>
      </div>

      {unassigned.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold">Needs a cleaner</h2>
            <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {unassigned.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Upcoming bookings without an assigned cleaner — assign before these
            become no-shows.{' '}
            <Link href="/admin/bookings" className="text-primary hover:underline">
              View all bookings
            </Link>
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {unassigned.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                cleaners={availableCleanersFor(booking)}
                showDay
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Schedule</h2>
        {todayBookings.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="text-sm text-muted-foreground">
              Nothing scheduled today.{' '}
              <Link href="/admin/bookings/new" className="text-primary hover:underline">
                Enter a phone booking
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {todayBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                cleaners={availableCleanersFor(booking)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

