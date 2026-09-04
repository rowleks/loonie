/* eslint-disable no-console */
/**
 * Demo data for local development / staging: services, demo customers with
 * addresses, two cleaners, and today's bookings (assigned + unassigned) so
 * both the admin and cleaner dashboards have something real to show.
 *
 * Run manually: `npm run db:seed:demo` — safe to re-run (idempotent).
 * Demo passwords are for development only, never production.
 */
// Must be imported before `../db`: it loads .env.local (see scripts/seed.ts).
import './env'
import bcrypt from 'bcryptjs'
import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { addresses, bookings, organizations, services, users } from '../db/schema'
import {
  calendarDateInTz,
  zonedDateTimeToInstant,
} from '../lib/datetime'

export const DEMO_PASSWORD = 'LoonieDemo123!'

const DEMO_SERVICES = [
  {
    name: 'Standard Clean',
    slug: 'standard-clean',
    description: 'Regular residential clean — kitchens, bathrooms, floors, dusting.',
    priceCents: 14900,
    durationMinutes: 180,
  },
  {
    name: 'Deep Clean',
    slug: 'deep-clean',
    description: 'Top-to-bottom clean including appliances, baseboards and windows.',
    priceCents: 24900,
    durationMinutes: 300,
  },
  {
    name: 'Move-out Clean',
    slug: 'move-out-clean',
    description: 'Empty-unit clean for deposit returns — cabinets, walls, fixtures.',
    priceCents: 19900,
    durationMinutes: 240,
  },
  {
    name: 'Office Clean',
    slug: 'office-clean',
    description: 'Commercial clean for small offices — desks, washrooms, kitchenette.',
    priceCents: 17900,
    durationMinutes: 180,
  },
]

const DEMO_PEOPLE = [
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '(604) 555-0134',
    role: 'customer' as const,
    addresses: [
      { label: 'Home', street: '123 W Broadway', unit: null, city: 'Vancouver', postalCode: 'V5Y 1P1', isDefault: true },
      { label: 'Condo', street: '888 Beach Ave', unit: '1402', city: 'Vancouver', postalCode: 'V6Z 3B5', isDefault: false },
    ],
  },
  {
    name: 'Marcus Chen',
    email: 'marcus@example.com',
    phone: '(778) 555-0177',
    role: 'customer' as const,
    addresses: [
      { label: 'Home', street: '145 Lonsdale Ave', unit: null, city: 'North Vancouver', postalCode: 'V7M 2E9', isDefault: true },
    ],
  },
  {
    name: 'GreenLeaf Office Ltd',
    email: 'ops@greenleaf.example.com',
    phone: '(604) 555-0192',
    role: 'customer' as const,
    addresses: [
      { label: 'Office', street: '550 Pacific Blvd', unit: '300', city: 'Vancouver', postalCode: 'V6B 4K4', isDefault: true },
    ],
  },
  {
    name: 'Dana Okafor',
    email: 'dana@loonie.example.com',
    phone: '(604) 555-0111',
    role: 'cleaner' as const,
    addresses: [],
  },
  {
    name: 'Luis Fernandez',
    email: 'luis@loonie.example.com',
    phone: '(604) 555-0122',
    role: 'cleaner' as const,
    addresses: [],
  },
]

function shiftDate(
  date: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  }
}

