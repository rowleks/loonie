import { and, eq, gt, inArray, lt, ne } from 'drizzle-orm'
import { db } from '@/db'
import { bookings } from '@/db/schema'
import type { BookingStatus } from '@/db/schema'

/** Statuses that hold a cleaner's time — completed/cancelled jobs don't conflict. */
export const BLOCKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress']

export type SchedulingWindow = {
  scheduledStart: Date
  scheduledEnd: Date
}

export type ScheduledBooking = {
  id: string
  cleanerId: string | null
  status: BookingStatus
} & SchedulingWindow

export function intervalsOverlap(a: SchedulingWindow, b: SchedulingWindow): boolean {
  return a.scheduledStart < b.scheduledEnd && b.scheduledStart < a.scheduledEnd
}

export function hasBlockingStatus(status: BookingStatus): boolean {
  return BLOCKING_STATUSES.includes(status)
}

/**
 * Conflict check against an already-loaded set of bookings — used for the
 * admin UI's pre-filtered assignment dropdown (PRD §5: dropdown shows only
 * conflict-free cleaners).
 */
export function conflictsWith(
  cleanerId: string,
  window: SchedulingWindow,
  others: ScheduledBooking[],
): boolean {
  return others.some(
    (other) =>
      other.cleanerId === cleanerId &&
      hasBlockingStatus(other.status) &&
      intervalsOverlap(window, other),
  )
}

/** Conflict-free subset of cleaner candidates for a time window. */
export function filterAvailableCleaners<T extends { id: string }>(
  cleaners: T[],
  window: SchedulingWindow,
  scheduledBookings: ScheduledBooking[],
): T[] {
  return cleaners.filter(
    (cleaner) => !conflictsWith(cleaner.id, window, scheduledBookings),
  )
}

/**
 * DB-backed conflict lookup — the server-side source of truth. Every action
 * that assigns or schedules a cleaner re-checks conflicts here, even if the
 * UI pre-filtered the dropdown.
 */
export function findConflictingBookings(params: {
  cleanerId: string
  scheduledStart: Date
  scheduledEnd: Date
  excludeBookingId?: string
}): Promise<Array<typeof bookings.$inferSelect>> {
  const { cleanerId, scheduledStart, scheduledEnd, excludeBookingId } = params

  const conditions = [
    eq(bookings.cleanerId, cleanerId),
    inArray(bookings.status, BLOCKING_STATUSES),
    lt(bookings.scheduledStart, scheduledEnd),
    gt(bookings.scheduledEnd, scheduledStart),
  ]
  if (excludeBookingId) conditions.push(ne(bookings.id, excludeBookingId))

  return db
    .select()
    .from(bookings)
    .where(and(...conditions))
}
