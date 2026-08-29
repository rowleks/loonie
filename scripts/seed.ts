/* eslint-disable no-console */
/**
 * Bootstrap seed: creates the primary organization and the first admin user.
 * Run manually: `npm run db:seed`
 *
 * Credentials come from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env.local —
 * never hardcoded here. Safe to re-run (idempotent).
 */
// Must be imported before `../db`: it loads .env.local, and db/index.ts throws
// without DATABASE_URL. Static-import evaluation order makes this safe.
import './env'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { organizations, users } from '../db/schema'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? 'Loonie Cleaning Services'
  const slug = slugify(orgName)

  await db
    .insert(organizations)
    .values({ name: orgName, slug })
    .onConflictDoNothing({ target: organizations.slug })

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1)
  if (!org) throw new Error('Failed to create/fetch organization.')

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    console.error(
      'Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local to seed the first admin.',
    )
    process.exit(1)
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (existing) {
    console.log(`Admin ${email} already exists — skipping user insert.`)
    console.log(`Organization ready: ${org.name} (${org.id})`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.insert(users).values({
    orgId: org.id,
    name: 'Loonie Admin',
    email,
    passwordHash,
    role: 'admin',
  })

  console.log('Seeded:')
  console.log(`  organization: ${org.name} (${org.id})`)
  console.log(`  admin:        ${email}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
