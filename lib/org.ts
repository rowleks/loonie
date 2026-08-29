import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { organizations } from '@/db/schema'

/**
 * Returns the first (oldest) organization — for Phase 1 there is exactly one
 * (Loonie). Multi-org onboarding in Phase 3 will replace this with proper
 * org-scoping; until then new users land in the primary org.
 */
export async function getPrimaryOrgId(): Promise<string> {
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .orderBy(asc(organizations.createdAt))
    .limit(1)

  if (!org) {
    throw new Error('No organization found — run `npm run db:seed` first.')
  }

  return org.id
}