async function main() {
  // Phase 1 has exactly one org (see lib/org.ts).
  const [org] = await db
    .select()
    .from(organizations)
    .orderBy(asc(organizations.createdAt))
    .limit(1)
  if (!org) throw new Error('No organization found — run `npm run db:seed` first.')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  // Services — unique per (org, slug), so re-runs are no-ops.
  await db
    .insert(services)
    .values(DEMO_SERVICES.map((service) => ({ ...service, orgId: org.id })))
    .onConflictDoNothing()

  // People — keyed on globally-unique email.
  const userIds = new Map<string, string>()
  for (const person of DEMO_PEOPLE) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, person.email))
      .limit(1)
    if (existing) {
      userIds.set(person.email, existing.id)
      continue
    }
    const [created] = await db
      .insert(users)
      .values({
        orgId: org.id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        passwordHash,
        role: person.role,
      })
      .returning({ id: users.id })
    userIds.set(person.email, created!.id)
  }

  // Addresses for demo customers (demo labels are unique per person).
  const addressIds = new Map<string, string>()
  for (const person of DEMO_PEOPLE) {
    if (person.addresses.length === 0) continue
    const userId = userIds.get(person.email)!
    const existing = await db
      .select({ id: addresses.id, label: addresses.label })
      .from(addresses)
      .where(eq(addresses.userId, userId))
    for (const address of person.addresses) {
      if (existing.some((row) => row.label === address.label)) continue
      const [created] = await db
        .insert(addresses)
        .values({ orgId: org.id, userId, ...address })
        .returning({ id: addresses.id })
      addressIds.set(address.label, created!.id)
    }
  }

  const priyaId = userIds.get('priya@example.com')!
  const marcusId = userIds.get('marcus@example.com')!
  const greenleafId = userIds.get('ops@greenleaf.example.com')!
  const danaId = userIds.get('dana@loonie.example.com')!
  const luisId = userIds.get('luis@loonie.example.com')!

  const serviceRows = await db
    .select({
      id: services.id,
      slug: services.slug,
      priceCents: services.priceCents,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(eq(services.orgId, org.id))
  const service = (slug: string) => {
    const row = serviceRows.find((s) => s.slug === slug)
    if (!row) throw new Error(`Service ${slug} missing — services insert failed.`)
    return row
  }

  // Bookings: skip if demo bookings already exist for the demo customers.
  const existingBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(inArray(bookings.customerId, [priyaId, marcusId, greenleafId]))
    .limit(1)
  if (existingBookings.length > 0) {
    console.log('Demo bookings already present — skipping booking inserts.')
    return
  }

  const now = new Date()
  const today = calendarDateInTz(now)
  const yesterday = shiftDate(today, -1)
  const tomorrow = shiftDate(today, 1)

  const at = (
    date: { year: number; month: number; day: number },
    hours: number,
  ) => zonedDateTimeToInstant(date, { hours, minutes: 0 })

  const demoBookings = [
    {
      // Yesterday — completed, feeds the month revenue metric.
      customerId: priyaId,
      cleanerId: danaId,
      addressLabel: 'Home',
      slug: 'standard-clean',
      date: yesterday,
      start: 10,
      status: 'completed' as const,
      notes: null,
    },
    {
      customerId: priyaId,
      cleanerId: danaId,
      addressLabel: 'Home',
      slug: 'standard-clean',
      date: today,
      start: 9,
      status: 'confirmed' as const,
      notes: 'Please use the side door — gate code 4413.',
    },
    {
      customerId: marcusId,
      cleanerId: luisId,
      addressLabel: 'Home',
      slug: 'deep-clean',
      date: today,
      start: 10,
      status: 'in_progress' as const,
      notes: null,
    },
    {
      customerId: greenleafId,
      cleanerId: danaId,
      addressLabel: 'Office',
      slug: 'office-clean',
      date: today,
      start: 13,
      status: 'confirmed' as const,
      notes: 'Park in visitor stalls P2–P4.',
    },
    {
      // Unassigned today — triggers the admin "needs a cleaner" alert.
      customerId: priyaId,
      cleanerId: null,
      addressLabel: 'Condo',
      slug: 'move-out-clean',
      date: today,
      start: 15,
      status: 'confirmed' as const,
      notes: null,
    },
    {
      // Unassigned tomorrow — keeps the alert visible beyond today.
      customerId: marcusId,
      cleanerId: null,
      addressLabel: 'Home',
      slug: 'standard-clean',
      date: tomorrow,
      start: 9,
      status: 'confirmed' as const,
      notes: null,
    },
  ]

  await db.insert(bookings).values(
    demoBookings.map((booking) => {
      const svc = service(booking.slug)
      const scheduledStart = at(booking.date, booking.start)
      return {
        orgId: org.id,
        customerId: booking.customerId,
        cleanerId: booking.cleanerId,
        serviceId: svc.id,
        addressId: addressIds.get(booking.addressLabel)!,
        scheduledStart,
        scheduledEnd: new Date(scheduledStart.getTime() + svc.durationMinutes * 60_000),
        status: booking.status,
        amountCents: svc.priceCents,
        notes: booking.notes,
      }
    }),
  )

  console.log('Demo data seeded:')
  console.log('  services:       4 (unique per org slug)')
  console.log('  demo people:    3 customers, 2 cleaners')
  console.log(`  demo password:  ${DEMO_PASSWORD} (development only)`)
  console.log(`  bookings:       ${demoBookings.length} (yesterday → tomorrow)`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

