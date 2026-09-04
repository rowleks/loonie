import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import {
  addresses,
  bookings,
  services,
  users,
  type BookingStatus,
} from '@/db/schema'
import { BLOCKING_STATUSES } from '@/lib/availability'
import { getStartOfZonedMonth, getTodayRange } from '@/lib/datetime'

/**
 * Composable booking queries shared across the admin and cleaner surfaces
 * (AGENTS.md: prefer small queries in lib/ over inline queries in pages).
 */

export type BookingListItem = {
  id: string
  status: BookingStatus
  scheduledStart: Date
  scheduledEnd: Date
  amountCents: number
  notes: string | null
  service: { name: string; durationMinutes: number }
  address: {
    unit: string | null
    street: string
    city: string
    province: string
    postalCode: string
  }
  customer: { id: string; name: string; phone: string | null }
  cleaner: { id: string; name: string } | null
}

export type CleanerOption = { id: string; name: string }

export type ServiceOption = {
  id: string
  name: string
  description: string | null
  priceCents: number
  durationMinutes: number
}

export type AddressOption = {
  id: string
  label: string | null
  unit: string | null
  street: string
  city: string
  province: string
  postalCode: string
  isDefault: boolean
}

export type CustomerOption = {
  id: string
  name: string
  phone: string | null
  addresses: AddressOption[]
}

const cleanerUsers = alias(users, 'cleaner')

const bookingSelection = {
  id: bookings.id,
  status: bookings.status,
  scheduledStart: bookings.scheduledStart,
  scheduledEnd: bookings.scheduledEnd,
  amountCents: bookings.amountCents,
  notes: bookings.notes,
  serviceName: services.name,
  serviceDurationMinutes: services.durationMinutes,
  addressUnit: addresses.unit,
  addressStreet: addresses.street,
  addressCity: addresses.city,
  addressProvince: addresses.province,
  addressPostalCode: addresses.postalCode,
  customerId: users.id,
  customerName: users.name,
  customerPhone: users.phone,
  cleanerId: cleanerUsers.id,
  cleanerName: cleanerUsers.name,
}

function toListItem(row: Record<keyof typeof bookingSelection, unknown>): BookingListItem {
  return {
    id: row.id as string,
    status: row.status as BookingStatus,
    scheduledStart: row.scheduledStart as Date,
    scheduledEnd: row.scheduledEnd as Date,
    amountCents: row.amountCents as number,
    notes: (row.notes as string | null) ?? null,
    service: {
      name: row.serviceName as string,
      durationMinutes: row.serviceDurationMinutes as number,
    },
    address: {
      unit: (row.addressUnit as string | null) ?? null,
      street: row.addressStreet as string,
      city: row.addressCity as string,
      province: row.addressProvince as string,
      postalCode: row.addressPostalCode as string,
    },
    customer: {
      id: row.customerId as string,
      name: row.customerName as string,
      phone: (row.customerPhone as string | null) ?? null,
    },
    cleaner:
      row.cleanerId && row.cleanerName
        ? { id: row.cleanerId as string, name: row.cleanerName as string }
        : null,
  }
}

function baseBookingQuery() {
  return db
    .select(bookingSelection)
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(addresses, eq(bookings.addressId, addresses.id))
    .innerJoin(users, eq(bookings.customerId, users.id))
    .leftJoin(cleanerUsers, eq(bookings.cleanerId, cleanerUsers.id))
}

/** Bookings whose scheduled start falls within [start, end), in order. */
export async function getBookingsStartingBetween(
  orgId: string,
  start: Date,
  end: Date,
): Promise<BookingListItem[]> {
  const rows = await baseBookingQuery()
    .where(
      and(
        eq(bookings.orgId, orgId),
        gte(bookings.scheduledStart, start),
        lt(bookings.scheduledStart, end),
      ),
    )
    .orderBy(asc(bookings.scheduledStart))
  return rows.map(toListItem)
}

/** All bookings starting on/after `start` (upcoming view), in order. */
export async function getBookingsFrom(
  orgId: string,
  start: Date,
): Promise<BookingListItem[]> {
  const rows = await baseBookingQuery()
    .where(and(eq(bookings.orgId, orgId), gte(bookings.scheduledStart, start)))
    .orderBy(asc(bookings.scheduledStart))
  return rows.map(toListItem)
}

/** Recent past bookings (ended before `end`), newest first. */
export async function getPastBookings(
  orgId: string,
  end: Date,
  limit = 50,
): Promise<BookingListItem[]> {
  const rows = await baseBookingQuery()
    .where(and(eq(bookings.orgId, orgId), lt(bookings.scheduledEnd, end)))
    .orderBy(desc(bookings.scheduledStart))
    .limit(limit)
  return rows.map(toListItem)
}

/** Upcoming bookings still needing a cleaner — the admin dashboard alert. */
export async function getUnassignedUpcoming(
  orgId: string,
  now: Date,
): Promise<BookingListItem[]> {
  const rows = await baseBookingQuery()
    .where(
      and(
        eq(bookings.orgId, orgId),
        isNull(bookings.cleanerId),
        inArray(bookings.status, ['pending', 'confirmed']),
        gte(bookings.scheduledStart, now),
      ),
    )
    .orderBy(asc(bookings.scheduledStart))
  return rows.map(toListItem)
}

/** A cleaner's assigned jobs within [start, end), in order. */
export async function getCleanerDayBookings(
  cleanerId: string,
  orgId: string,
  start: Date,
  end: Date,
): Promise<BookingListItem[]> {
  const rows = await baseBookingQuery()
    .where(
      and(
        eq(bookings.orgId, orgId),
        eq(bookings.cleanerId, cleanerId),
        gte(bookings.scheduledStart, start),
        lt(bookings.scheduledStart, end),
      ),
    )
    .orderBy(asc(bookings.scheduledStart))
  return rows.map(toListItem)
}

