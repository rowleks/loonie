import { cache } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { UserRole } from '@/db/schema'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: UserRole
  orgId: string
}

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'cleaner':
      return '/jobs'
    default:
      return '/dashboard'
  }
}

/** Cached per-request: returns the signed-in user or null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  if (!session?.user?.id || !session.user.role || !session.user.orgId) return null
  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    orgId: session.user.orgId,
  }
})

/** Redirects to sign-in when unauthenticated. Use in role-group layouts and server actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')
  return user
}

/**
 * Enforces a role server-side. Wrong-role users are sent to their own
 * dashboard, anonymous users to sign-in. UI-level hiding is UX only —
 * every mutating action must still re-check role/ownership itself.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(dashboardPathForRole(user.role))
  return user
}
