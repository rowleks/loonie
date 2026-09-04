import { BookingCard } from '@/app/(admin)/admin/_components/booking-card'
import { requireRole } from '@/lib/auth'
import { filterAvailableCleaners } from '@/lib/availability'
import {
  getActiveCleaners,
  getBookingsFrom,
  getPastBookings,
  getScheduledBookingsBetween,
  type BookingListItem,
} from '@/lib/booking-queries'
import { getTodayRange } from '@/lib/datetime'

const CONFLICT_HORIZON_DAYS = 30
const HISTORY_LIMIT = 30

export default async function AdminBookingsPage() {
  const admin = await requireRole('admin')
  const now = new Date()
  const today = getTodayRange(now)
  const horizonEnd = new Date(
    today.start.getTime() + CONFLICT_HORIZON_DAYS * 24 * 60 * 60 * 1000,
  )

  const [upcoming, past, cleaners, scheduled] = await Promise.all([
    getBookingsFrom(admin.orgId, today.start),
    getPastBookings(admin.orgId, now, HISTORY_LIMIT),
    getActiveCleaners(admin.orgId),
    getScheduledBookingsBetween(admin.orgId, now, horizonEnd),
  ])

  const availableCleanersFor = (booking: BookingListItem) =>
    filterAvailableCleaners(
      cleaners,
      booking,
      scheduled.filter((slot) => slot.id !== booking.id),
    )

  const activeUpcoming = upcoming.filter((booking) => !['cancelled', 'completed'].includes(booking.status))

  return (
    <div>
      <h1 className="page-title">Bookings</h1>

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Upcoming</h2>
        {activeUpcoming.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {activeUpcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                cleaners={availableCleanersFor(booking)}
                showDay
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">Past</h2>
        {past.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="text-sm text-muted-foreground">No past bookings yet.</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} cleaners={[]} showDay />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
