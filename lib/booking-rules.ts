import type { BookingStatus } from '@/db/schema'

/**
 * Single source of truth for booking modification rules (AGENTS.md rule #4).
 * Both the UI (greying out buttons) and server actions (actually blocking)
 * import from here — never duplicate the cutoff inline.
 */

export const CANCELLATION_CUTOFF_HOURS = 24
export const CANCELLATION_CUTOFF_MS = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000

/** Statuses a booking must be in to still be modified by a customer. */
const CUSTOMER_MODIFIABLE_STATUSES: BookingStatus[] = ['pending', 'confirmed']

/** True when the booking starts at or beyond the 24h cutoff from `now`. */
export function isBeyondCutoff(scheduledStart: Date, now: Date = new Date()): boolean {
  return scheduledStart.getTime() - now.getTime() >= CANCELLATION_CUTOFF_MS
}

/**
 * Whether the *customer* may cancel this booking. The 24h cutoff (PRD §5)
 * applies; admins bypass it deliberately — the office has discretion for
 * no-shows and emergencies, and the admin action documents that override.
 */
export function canCancelBooking(
  booking: { status: BookingStatus; scheduledStart: Date },
  now: Date = new Date(),
): boolean {
  return (
    CUSTOMER_MODIFIABLE_STATUSES.includes(booking.status) &&
    isBeyondCutoff(booking.scheduledStart, now)
  )
}

/** Whether the *customer* may reschedule this booking (same cutoff rules). */
export function canRescheduleBooking(
  booking: { status: BookingStatus; scheduledStart: Date },
  now: Date = new Date(),
): boolean {
  return canCancelBooking(booking, now)
}
