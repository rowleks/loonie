import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['customer', 'cleaner', 'admin'])
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
])

export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number]

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('organizations_slug_unique').on(table.slug)])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  /** Optional contact number — used by the cleaner view's tap-to-call. */
  phone: text('phone'),
  /** bcrypt hash — nullable so invited cleaners/admins can exist before setting a password */
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('customer'),
  /** soft deactivation — non-null means sign-in is blocked (supports admin deactivation flow) */
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_email_unique').on(table.email),
  index('users_org_id_idx').on(table.orgId),
  index('users_role_idx').on(table.role),
])

export type Organization = typeof organizations.$inferSelect
export type User = typeof users.$inferSelect

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  /** Flat per-service price for v1 (PRD §10 open question — revisit for quotes). */
  priceCents: integer('price_cents').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('services_org_slug_unique').on(table.orgId, table.slug)])

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label'),
  street: text('street').notNull(),
  unit: text('unit'),
  city: text('city').notNull(),
  province: text('province').notNull().default('BC'),
  /** Canadian postal code — the static service-area check (PRD §7) keys on its prefix. */
  postalCode: text('postal_code').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('addresses_user_id_idx').on(table.userId)])

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  /** Assigned cleaner — null means the job needs assignment (admin alert). */
  cleanerId: uuid('cleaner_id').references(() => users.id, { onDelete: 'set null' }),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'restrict' }),
  addressId: uuid('address_id')
    .notNull()
    .references(() => addresses.id, { onDelete: 'restrict' }),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  notes: text('notes'),
  /**
   * Reserved for the Stripe Checkout integration (next stage): the webhook
   * that fulfils a session looks the booking up by this id. Null for
   * admin-created (phone) bookings, which are taken as paid offline.
   */
  stripeCheckoutSessionId: text('stripe_checkout_session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('bookings_org_scheduled_idx').on(table.orgId, table.scheduledStart),
  index('bookings_cleaner_scheduled_idx').on(table.cleanerId, table.scheduledStart),
  index('bookings_customer_scheduled_idx').on(table.customerId, table.scheduledStart),
  index('bookings_status_idx').on(table.status),
])

export type Service = typeof services.$inferSelect
export type Address = typeof addresses.$inferSelect
export type Booking = typeof bookings.$inferSelect