/** A cleaner's finished/cancelled/past jobs, newest first. */
export async function getCleanerBookingHistory(
  cleanerId: string,
  orgId: string,
  now: Date,
  limit = 50,
): Promise<BookingListItem[]> {
  const rows = await baseBookingQuery()
    .where(
      and(
        eq(bookings.orgId, orgId),
        eq(bookings.cleanerId, cleanerId),
        or(
          lt(bookings.scheduledEnd, now),
          inArray(bookings.status, ['completed', 'cancelled']),
        ),
      ),
    )
    .orderBy(desc(bookings.scheduledStart))
    .limit(limit)
  return rows.map(toListItem)
}

/** Blocking (time-holding) bookings in a window — input for conflict pre-filters. */
export function getScheduledBookingsBetween(
  orgId: string,
  start: Date,
  end: Date,
): Promise<
  Array<{
    id: string
    cleanerId: string | null
    status: BookingStatus
    scheduledStart: Date
    scheduledEnd: Date
  }>
> {
  return db
    .select({
      id: bookings.id,
      cleanerId: bookings.cleanerId,
      status: bookings.status,
      scheduledStart: bookings.scheduledStart,
      scheduledEnd: bookings.scheduledEnd,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.orgId, orgId),
        inArray(bookings.status, BLOCKING_STATUSES),
        lt(bookings.scheduledStart, end),
        gt(bookings.scheduledEnd, start),
      ),
    )
}

/** Active cleaners available for assignment. */
export function getActiveCleaners(orgId: string): Promise<CleanerOption[]> {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.orgId, orgId),
        eq(users.role, 'cleaner'),
        isNull(users.deactivatedAt),
      ),
    )
    .orderBy(asc(users.name))
}

/** All cleaners for the management page, including deactivated ones. */
export function getCleanersForAdmin(
  orgId: string,
): Promise<
  Array<{
    id: string
    name: string
    email: string
    phone: string | null
    deactivatedAt: Date | null
  }>
> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      deactivatedAt: users.deactivatedAt,
    })
    .from(users)
    .where(and(eq(users.orgId, orgId), eq(users.role, 'cleaner')))
    .orderBy(asc(users.name))
}

/** Active customers with their saved addresses — for the phone-booking form. */
export async function getCustomersWithAddresses(
  orgId: string,
): Promise<CustomerOption[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      addressId: addresses.id,
      addressLabel: addresses.label,
      addressUnit: addresses.unit,
      addressStreet: addresses.street,
      addressCity: addresses.city,
      addressProvince: addresses.province,
      addressPostalCode: addresses.postalCode,
      addressIsDefault: addresses.isDefault,
    })
    .from(users)
    .leftJoin(addresses, eq(addresses.userId, users.id))
    .where(
      and(
        eq(users.orgId, orgId),
        eq(users.role, 'customer'),
        isNull(users.deactivatedAt),
      ),
    )
    .orderBy(asc(users.name))

  const byCustomer = new Map<string, CustomerOption>()
  for (const row of rows) {
    let customer = byCustomer.get(row.id)
    if (!customer) {
      customer = { id: row.id, name: row.name, phone: row.phone, addresses: [] }
      byCustomer.set(row.id, customer)
    }
    if (row.addressId) {
      // Left-join typing makes address columns nullable, but they are always
      // populated when addressId exists.
      customer.addresses.push({
        id: row.addressId,
        label: row.addressLabel,
        unit: row.addressUnit,
        street: row.addressStreet!,
        city: row.addressCity!,
        province: row.addressProvince!,
        postalCode: row.addressPostalCode!,
        isDefault: row.addressIsDefault!,
      })
    }
  }
  return [...byCustomer.values()]
}

export function getActiveServices(orgId: string): Promise<ServiceOption[]> {
  return db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      priceCents: services.priceCents,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(and(eq(services.orgId, orgId), eq(services.isActive, true)))
    .orderBy(asc(services.name))
}

export type AdminMetrics = {
  todayCount: number
  unassignedCount: number
  monthRevenueCents: number
  monthCompletedCount: number
}

/** Headline numbers for the admin dashboard. */
export async function getAdminMetrics(
  orgId: string,
  now: Date = new Date(),
): Promise<AdminMetrics> {
  const today = getTodayRange(now)
  const monthStart = getStartOfZonedMonth(now)

  const [todayRow] = await db
    .select({ value: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.orgId, orgId),
        gte(bookings.scheduledStart, today.start),
        lt(bookings.scheduledStart, today.end),
        ne(bookings.status, 'cancelled'),
      ),
    )

  const [unassignedRow] = await db
    .select({ value: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.orgId, orgId),
        isNull(bookings.cleanerId),
        inArray(bookings.status, ['pending', 'confirmed']),
        gte(bookings.scheduledStart, now),
      ),
    )

  const [revenueRow] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${bookings.amountCents}), 0)::int`,
      completed: count(),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.orgId, orgId),
        eq(bookings.status, 'completed'),
        gte(bookings.scheduledStart, monthStart),
      ),
    )

  return {
    todayCount: Number(todayRow?.value ?? 0),
    unassignedCount: Number(unassignedRow?.value ?? 0),
    monthRevenueCents: Number(revenueRow?.revenue ?? 0),
    monthCompletedCount: Number(revenueRow?.completed ?? 0),
  }
}




