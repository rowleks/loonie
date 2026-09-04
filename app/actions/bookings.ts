'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import {
  addresses,
  bookings,
  services,
  users,
  type BookingStatus,
} from '@/db/schema'
import { requireRole, type SessionUser } from '@/lib/auth'
import { findConflictingBookings } from '@/lib/availability'
import {
  ORG_TIMEZONE,
  parseDateInput,
  parseTimeInput,
  zonedDateTimeToInstant,
} from '@/lib/datetime'
import { normalizePostalCode } from '@/lib/format'
import {
  addressSchema,
  createBookingSchema,
  setBookingCleanerSchema,
  setBookingStatusSchema,
} from '@/lib/validators'
import type { FormState } from '@/lib/form-state'

/**
 * Legal admin status transitions. Cancelling from the admin surface bypasses
 * the 24h customer cutoff *deliberately* (office discretion for emergencies/
 * no-shows) — customer-facing actions must go through lib/booking-rules.ts.
 */
const ADMIN_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function revalidateBookingPaths(): void {
  revalidatePath('/admin')
  revalidatePath('/admin/bookings')
  revalidatePath('/jobs')
  revalidatePath('/jobs/history')
}

/** Org-scoped booking fetch — admin can only ever touch their own org's rows. */
async function getOrgBooking(actor: SessionUser, bookingId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.orgId, actor.orgId)))
    .limit(1)
  return booking ?? null
}

export async function setBookingCleanerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = setBookingCleanerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid assignment request.' }

  const booking = await getOrgBooking(admin, parsed.data.bookingId)
  if (!booking) return { error: 'Booking not found.' }

  let cleanerId: string | null = null
  if (parsed.data.cleanerId) {
    // Cleaner must exist in the admin's org and be active.
    const [cleaner] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, parsed.data.cleanerId),
          eq(users.orgId, admin.orgId),
          eq(users.role, 'cleaner'),
        ),
      )
      .limit(1)
    if (!cleaner) return { error: 'Cleaner not found in your organization.' }
    cleanerId = cleaner.id

    // Server-side conflict re-check (UI dropdown pre-filtering is UX only).
    const conflicts = await findConflictingBookings({
      cleanerId,
      scheduledStart: booking.scheduledStart,
      scheduledEnd: booking.scheduledEnd,
      excludeBookingId: booking.id,
    })
    if (conflicts.length > 0) {
      return { error: 'That cleaner already has a job overlapping this time slot.' }
    }
  }

  await db
    .update(bookings)
    .set({ cleanerId, updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  revalidateBookingPaths()
  return {
    error: null,
    success: cleanerId ? 'Cleaner assigned.' : 'Cleaner unassigned.',
  }
}

export async function setBookingStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = setBookingStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid status update.' }

  const booking = await getOrgBooking(admin, parsed.data.bookingId)
  if (!booking) return { error: 'Booking not found.' }

  if (!ADMIN_TRANSITIONS[booking.status].includes(parsed.data.status)) {
    return { error: `Can't move a ${booking.status.replace('_', ' ')} booking to ${parsed.data.status.replace('_', ' ')}.` }
  }

  await db
    .update(bookings)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  revalidateBookingPaths()
  return { error: null, success: 'Booking updated.' }
}

/**
 * Phone-booking entry (office took a call). Admin-created bookings are taken
 * as paid offline and confirmed directly — online bookings (next stage) go
 * through Stripe Checkout and are ONLY created by the webhook (AGENTS.md #3).
 */
export async function createBookingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = createBookingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  }

  const [service] = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.id, parsed.data.serviceId),
        eq(services.orgId, admin.orgId),
        eq(services.isActive, true),
      ),
    )
    .limit(1)
  if (!service) return { error: 'Service not found.' }

  const [customer] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, parsed.data.customerId),
        eq(users.orgId, admin.orgId),
        eq(users.role, 'customer'),
      ),
    )
    .limit(1)
  if (!customer) return { error: 'Customer not found.' }

  // Either an existing address (owned by this customer) or a new inline one.
  let addressId: string
  if (parsed.data.addressId) {
    const [address] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(
        and(
          eq(addresses.id, parsed.data.addressId),
          eq(addresses.orgId, admin.orgId),
          eq(addresses.userId, customer.id),
        ),
      )
      .limit(1)
    if (!address) return { error: 'Address not found for this customer.' }
    addressId = address.id
  } else {
    const addressParsed = addressSchema.safeParse({
      label: formData.get('addressLabel'),
      street: formData.get('addressStreet'),
      unit: formData.get('addressUnit'),
      city: formData.get('addressCity'),
      province: formData.get('addressProvince') ?? 'BC',
      postalCode: formData.get('addressPostalCode'),
    })
    if (!addressParsed.success) {
      return {
        error: addressParsed.error.issues[0]?.message ?? 'Enter the service address.',
      }
    }
    const [created] = await db
      .insert(addresses)
      .values({
        orgId: admin.orgId,
        userId: customer.id,
        label: addressParsed.data.label,
        street: addressParsed.data.street,
        unit: addressParsed.data.unit,
        city: addressParsed.data.city,
        province: addressParsed.data.province,
        postalCode: normalizePostalCode(addressParsed.data.postalCode),
      })
      .returning({ id: addresses.id })
    addressId = created!.id
  }

  const date = parseDateInput(parsed.data.date)
  const time = parseTimeInput(parsed.data.startTime)
  if (!date || !time) return { error: 'Enter a valid date and start time.' }

  const scheduledStart = zonedDateTimeToInstant(date, time, ORG_TIMEZONE)
  const scheduledEnd = new Date(scheduledStart.getTime() + service.durationMinutes * 60_000)
  if (scheduledStart.getTime() <= Date.now()) {
    return { error: 'Pick a start time in the future.' }
  }

  let cleanerId: string | null = null
  if (parsed.data.cleanerId) {
    const [cleaner] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, parsed.data.cleanerId),
          eq(users.orgId, admin.orgId),
          eq(users.role, 'cleaner'),
        ),
      )
      .limit(1)
    if (!cleaner) return { error: 'Cleaner not found.' }
    cleanerId = cleaner.id

    const conflicts = await findConflictingBookings({
      cleanerId,
      scheduledStart,
      scheduledEnd,
    })
    if (conflicts.length > 0) {
      return { error: 'That cleaner already has a job overlapping this time slot.' }
    }
  }

  await db.insert(bookings).values({
    orgId: admin.orgId,
    customerId: customer.id,
    cleanerId,
    serviceId: service.id,
    addressId,
    scheduledStart,
    scheduledEnd,
    status: 'confirmed',
    amountCents: service.priceCents,
    notes: parsed.data.notes || null,
  })

  revalidateBookingPaths()
  redirect('/admin')
}

