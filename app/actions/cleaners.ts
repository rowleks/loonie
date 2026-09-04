'use server'

import bcrypt from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { users } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { inviteCleanerSchema, setCleanerActiveSchema } from '@/lib/validators'
import type { FormState } from '@/lib/form-state'

/**
 * Cleaner management. Note: "invite" here creates the account with an initial
 * password the office shares manually — automated email invites need Resend,
 * which is a Phase 2 item (PRD §4). Flagged in the UI.
 */
export async function inviteCleanerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = inviteCleanerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  }

  // Email is globally unique (users_email_unique).
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1)
  if (existing) return { error: 'An account with this email already exists.' }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await db.insert(users).values({
    orgId: admin.orgId,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    passwordHash,
    role: 'cleaner',
  })

  revalidatePath('/admin/cleaners')
  return {
    error: null,
    success: `${parsed.data.name} added. Share the initial password with them securely — email invites arrive in Phase 2.`,
  }
}

export async function setCleanerActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = setCleanerActiveSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }

  // Target must be a cleaner in the admin's own org — never another org or role.
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, parsed.data.userId),
        eq(users.orgId, admin.orgId),
        eq(users.role, 'cleaner'),
      ),
    )
    .limit(1)
  if (!target) return { error: 'Cleaner not found.' }

  await db
    .update(users)
    .set({
      deactivatedAt: parsed.data.active === '1' ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, target.id))

  revalidatePath('/admin/cleaners')
  revalidatePath('/admin')
  return {
    error: null,
    success:
      parsed.data.active === '1'
        ? 'Cleaner reactivated.'
        : 'Cleaner deactivated — they can no longer sign in.',
  }
}
