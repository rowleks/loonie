import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['customer', 'cleaner', 'admin'])

export type UserRole = (typeof userRoleEnum.enumValues)[number]

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
